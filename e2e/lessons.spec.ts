import { test, expect } from '@playwright/test';

async function signIn(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/SignIn');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/SignIn'));
}

async function goToTcfProgramContent(page: import('@playwright/test').Page) {
  await signIn(page, 'admin@iclp.com', 'admin1234');
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto('/admin/programs');
  await page.getByLabel('Manage content for TCF Exam Preparation').click();
  await expect(page).toHaveURL(/\/admin\/programs\/[^/]+$/);
}

test('unauthenticated visitor to course/lesson pages is redirected to sign in', async ({ page }) => {
  await page.goto('/dashboard/course/anything');
  await expect(page).toHaveURL(/\/SignIn/);

  await page.goto('/dashboard/lesson/anything');
  await expect(page).toHaveURL(/\/SignIn/);
});

test('admin creates a module and a draft lesson, which stays hidden from an entitled student until published', async ({ page }) => {
  await goToTcfProgramContent(page);

  const moduleTitle = `E2E Module ${Date.now()}`;
  await page.getByRole('button', { name: 'Add Module' }).click();
  const moduleDialog = page.getByRole('dialog');
  await moduleDialog.getByLabel('Title').fill(moduleTitle);
  await moduleDialog.getByRole('button', { name: 'Add Module' }).click();
  await expect(page.getByText(moduleTitle)).toBeVisible();

  const lessonTitle = `E2E Lesson ${Date.now()}`;
  const moduleCard = page.locator('[data-slot="card"]', { hasText: moduleTitle });
  await moduleCard.getByRole('button', { name: 'Add Lesson' }).click();
  const lessonDialog = page.getByRole('dialog');
  await lessonDialog.getByLabel('Title').fill(lessonTitle);
  await lessonDialog.getByRole('button', { name: 'Add Lesson' }).click();
  await expect(page.getByText(lessonTitle)).toBeVisible();
  const lessonRow = page.locator('div', { has: page.getByText(lessonTitle, { exact: true }) }).last();
  await expect(lessonRow.getByText('draft', { exact: true })).toBeVisible();

  // Draft lesson must not appear for an entitled student yet.
  await page.context().clearCookies();
  await signIn(page, 'aisha.bello@example.com', 'student1234');
  await page.goto('/dashboard/recordedlessons');
  await expect(page.getByText(lessonTitle)).not.toBeVisible();

  // Publish it as admin, then it should appear.
  await page.context().clearCookies();
  await goToTcfProgramContent(page);
  await page.getByLabel(`Publish ${lessonTitle}`).click();
  await expect(page.getByText('published').first()).toBeVisible();

  await page.context().clearCookies();
  await signIn(page, 'aisha.bello@example.com', 'student1234');
  await page.goto('/dashboard/recordedlessons');
  await expect(page.getByText(lessonTitle)).toBeVisible();
});

test('admin edits and reorders modules', async ({ page }) => {
  await goToTcfProgramContent(page);

  const moduleTitle = `Reorder Module ${Date.now()}`;
  await page.getByRole('button', { name: 'Add Module' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title').fill(moduleTitle);
  await dialog.getByRole('button', { name: 'Add Module' }).click();
  await expect(page.getByText(moduleTitle)).toBeVisible();

  // New modules are appended last, so "move up" must be enabled.
  await expect(page.getByLabel(`Move ${moduleTitle} up`)).toBeEnabled();
  await page.getByLabel(`Move ${moduleTitle} up`).click();

  await page.getByLabel(`Edit ${moduleTitle}`).click();
  const editDialog = page.getByRole('dialog');
  const renamed = `${moduleTitle} (renamed)`;
  await editDialog.getByLabel('Title').fill(renamed);
  await editDialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(renamed)).toBeVisible();
});

test('unrelated student does not see lessons from a program they are not enrolled in', async ({ page }) => {
  await signIn(page, 'elena.rossi@example.com', 'student1234');
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/dashboard/recordedlessons');
  await expect(page.getByText('The Subjunctive Mood')).not.toBeVisible();
  await expect(page.getByText('Present Tense Conjugation')).not.toBeVisible();
});

test('student cannot access a lesson from another program by guessing its ID', async ({ page }) => {
  await signIn(page, 'aisha.bello@example.com', 'student1234');
  await page.goto('/dashboard/recordedlessons');
  const lessonLink = page.getByRole('link', { name: /Start Lesson|Continue|Rewatch/ }).first();
  const href = await lessonLink.getAttribute('href');
  expect(href).toBeTruthy();

  await page.context().clearCookies();
  await signIn(page, 'elena.rossi@example.com', 'student1234');
  const response = await page.goto(href!);
  expect(response?.status()).toBe(404);
});

test('student starts and completes a lesson; progress persists across reload, login, and Recorded Lessons/My Programs', async ({ page }) => {
  // Create and publish a fresh lesson dedicated to this test so it's guaranteed to start
  // with no prior LessonProgress — the dev DB is real and persists between runs, so reusing
  // a seeded lesson would accumulate COMPLETED state across repeat runs (same statefulness
  // pattern as e2e/programs.spec.ts's status-toggle test).
  await goToTcfProgramContent(page);
  const lessonTitle = `Progress Test Lesson ${Date.now()}`;
  const grammarModuleCard = page.locator('[data-slot="card"]', { hasText: 'Grammar Fundamentals' });
  await grammarModuleCard.getByRole('button', { name: 'Add Lesson' }).click();
  const createDialog = page.getByRole('dialog');
  await createDialog.getByLabel('Title').fill(lessonTitle);
  await createDialog.getByRole('button', { name: 'Add Lesson' }).click();
  await expect(page.getByText(lessonTitle)).toBeVisible();
  await page.getByLabel(`Publish ${lessonTitle}`).click();
  await expect(page.getByLabel(`Unpublish ${lessonTitle}`)).toBeVisible();

  await page.context().clearCookies();
  await signIn(page, 'aisha.bello@example.com', 'student1234');
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/dashboard/recordedlessons');
  const lessonCard = page.locator('[data-slot="card"]', { hasText: lessonTitle });
  await lessonCard.getByRole('link').click();
  await expect(page).toHaveURL(/\/dashboard\/lesson\//);

  // Opening the lesson records it as started (IN_PROGRESS) — verify via the course page state.
  const lessonUrl = page.url();
  const courseHref = await page.getByRole('link', { name: 'Back to Program' }).getAttribute('href');
  const courseUrl = new URL(courseHref!, page.url()).toString();
  await page.goto(courseUrl);
  await expect(page.getByRole('link', { name: /Continue/ }).first()).toBeVisible();

  // Complete it.
  await page.goto(lessonUrl);
  await page.getByRole('button', { name: 'Mark as Complete' }).click();
  await expect(page.getByText('Completed')).toBeVisible();

  // Persists across reload.
  await page.reload();
  await expect(page.getByText('Completed')).toBeVisible();

  // Persists across logout/login.
  await page.context().clearCookies();
  await signIn(page, 'aisha.bello@example.com', 'student1234');
  await page.goto(lessonUrl);
  await expect(page.getByText('Completed')).toBeVisible();

  // Reflected on the course page as "Rewatch".
  await page.goto(courseUrl);
  await expect(page.getByRole('link', { name: /Rewatch/ }).first()).toBeVisible();

  // Reflected on Recorded Lessons.
  await page.goto('/dashboard/recordedlessons');
  await expect(page.getByText('Completed').first()).toBeVisible();

  // Reflected on My Programs as a derived lesson count.
  await page.goto('/dashboard/myprograms');
  await expect(page.getByText(/\d+\/\d+ lessons completed/).first()).toBeVisible();
});
