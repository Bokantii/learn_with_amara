import { test, expect } from '@playwright/test';

async function signIn(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/SignIn');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

const unguardedRoutes = [
  '/dashboard/billing',
  '/dashboard/settings',
  '/dashboard/results',
  '/dashboard/myprograms',
  '/dashboard/liveclasses',
  '/dashboard/recordedlessons',
];

for (const route of unguardedRoutes) {
  test(`unauthenticated visitor to ${route} is redirected to sign in`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/SignIn/);
  });
}

test('unenrolled student sees a truthful onboarding state instead of the dashboard', async ({ page }) => {
  await signIn(page, 'demo@iclp.com', 'demo1234');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("You're not enrolled in a program yet")).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse Programs' })).toBeVisible();
});

test('student cannot reach the admin portal', async ({ page }) => {
  await signIn(page, 'aisha.bello@example.com', 'student1234');
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/admin');
  await expect(page).toHaveURL(/\/SignIn/);
});
