import { test, expect, type Page } from '@playwright/test';

/**
 * Announcements + communication events (Phase 2 Task 10). Admins publish
 * announcements targeted to all students / a program / a group / one student;
 * students see only what is addressed to them; publishing produces an in-app
 * notification; archiving removes it from the student feed but keeps the admin
 * record. Publishing an assignment, grading one, and changing an enrollment each
 * also produce an in-app notification.
 *
 * Seeded fixtures: admin@iclp.com; aisha.bello (TCF, group g1); noah.park (TCF,
 * not g1); elena.rossi (DELF); lucas.martin (TCF, g1); pending.pay (PENDING
 * only — not a NOTIFY-status student). Seeded published announcements:
 * "Welcome to the new ICLP dashboard" (ALL), "TCF Exam Preparation: revised
 * weekly schedule" (PROGRAM tcf), "A note about your placement result"
 * (STUDENT aisha).
 */

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/SignIn');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/SignIn'));
}

/** Create a draft announcement via the admin dialog, then publish it from its row. Returns the title. */
async function createAndPublish(
  page: Page,
  opts: { title: string; body: string; scope?: 'ALL' | 'PROGRAM' | 'GROUP'; target?: string; publish?: boolean }
): Promise<string> {
  await page.goto('/admin/announcements');
  await page.getByRole('button', { name: 'New announcement' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title').fill(opts.title);
  await dialog.getByLabel('Body').fill(opts.body);
  if (opts.scope && opts.scope !== 'ALL') {
    await dialog.getByLabel('Audience').click();
    await page.getByRole('option', { name: opts.scope === 'PROGRAM' ? 'A program' : 'A group' }).click();
    await dialog.getByLabel('Target').click();
    await page.getByRole('option', { name: opts.target!, exact: false }).first().click();
  }
  await dialog.getByRole('button', { name: 'Create draft' }).click();
  await expect(dialog).toBeHidden();

  const row = page.getByRole('row', { name: new RegExp(opts.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) });
  if (opts.publish !== false) {
    await row.getByRole('button', { name: 'Publish' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Publish' }).click();
    await expect(row.getByText('published')).toBeVisible();
  }
  return opts.title;
}

test.describe('student announcement feed targeting', () => {
  test('a PROGRAM announcement reaches enrolled students only', async ({ page }) => {
    await signIn(page, 'aisha.bello@example.com', 'student1234');
    await page.goto('/dashboard/announcements');
    await expect(page.getByText('TCF Exam Preparation: revised weekly schedule')).toBeVisible();

    await page.context().clearCookies();
    await signIn(page, 'elena.rossi@example.com', 'student1234');
    await page.goto('/dashboard/announcements');
    await expect(page.getByText('TCF Exam Preparation: revised weekly schedule')).toHaveCount(0);
    // ...but she still gets the all-students one
    await expect(page.getByText('Welcome to the new ICLP dashboard')).toBeVisible();
  });

  test('an individual announcement reaches only that student', async ({ page }) => {
    await signIn(page, 'aisha.bello@example.com', 'student1234');
    await page.goto('/dashboard/announcements');
    await expect(page.getByText('A note about your placement result')).toBeVisible();

    await page.context().clearCookies();
    await signIn(page, 'lucas.martin@example.com', 'student1234');
    await page.goto('/dashboard/announcements');
    await expect(page.getByText('A note about your placement result')).toHaveCount(0);
  });

  test('a student with no NOTIFY-status enrollment sees the truthful empty state', async ({ page }) => {
    await signIn(page, 'pending.pay@example.com', 'student1234');
    await page.goto('/dashboard/announcements');
    await expect(page.getByText('No announcements yet')).toBeVisible();
  });
});

test.describe('admin publish + notification', () => {
  test('an ALL announcement reaches every student and rings the bell', async ({ page }) => {
    const title = `All-hands ${Date.now()}`;
    await signIn(page, 'admin@iclp.com', 'admin1234');
    await createAndPublish(page, { title, body: 'Everyone should see this.' });

    await page.context().clearCookies();
    await signIn(page, 'noah.park@example.com', 'student1234');
    await page.goto('/dashboard/announcements');
    await expect(page.getByText(title)).toBeVisible();
    // dashboard card too
    await page.goto('/dashboard');
    await expect(
      page.locator('[data-slot="card"]', { hasText: 'Announcements' }).getByText(title)
    ).toBeVisible();

    // in-app notification, deep-linking to the feed
    const bell = page.getByRole('button', { name: /Notifications/ });
    await bell.click();
    await page.getByRole('button').filter({ hasText: title }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/announcements$/);
  });

  test('a GROUP announcement reaches current members only', async ({ page }) => {
    const title = `Cohort note ${Date.now()}`;
    await signIn(page, 'admin@iclp.com', 'admin1234');
    await createAndPublish(page, {
      title,
      body: 'Morning cohort only.',
      scope: 'GROUP',
      target: 'TCF Morning Cohort',
    });

    await page.context().clearCookies();
    await signIn(page, 'aisha.bello@example.com', 'student1234'); // g1 member
    await page.goto('/dashboard/announcements');
    await expect(page.getByText(title)).toBeVisible();

    await page.context().clearCookies();
    await signIn(page, 'noah.park@example.com', 'student1234'); // TCF, not g1
    await page.goto('/dashboard/announcements');
    await expect(page.getByText(title)).toHaveCount(0);
  });

  test('archiving removes an announcement from the student feed but keeps the admin record', async ({
    page,
  }) => {
    const title = `Temporary notice ${Date.now()}`;
    await signIn(page, 'admin@iclp.com', 'admin1234');
    await createAndPublish(page, { title, body: 'This will be archived.' });

    const row = page.getByRole('row', { name: new RegExp(title) });
    await row.getByRole('button', { name: 'Archive' }).click();
    await expect(row.getByText('archived')).toBeVisible();

    await page.context().clearCookies();
    await signIn(page, 'aisha.bello@example.com', 'student1234');
    await page.goto('/dashboard/announcements');
    await expect(page.getByText(title)).toHaveCount(0);
  });
});

test.describe('authorization', () => {
  test('a student cannot reach the admin announcements screen', async ({ page }) => {
    await signIn(page, 'aisha.bello@example.com', 'student1234');
    await page.goto('/admin/announcements');
    await expect(page).toHaveURL(/\/SignIn/);
  });

  test('an anonymous visitor cannot reach the student feed', async ({ page }) => {
    await page.goto('/dashboard/announcements');
    await expect(page).toHaveURL(/\/SignIn/);
  });
});

test('publishing an assignment produces an in-app notification for enrolled students', async ({
  page,
  context,
}) => {
  const name = `E2E Assignment ${Date.now()}`;

  // Admin creates a TCF assignment (fires "assignment published").
  await signIn(page, 'admin@iclp.com', 'admin1234');
  await page.goto('/admin/assignments');
  await page.getByRole('button', { name: 'Create Assignment' }).first().click();
  const create = page.getByRole('dialog');
  await create.getByLabel('Title').fill(name);
  await create.getByLabel('Program').click();
  await page.getByRole('option', { name: 'TCF Exam Preparation' }).click();
  await create.getByLabel('Due Date').fill('2026-12-01');
  await create.getByLabel('Points').fill('20');
  await create.getByRole('button', { name: 'Create Assignment' }).click();
  await expect(create).toBeHidden();

  // Aisha (TCF, NOTIFY-status) gets the "new assignment" notification.
  await context.clearCookies();
  await signIn(page, 'aisha.bello@example.com', 'student1234');
  await page.getByRole('button', { name: /Notifications/ }).click();
  await expect(page.getByText(`New assignment: ${name}`)).toBeVisible();

  // Elena (DELF only) does not.
  await context.clearCookies();
  await signIn(page, 'elena.rossi@example.com', 'student1234');
  await page.getByRole('button', { name: /Notifications/ }).click();
  await expect(page.getByText(`New assignment: ${name}`)).toHaveCount(0);
});

test('grading an assignment produces an in-app notification for that student', async ({
  page,
  context,
}) => {
  // Grades the seeded PENDING submission (priya.nair · "HSK3 Character Writing
  // Set 1"). Grading is one-way, so against the shared dev DB this path is
  // exercised once per fresh seed — the same data dependency as the
  // admin-grading smoke test. If a prior run graded it, the notification it
  // produced persists and is still asserted; if the seed predates this fixture
  // the test skips with a reseed hint.
  const title = 'HSK3 Character Writing Set 1';

  await signIn(page, 'admin@iclp.com', 'admin1234');
  await page.goto('/admin/grading');
  const gradeCard = page
    .locator('[data-slot="card"]')
    .filter({ hasText: title })
    .filter({ hasText: 'Priya' });
  const gradedHere = (await gradeCard.count()) > 0;
  if (gradedHere) {
    await gradeCard.getByLabel('Score').fill('16');
    await gradeCard.getByRole('button', { name: 'Save Grade' }).click();
    await expect(page.getByRole('tab', { name: /Graded \(/ })).toBeVisible();
  }

  await context.clearCookies();
  await signIn(page, 'priya.nair@example.com', 'student1234');
  await page.getByRole('button', { name: /Notifications/ }).click();
  const notification = page.getByText(`Grade posted: ${title}`).first();
  test.skip(
    !gradedHere && (await notification.count()) === 0,
    'No pending priya/a6 submission and none graded previously — reseed the dev DB.'
  );
  await expect(notification).toBeVisible();
});

test('an enrollment change produces an in-app notification', async ({ page, context }) => {
  // david.kim (Business Spanish, PAUSED) — toggle ACTIVE then restore to PAUSED.
  await signIn(page, 'admin@iclp.com', 'admin1234');

  const setStatus = async (target: 'active' | 'paused') => {
    await context.clearCookies();
    await signIn(page, 'admin@iclp.com', 'admin1234');
    await page.goto('/admin/students');
    await page
      .getByRole('row', { name: /david\.kim@example\.com/ })
      .getByRole('button', { name: 'Manage' })
      .click();
    const dialog = page.getByRole('dialog');
    await dialog
      .locator('.flex.items-center.justify-between', { hasText: 'Business Spanish' })
      .getByRole('combobox')
      .click();
    await page.getByRole('option', { name: target, exact: true }).click();
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(
      page.getByRole('row', { name: /david\.kim@example\.com/ }).getByText(`Business Spanish · ${target}`)
    ).toBeVisible();
  };

  try {
    await setStatus('active');
    await context.clearCookies();
    await signIn(page, 'david.kim@example.com', 'student1234');
    await page.getByRole('button', { name: /Notifications/ }).click();
    await expect(
      page.getByText(/Enrollment active: Business Spanish/i).first()
    ).toBeVisible();
  } finally {
    await setStatus('paused');
  }
});
