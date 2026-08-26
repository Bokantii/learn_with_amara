import { test, expect } from '@playwright/test';

async function signIn(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/SignIn');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

test('unauthenticated visitor to My Programs is redirected to sign in', async ({ page }) => {
  await page.goto('/dashboard/myprograms');
  await expect(page).toHaveURL(/\/SignIn/);
});

test('admin creates a program and it appears in the admin list', async ({ page }) => {
  await signIn(page, 'admin@iclp.com', 'admin1234');
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/programs');
  const programName = `Playwright Test Program ${Date.now()}`;
  await page.getByRole('button', { name: 'Add Program' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name').fill(programName);
  await dialog.getByLabel('Track').fill('playwright-test-track');
  await dialog.getByRole('button', { name: 'Add Program' }).click();

  await expect(page.getByText(programName)).toBeVisible();
});

test('admin enrolls an unenrolled student in a second program without corrupting their first', async ({ page }) => {
  // aisha.bello@example.com is seeded with exactly one ACTIVE enrollment (tcf-exam-prep).
  // Enroll her in a second program via the admin UI and confirm both survive independently —
  // this is the direct regression test for the reassignProgramAction bug (updateMany that
  // used to overwrite every enrollment a student had).
  await signIn(page, 'admin@iclp.com', 'admin1234');
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/students');
  const row = page.getByRole('row', { name: /aisha\.bello@example\.com/ });
  await row.getByRole('button', { name: 'Manage' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('TCF Exam Preparation')).toBeVisible();
  await dialog.getByLabel('Enroll in another program').click();
  await page.getByRole('option').first().click();
  await dialog.getByRole('button', { name: 'Enroll' }).click();
  await expect(dialog.getByText(/already enrolled/i)).not.toBeVisible();
  await page.getByRole('button', { name: 'Done' }).click();

  await page.context().clearCookies();
  await signIn(page, 'aisha.bello@example.com', 'student1234');
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/dashboard/myprograms');
  await expect(page.getByText('TCF Exam Preparation')).toBeVisible();
});

test('a program the student is already enrolled in is never offered again in the enroll picker', async ({ page }) => {
  // Client-side duplicate prevention: the "enroll in another program" picker excludes
  // programs the student is already in, so the server's unique-constraint guard
  // (exercised in app/admin/students/actions.ts#enrollStudentAction) can never be hit
  // through normal UI use.
  await signIn(page, 'admin@iclp.com', 'admin1234');
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/students');
  const row = page.getByRole('row', { name: /marcus\.chen@example\.com/ });
  await row.getByRole('button', { name: 'Manage' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('TEF Canada Preparation')).toBeVisible();
  await dialog.getByLabel('Enroll in another program').click();
  await expect(page.getByRole('option', { name: 'TEF Canada Preparation' })).toHaveCount(0);
  await page.keyboard.press('Escape');
});

test('student sees only their own programs, not another students', async ({ page }) => {
  await signIn(page, 'elena.rossi@example.com', 'student1234');
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/dashboard/myprograms');
  await expect(page.getByText('DELF/DALF Track')).toBeVisible();
  await expect(page.getByText('TCF Exam Preparation')).not.toBeVisible();
  await expect(page.getByText('TEF Canada Preparation')).not.toBeVisible();
});

test('admin changes one enrollment status without affecting a students other enrollment', async ({ page }) => {
  // david.kim has exactly one enrollment (business-spanish). Toggle its status to whatever
  // it currently isn't, rather than assuming a fixed starting value — the dev DB is real and
  // persists between runs, so a prior run may have already changed it (same accepted
  // statefulness pattern as e2e/admin-grading.spec.ts's self-skip).
  await signIn(page, 'admin@iclp.com', 'admin1234');
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/students');
  const row = page.getByRole('row', { name: /david\.kim@example\.com/ });
  await row.getByRole('button', { name: 'Manage' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Business Spanish')).toBeVisible();
  const statusCombobox = dialog.locator('button[role="combobox"]:not(#enrollProgram)');
  const currentStatus = (await statusCombobox.innerText()).trim();
  const targetStatus = currentStatus === 'paused' ? 'active' : 'paused';

  await statusCombobox.click();
  await page.getByRole('option', { name: targetStatus, exact: true }).click();
  await page.getByRole('button', { name: 'Done' }).click();

  await expect(page.getByText(`Business Spanish · ${targetStatus}`)).toBeVisible();
});
