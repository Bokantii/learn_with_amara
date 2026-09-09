import { test, expect, type Page } from '@playwright/test';

/**
 * QR attendance (Phase 2 Task 6). Covers: session start/QR, entitled check-in
 * (PRESENT/LATE), the unauthenticated-scan sign-in round trip, duplicate/replay
 * protection, wrong-program and group-scope rejection, session close, token
 * regeneration, cancelled-class rejection, computed ABSENT, manual override,
 * cross-student isolation, non-staff lockout, the mobile API contract, and
 * INSTRUCTOR access.
 *
 * Each test schedules its own class through the real admin UI so `startsAt`
 * can be relative to "now". Requires the seeded users (see prisma/seed.ts):
 * admin@iclp.com, instructor@iclp.com, aisha.bello@example.com (tcf + morning
 * cohort), noah.park@example.com (tcf, not in the cohort), marcus.chen@example.com
 * (tef only).
 */

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/SignIn');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/SignIn'));
}

function localDateTimeParts(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    dateStr: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    timeStr: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

/** Schedules a class via the admin UI; returns its title. Admin must be signed in. */
async function scheduleClass(
  page: Page,
  opts: { minutesFromNow: number; durationMinutes?: number; groupName?: string }
): Promise<string> {
  const title = `E2E Attend ${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const start = new Date(Date.now() + opts.minutesFromNow * 60_000);
  const end = new Date(start.getTime() + (opts.durationMinutes ?? 60) * 60_000);
  const s = localDateTimeParts(start);
  const e = localDateTimeParts(end);

  await page.goto('/admin/liveclasses');
  await page.getByRole('button', { name: 'Schedule Class', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Program').click();
  await page.getByRole('option', { name: 'TCF Exam Preparation' }).click();
  if (opts.groupName) {
    await dialog.getByLabel('Group (optional)').click();
    await page.getByRole('option', { name: opts.groupName }).click();
  }
  await dialog.getByLabel('Title').fill(title);
  await dialog.getByLabel('Instructor').fill('Test Instructor');
  await dialog.getByLabel('Start date').fill(s.dateStr);
  await dialog.getByLabel('Start time').fill(s.timeStr);
  await dialog.getByLabel('End date').fill(e.dateStr);
  await dialog.getByLabel('End time').fill(e.timeStr);
  await dialog.getByRole('button', { name: 'Schedule Class', exact: true }).click();
  await expect(page.getByText(title)).toBeVisible();
  return title;
}

/** From the admin live-classes list, open a class's attendance-manage page. */
async function openManage(page: Page, title: string) {
  await page.goto('/admin/liveclasses');
  const card = page.locator('[data-slot="card"]', { hasText: title });
  await card.getByRole('link', { name: `Attendance for ${title}` }).click();
  await page.waitForURL(/\/attendance\/manage\/[^/]+$/);
}

/** Starts a session and returns the relative check-in path (`/attendance/checkin?token=...`). */
async function startAndGetCheckInPath(page: Page): Promise<string> {
  await page.getByRole('button', { name: 'Start Attendance' }).click();
  const raw = await page.getByTestId('checkin-url').textContent();
  expect(raw).toBeTruthy();
  const url = new URL(raw!.trim());
  return url.pathname + url.search;
}

test.describe('QR attendance — staff session + student check-in', () => {
  test('admin starts a session, QR + live count render; entitled student checks in PRESENT', async ({ browser }) => {
    const admin = await browser.newContext();
    const adminPage = await admin.newPage();
    await signIn(adminPage, 'admin@iclp.com', 'admin1234');
    const title = await scheduleClass(adminPage, { minutesFromNow: 2 });
    await openManage(adminPage, title);
    const checkInPath = await startAndGetCheckInPath(adminPage);
    await expect(adminPage.locator('svg[role="img"], svg').first()).toBeVisible();
    await expect(adminPage.getByText('checked in via QR')).toBeVisible();

    const studentCtx = await browser.newContext();
    const studentPage = await studentCtx.newPage();
    await signIn(studentPage, 'aisha.bello@example.com', 'student1234');
    await studentPage.goto(checkInPath);
    await studentPage.getByRole('button', { name: 'Confirm Check-In' }).click();
    await expect(studentPage.getByText('You are checked in.')).toBeVisible();
    await expect(studentPage.getByText('Present')).toBeVisible();

    await admin.close();
    await studentCtx.close();
  });

  test('checking in well after the class start is recorded LATE', async ({ browser }) => {
    const admin = await browser.newContext();
    const adminPage = await admin.newPage();
    await signIn(adminPage, 'admin@iclp.com', 'admin1234');
    // Start time 20 min ago → beyond the 10-min PRESENT window.
    const title = await scheduleClass(adminPage, { minutesFromNow: -20, durationMinutes: 90 });
    await openManage(adminPage, title);
    const checkInPath = await startAndGetCheckInPath(adminPage);

    const studentCtx = await browser.newContext();
    const studentPage = await studentCtx.newPage();
    await signIn(studentPage, 'aisha.bello@example.com', 'student1234');
    await studentPage.goto(checkInPath);
    await studentPage.getByRole('button', { name: 'Confirm Check-In' }).click();
    await expect(studentPage.getByText('You are checked in.')).toBeVisible();
    await expect(studentPage.getByText('Late')).toBeVisible();

    await admin.close();
    await studentCtx.close();
  });

  test('unauthenticated scan redirects to sign-in and resumes on the check-in page', async ({ browser }) => {
    const admin = await browser.newContext();
    const adminPage = await admin.newPage();
    await signIn(adminPage, 'admin@iclp.com', 'admin1234');
    const title = await scheduleClass(adminPage, { minutesFromNow: 2 });
    await openManage(adminPage, title);
    const checkInPath = await startAndGetCheckInPath(adminPage);

    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(checkInPath);
    await expect(anonPage).toHaveURL(/\/SignIn\?callbackUrl=/);
    await anonPage.getByLabel('Email').fill('aisha.bello@example.com');
    await anonPage.getByLabel('Password', { exact: true }).fill('student1234');
    await anonPage.getByRole('button', { name: 'Sign In' }).click();
    await anonPage.waitForURL(/\/attendance\/checkin\?token=/);
    await anonPage.getByRole('button', { name: 'Confirm Check-In' }).click();
    await expect(anonPage.getByText('You are checked in.')).toBeVisible();

    await admin.close();
    await anon.close();
  });

  test('a second check-in with the same token is rejected as already checked in', async ({ browser }) => {
    const admin = await browser.newContext();
    const adminPage = await admin.newPage();
    await signIn(adminPage, 'admin@iclp.com', 'admin1234');
    const title = await scheduleClass(adminPage, { minutesFromNow: 2 });
    await openManage(adminPage, title);
    const checkInPath = await startAndGetCheckInPath(adminPage);

    const studentCtx = await browser.newContext();
    const studentPage = await studentCtx.newPage();
    await signIn(studentPage, 'aisha.bello@example.com', 'student1234');
    await studentPage.goto(checkInPath);
    await studentPage.getByRole('button', { name: 'Confirm Check-In' }).click();
    await expect(studentPage.getByText('You are checked in.')).toBeVisible();

    await studentPage.goto(checkInPath);
    await studentPage.getByRole('button', { name: 'Confirm Check-In' }).click();
    await expect(studentPage.getByText('You are already checked in.')).toBeVisible();

    await admin.close();
    await studentCtx.close();
  });

  test('a student enrolled in a different program cannot check in', async ({ browser }) => {
    const admin = await browser.newContext();
    const adminPage = await admin.newPage();
    await signIn(adminPage, 'admin@iclp.com', 'admin1234');
    const title = await scheduleClass(adminPage, { minutesFromNow: 2 });
    await openManage(adminPage, title);
    const checkInPath = await startAndGetCheckInPath(adminPage);

    const studentCtx = await browser.newContext();
    const studentPage = await studentCtx.newPage();
    await signIn(studentPage, 'marcus.chen@example.com', 'student1234'); // TEF, not TCF
    await studentPage.goto(checkInPath);
    await studentPage.getByRole('button', { name: 'Confirm Check-In' }).click();
    await expect(studentPage.getByText('You are not enrolled in this class.')).toBeVisible();

    await admin.close();
    await studentCtx.close();
  });

  test('group-scoped class: a cohort member checks in, a same-program non-member is rejected', async ({ browser }) => {
    const admin = await browser.newContext();
    const adminPage = await admin.newPage();
    await signIn(adminPage, 'admin@iclp.com', 'admin1234');
    const title = await scheduleClass(adminPage, { minutesFromNow: 2, groupName: 'TCF Morning Cohort' });
    await openManage(adminPage, title);
    const checkInPath = await startAndGetCheckInPath(adminPage);

    const member = await browser.newContext();
    const memberPage = await member.newPage();
    await signIn(memberPage, 'aisha.bello@example.com', 'student1234');
    await memberPage.goto(checkInPath);
    await memberPage.getByRole('button', { name: 'Confirm Check-In' }).click();
    await expect(memberPage.getByText('You are checked in.')).toBeVisible();

    const nonMember = await browser.newContext();
    const nonMemberPage = await nonMember.newPage();
    await signIn(nonMemberPage, 'noah.park@example.com', 'student1234'); // TCF but not the cohort
    await nonMemberPage.goto(checkInPath);
    await nonMemberPage.getByRole('button', { name: 'Confirm Check-In' }).click();
    await expect(nonMemberPage.getByText('You are not enrolled in this class.')).toBeVisible();

    await admin.close();
    await member.close();
    await nonMember.close();
  });

  test('closing the session rejects a subsequent check-in with the generic message', async ({ browser }) => {
    const admin = await browser.newContext();
    const adminPage = await admin.newPage();
    await signIn(adminPage, 'admin@iclp.com', 'admin1234');
    const title = await scheduleClass(adminPage, { minutesFromNow: 2 });
    await openManage(adminPage, title);
    const checkInPath = await startAndGetCheckInPath(adminPage);
    await adminPage.getByRole('button', { name: 'Close Attendance' }).click();
    await expect(adminPage.getByRole('button', { name: 'Start Attendance' })).toBeVisible();

    const studentCtx = await browser.newContext();
    const studentPage = await studentCtx.newPage();
    await signIn(studentPage, 'aisha.bello@example.com', 'student1234');
    await studentPage.goto(checkInPath);
    // Preview itself is now invalid → the confirm button never appears.
    await expect(studentPage.getByText(/invalid or has expired/i)).toBeVisible();

    await admin.close();
    await studentCtx.close();
  });

  test('starting a new session invalidates the previous token', async ({ browser }) => {
    const admin = await browser.newContext();
    const adminPage = await admin.newPage();
    await signIn(adminPage, 'admin@iclp.com', 'admin1234');
    const title = await scheduleClass(adminPage, { minutesFromNow: 2 });
    await openManage(adminPage, title);
    const firstPath = await startAndGetCheckInPath(adminPage);

    await adminPage.reload();
    await adminPage
      .getByRole('button', { name: /Start new session|New session|Start Attendance/ })
      .first()
      .click();
    await expect(adminPage.getByTestId('checkin-url')).toBeVisible();
    const raw = (await adminPage.getByTestId('checkin-url').textContent())!.trim();
    const secondUrl = new URL(raw);
    const secondPath = secondUrl.pathname + secondUrl.search;
    expect(secondPath).not.toEqual(firstPath);

    const studentCtx = await browser.newContext();
    const studentPage = await studentCtx.newPage();
    await signIn(studentPage, 'aisha.bello@example.com', 'student1234');
    await studentPage.goto(firstPath);
    await expect(studentPage.getByText(/invalid or has expired/i)).toBeVisible();

    await admin.close();
    await studentCtx.close();
  });

  test('a class cancelled after the session opened rejects a pending check-in', async ({ browser }) => {
    const admin = await browser.newContext();
    const adminPage = await admin.newPage();
    await signIn(adminPage, 'admin@iclp.com', 'admin1234');
    const title = await scheduleClass(adminPage, { minutesFromNow: 2 });
    await openManage(adminPage, title);
    const checkInPath = await startAndGetCheckInPath(adminPage);

    await adminPage.goto('/admin/liveclasses');
    await adminPage.getByLabel(`Cancel ${title}`).click();
    await adminPage.getByRole('dialog').getByRole('button', { name: 'Cancel Class' }).click();
    await adminPage.getByRole('tab', { name: 'Cancelled' }).click();
    await expect(adminPage.locator('[data-slot="card"]', { hasText: title })).toBeVisible();

    const studentCtx = await browser.newContext();
    const studentPage = await studentCtx.newPage();
    await signIn(studentPage, 'aisha.bello@example.com', 'student1234');
    await studentPage.goto(checkInPath);
    await expect(studentPage.getByText('This class is not currently accepting check-ins.')).toBeVisible();

    await admin.close();
    await studentCtx.close();
  });
});

test.describe('QR attendance — roster, override, history, isolation', () => {
  test('roster shows PRESENT for a check-in and computed ABSENT for a no-show; override to EXCUSED sticks', async ({ browser }) => {
    const admin = await browser.newContext();
    const adminPage = await admin.newPage();
    await signIn(adminPage, 'admin@iclp.com', 'admin1234');
    const title = await scheduleClass(adminPage, { minutesFromNow: -30, durationMinutes: 20 }); // already ended
    await openManage(adminPage, title);
    const checkInPath = await startAndGetCheckInPath(adminPage);

    const studentCtx = await browser.newContext();
    const studentPage = await studentCtx.newPage();
    await signIn(studentPage, 'aisha.bello@example.com', 'student1234');
    await studentPage.goto(checkInPath);
    await studentPage.getByRole('button', { name: 'Confirm Check-In' }).click();
    await expect(studentPage.getByText('You are checked in.')).toBeVisible();

    await adminPage.reload();
    const aishaRow = adminPage.locator('[data-slot="card"]', { hasText: 'Aisha Bello' });
    await expect(aishaRow.getByText(/Present|Late/)).toBeVisible();
    const noahRow = adminPage.locator('[data-slot="card"]', { hasText: 'Noah Park' });
    await expect(noahRow.getByText('Absent')).toBeVisible();

    // Override Noah -> EXCUSED
    await noahRow.getByRole('button', { name: 'Override' }).click();
    await noahRow.getByLabel('Status').click();
    await adminPage.getByRole('option', { name: 'Excused' }).click();
    await noahRow.getByRole('button', { name: 'Save' }).click();
    await expect(noahRow.getByText('Excused')).toBeVisible();

    // Student sees their own EXCUSED record persisted
    const noahCtx = await browser.newContext();
    const noahPage = await noahCtx.newPage();
    await signIn(noahPage, 'noah.park@example.com', 'student1234');
    await noahPage.goto('/attendance');
    await expect(noahPage.locator('[data-slot="card"]', { hasText: title }).getByText('Excused')).toBeVisible();

    await admin.close();
    await studentCtx.close();
    await noahCtx.close();
  });

  test('a student only sees their own attendance history', async ({ browser }) => {
    const admin = await browser.newContext();
    const adminPage = await admin.newPage();
    await signIn(adminPage, 'admin@iclp.com', 'admin1234');
    const title = await scheduleClass(adminPage, { minutesFromNow: -30, durationMinutes: 20 });
    await openManage(adminPage, title);
    const checkInPath = await startAndGetCheckInPath(adminPage);

    const aishaCtx = await browser.newContext();
    const aishaPage = await aishaCtx.newPage();
    await signIn(aishaPage, 'aisha.bello@example.com', 'student1234');
    await aishaPage.goto(checkInPath);
    await aishaPage.getByRole('button', { name: 'Confirm Check-In' }).click();
    await expect(aishaPage.getByText('You are checked in.')).toBeVisible();
    await aishaPage.goto('/attendance');
    await expect(aishaPage.locator('[data-slot="card"]', { hasText: title })).toBeVisible();

    // lucas.martin (same cohort, no check-in) must not see Aisha's row — and his
    // own entry for this class is a computed ABSENT, never Aisha's PRESENT.
    const lucasCtx = await browser.newContext();
    const lucasPage = await lucasCtx.newPage();
    await signIn(lucasPage, 'lucas.martin@example.com', 'student1234');
    await lucasPage.goto('/attendance');
    const lucasRow = lucasPage.locator('[data-slot="card"]', { hasText: title });
    await expect(lucasRow).toBeVisible();
    await expect(lucasRow.getByText('Absent')).toBeVisible();
    await expect(lucasRow.getByText('Present')).toHaveCount(0);

    await admin.close();
    await aishaCtx.close();
    await lucasCtx.close();
  });
});

test.describe('QR attendance — access control + API contract', () => {
  test('a student cannot reach the attendance-manage screens', async ({ page }) => {
    await signIn(page, 'aisha.bello@example.com', 'student1234');
    await page.goto('/attendance/manage');
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto('/attendance/manage/whatever');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('POST /api/attendance/checkin: 401 unauthenticated, 200 then 409 for a valid then replayed token', async ({ browser }) => {
    const admin = await browser.newContext();
    const adminPage = await admin.newPage();
    await signIn(adminPage, 'admin@iclp.com', 'admin1234');
    const title = await scheduleClass(adminPage, { minutesFromNow: 2 });
    await openManage(adminPage, title);
    const checkInPath = await startAndGetCheckInPath(adminPage);
    const token = new URL(checkInPath, 'http://localhost').searchParams.get('token')!;

    const anon = await browser.newContext();
    const anonReq = await anon.newPage();
    const unauth = await anonReq.request.post('/api/attendance/checkin', { data: { token } });
    expect(unauth.status()).toBe(401);

    const studentCtx = await browser.newContext();
    const studentPage = await studentCtx.newPage();
    await signIn(studentPage, 'aisha.bello@example.com', 'student1234');
    const ok = await studentPage.request.post('/api/attendance/checkin', { data: { token } });
    expect(ok.status()).toBe(200);
    expect((await ok.json()).status).toMatch(/PRESENT|LATE/);

    const replay = await studentPage.request.post('/api/attendance/checkin', { data: { token } });
    expect(replay.status()).toBe(409);
    expect((await replay.json()).reason).toBe('ALREADY_CHECKED_IN');

    await admin.close();
    await anon.close();
    await studentCtx.close();
  });

  test('an INSTRUCTOR can start a session and view the roster', async ({ browser }) => {
    // Requires the seeded instructor@iclp.com (prisma/seed.ts). Skip cleanly if
    // the DB predates that fixture.
    const admin = await browser.newContext();
    const adminPage = await admin.newPage();
    await signIn(adminPage, 'admin@iclp.com', 'admin1234');
    const title = await scheduleClass(adminPage, { minutesFromNow: 2 });
    await admin.close();

    const instr = await browser.newContext();
    const instrPage = await instr.newPage();
    await instrPage.goto('/SignIn');
    await instrPage.getByLabel('Email').fill('instructor@iclp.com');
    await instrPage.getByLabel('Password', { exact: true }).fill('admin1234');
    await instrPage.getByRole('button', { name: 'Sign In' }).click();
    const landed = await instrPage
      .waitForURL((url) => !url.pathname.startsWith('/SignIn'), { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!landed, 'instructor@iclp.com not seeded — run `npx prisma db seed`');

    await instrPage.goto('/attendance/manage');
    await expect(instrPage.getByRole('heading', { name: 'Attendance' })).toBeVisible();
    await instrPage.locator('a', { hasText: title }).click();
    await instrPage.waitForURL(/\/attendance\/manage\/[^/]+$/);
    await instrPage.getByRole('button', { name: 'Start Attendance' }).click();
    await expect(instrPage.getByTestId('checkin-url')).toBeVisible();
    await expect(instrPage.getByText('Roster')).toBeVisible();

    await instr.close();
  });
});
