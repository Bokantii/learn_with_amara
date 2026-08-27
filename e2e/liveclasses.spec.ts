import { test, expect } from '@playwright/test';

async function signIn(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/SignIn');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/SignIn'));
}

test('unauthenticated visitor cannot access live class pages', async ({ page }) => {
  await page.goto('/dashboard/liveclasses');
  await expect(page).toHaveURL(/\/SignIn/);

  await page.goto('/admin/liveclasses');
  await expect(page).toHaveURL(/\/SignIn/);
});

test('student cannot access admin live class management', async ({ page }) => {
  await signIn(page, 'aisha.bello@example.com', 'student1234');
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/admin/liveclasses');
  await expect(page).toHaveURL(/\/SignIn/);
});

test('admin creates a Program-level live class', async ({ page }) => {
  await signIn(page, 'admin@iclp.com', 'admin1234');
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/liveclasses');
  const title = `E2E Program Class ${Date.now()}`;
  await page.getByRole('button', { name: 'Schedule Class', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title').fill(title);
  await dialog.getByLabel('Instructor').fill('Test Instructor');
  await dialog.getByLabel('Start date').fill('2026-10-01');
  await dialog.getByLabel('Start time').fill('16:00');
  await dialog.getByLabel('End date').fill('2026-10-01');
  await dialog.getByLabel('End time').fill('17:00');
  await dialog.getByRole('button', { name: 'Schedule Class', exact: true }).click();

  const card = page.locator('[data-slot="card"]', { hasText: title });
  await expect(card).toBeVisible();
  // Program-level: no group name suffix on the program/group badge.
  await expect(card).not.toContainText('TCF Morning Cohort');
  await expect(card).not.toContainText('TEF Weekend Intensive');
});

test('admin creates a Group-level live class', async ({ page }) => {
  await signIn(page, 'admin@iclp.com', 'admin1234');
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/liveclasses');
  const title = `E2E Group Class ${Date.now()}`;
  await page.getByRole('button', { name: 'Schedule Class', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Program').click();
  await page.getByRole('option', { name: 'TCF Exam Preparation' }).click();
  await dialog.getByLabel('Title').fill(title);
  await dialog.getByLabel('Group (optional)').click();
  await page.getByRole('option', { name: 'TCF Morning Cohort' }).click();
  await dialog.getByLabel('Instructor').fill('Test Instructor');
  await dialog.getByLabel('Start date').fill('2026-10-02');
  await dialog.getByLabel('Start time').fill('16:00');
  await dialog.getByLabel('End date').fill('2026-10-02');
  await dialog.getByLabel('End time').fill('17:00');
  await dialog.getByRole('button', { name: 'Schedule Class', exact: true }).click();

  const card = page.locator('[data-slot="card"]', { hasText: title });
  await expect(card).toBeVisible();
  await expect(card).toContainText('TCF Morning Cohort');
});

test('program-level class is visible to an entitled student and invisible outside the program', async ({ page }) => {
  await signIn(page, 'aisha.bello@example.com', 'student1234');
  await page.goto('/dashboard/liveclasses');
  await expect(page.getByText('TCF Speaking Practice')).toBeVisible();

  await page.context().clearCookies();
  await signIn(page, 'marcus.chen@example.com', 'student1234');
  await page.goto('/dashboard/liveclasses');
  // Strict IDOR check: not just "not visible" — absent from the rendered payload entirely.
  expect(await page.content()).not.toContain('TCF Speaking Practice');
});

test('group-level class is visible to group members only, not a same-program non-member', async ({ page }) => {
  await signIn(page, 'aisha.bello@example.com', 'student1234');
  await page.goto('/dashboard/liveclasses');
  await expect(page.getByText('Morning Cohort Grammar Review')).toBeVisible();

  await page.context().clearCookies();
  // noah.park is enrolled in tcf-exam-prep (same program) but not a TCF Morning Cohort member.
  await signIn(page, 'noah.park@example.com', 'student1234');
  await page.goto('/dashboard/liveclasses');
  expect(await page.content()).not.toContain('Morning Cohort Grammar Review');
  // But noah should still see the program-level class.
  await expect(page.getByText('TCF Speaking Practice')).toBeVisible();
});

test('admin reschedules a class and the new time appears to an entitled student', async ({ page }) => {
  await signIn(page, 'admin@iclp.com', 'admin1234');
  await page.goto('/admin/liveclasses');

  const title = `E2E Time Change Class ${Date.now()}`;
  await page.getByRole('button', { name: 'Schedule Class', exact: true }).click();
  const createDialog = page.getByRole('dialog');
  await createDialog.getByLabel('Program').click();
  await page.getByRole('option', { name: 'TCF Exam Preparation' }).click();
  await createDialog.getByLabel('Title').fill(title);
  await createDialog.getByLabel('Instructor').fill('Test Instructor');
  await createDialog.getByLabel('Start date').fill('2026-10-10');
  await createDialog.getByLabel('Start time').fill('10:00');
  await createDialog.getByLabel('End date').fill('2026-10-10');
  await createDialog.getByLabel('End time').fill('11:00');
  await createDialog.getByRole('button', { name: 'Schedule Class', exact: true }).click();
  await expect(page.getByText(title)).toBeVisible();

  await page.getByLabel(`Edit ${title}`).click();
  const editDialog = page.getByRole('dialog');
  await editDialog.getByLabel('Start date').fill('2026-10-15');
  await editDialog.getByLabel('Start time').fill('14:00');
  await editDialog.getByLabel('End date').fill('2026-10-15');
  await editDialog.getByLabel('End time').fill('15:00');
  await editDialog.getByRole('button', { name: 'Save' }).click();

  const card = page.locator('[data-slot="card"]', { hasText: title });
  await expect(card.getByText('rescheduled')).toBeVisible();
  await expect(card).toContainText('Oct 15, 2026');

  await page.context().clearCookies();
  await signIn(page, 'aisha.bello@example.com', 'student1234');
  await page.goto('/dashboard/liveclasses');
  const studentCard = page.locator('[data-slot="card"]', { hasText: title });
  await expect(studentCard).toContainText('Rescheduled');
  await expect(studentCard).not.toContainText('Oct 10');
});

test('admin cancels a class with a custom reason; student sees the cancelled state and no Join action', async ({ page }) => {
  await signIn(page, 'admin@iclp.com', 'admin1234');
  await page.goto('/admin/liveclasses');

  const title = `E2E Cancel Class ${Date.now()}`;
  await page.getByRole('button', { name: 'Schedule Class', exact: true }).click();
  const createDialog = page.getByRole('dialog');
  await createDialog.getByLabel('Program').click();
  await page.getByRole('option', { name: 'TCF Exam Preparation' }).click();
  await createDialog.getByLabel('Title').fill(title);
  await createDialog.getByLabel('Instructor').fill('Test Instructor');
  await createDialog.getByLabel('Start date').fill('2026-10-20');
  await createDialog.getByLabel('Start time').fill('10:00');
  await createDialog.getByLabel('End date').fill('2026-10-20');
  await createDialog.getByLabel('End time').fill('11:00');
  await createDialog.getByRole('button', { name: 'Schedule Class', exact: true }).click();
  await expect(page.getByText(title)).toBeVisible();

  await page.getByLabel(`Cancel ${title}`).click();
  const cancelDialog = page.getByRole('dialog');
  const customMessage = 'Cancelled for E2E testing purposes.';
  await cancelDialog.getByLabel('Message to students (optional)').fill(customMessage);
  await cancelDialog.getByRole('button', { name: 'Cancel Class' }).click();

  await page.getByRole('tab', { name: 'Cancelled' }).click();
  const adminCard = page.locator('[data-slot="card"]', { hasText: title });
  await expect(adminCard).toContainText('Network issues');
  await expect(adminCard).toContainText(customMessage);

  await page.context().clearCookies();
  await signIn(page, 'aisha.bello@example.com', 'student1234');
  await page.goto('/dashboard/liveclasses');
  await page.getByRole('tab', { name: 'Cancelled' }).click();
  const studentCard = page.locator('[data-slot="card"]', { hasText: title });
  await expect(studentCard).toBeVisible();
  await expect(studentCard.getByText('Cancelled', { exact: true })).toBeVisible();
  await expect(studentCard).toContainText(customMessage);
  await expect(studentCard.getByRole('link', { name: 'Join Class' })).toHaveCount(0);
});

test('admin marks a class completed; it remains historical, not deleted', async ({ page }) => {
  await signIn(page, 'admin@iclp.com', 'admin1234');
  await page.goto('/admin/liveclasses');

  const title = `E2E Complete Class ${Date.now()}`;
  await page.getByRole('button', { name: 'Schedule Class', exact: true }).click();
  const createDialog = page.getByRole('dialog');
  await createDialog.getByLabel('Title').fill(title);
  await createDialog.getByLabel('Instructor').fill('Test Instructor');
  await createDialog.getByLabel('Start date').fill('2026-10-25');
  await createDialog.getByLabel('Start time').fill('10:00');
  await createDialog.getByLabel('End date').fill('2026-10-25');
  await createDialog.getByLabel('End time').fill('11:00');
  await createDialog.getByRole('button', { name: 'Schedule Class', exact: true }).click();
  await expect(page.getByText(title)).toBeVisible();

  await page.getByLabel(`Mark ${title} completed`).click();
  await page.getByRole('tab', { name: 'Completed' }).click();
  await expect(page.locator('[data-slot="card"]', { hasText: title })).toBeVisible();

  // The pre-seeded completed class must still be present too — completion never deletes.
  await expect(page.getByText('DELF B1 Oral Comprehension')).toBeVisible();
});

test('meeting URL is withheld from unauthorized students and from a cancelled class', async ({ page }) => {
  await signIn(page, 'admin@iclp.com', 'admin1234');
  await page.goto('/admin/liveclasses');

  const title = `E2E Meeting URL Class ${Date.now()}`;
  const uniqueUrl = `https://zoom.example.com/j/e2e-${Date.now()}`;
  await page.getByRole('button', { name: 'Schedule Class', exact: true }).click();
  const createDialog = page.getByRole('dialog');
  await createDialog.getByLabel('Program').click();
  await page.getByRole('option', { name: 'TCF Exam Preparation' }).click();
  await createDialog.getByLabel('Title').fill(title);
  await createDialog.getByLabel('Instructor').fill('Test Instructor');
  await createDialog.getByLabel('Start date').fill('2026-10-22');
  await createDialog.getByLabel('Start time').fill('10:00');
  await createDialog.getByLabel('End date').fill('2026-10-22');
  await createDialog.getByLabel('End time').fill('11:00');
  await createDialog.getByLabel('Meeting URL').fill(uniqueUrl);
  await createDialog.getByRole('button', { name: 'Schedule Class', exact: true }).click();
  await expect(page.getByText(title)).toBeVisible();

  // Not entitled at all (different program) — the class and its URL must never render.
  await page.context().clearCookies();
  await signIn(page, 'marcus.chen@example.com', 'student1234');
  await page.goto('/dashboard/liveclasses');
  const marcusContent = await page.content();
  expect(marcusContent).not.toContain(title);
  expect(marcusContent).not.toContain(uniqueUrl);

  // Entitled to the program, but the class is cancelled — URL must still never render.
  await page.context().clearCookies();
  await signIn(page, 'admin@iclp.com', 'admin1234');
  await page.goto('/admin/liveclasses');
  await page.getByLabel(`Cancel ${title}`).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel Class' }).click();

  await page.context().clearCookies();
  await signIn(page, 'aisha.bello@example.com', 'student1234');
  await page.goto('/dashboard/liveclasses');
  await page.getByRole('tab', { name: 'Cancelled' }).click();
  const aishaContent = await page.content();
  expect(aishaContent).toContain(title); // she IS entitled and should see the cancelled entry
  expect(aishaContent).not.toContain(uniqueUrl); // but never the meeting URL
});
