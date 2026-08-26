import { test, expect } from '@playwright/test';

async function signIn(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/SignIn');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

test('student signs in and lands on the dashboard', async ({ page }) => {
  await signIn(page, 'demo@iclp.com', 'demo1234');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'ICLP' })).toBeVisible();
});

test('admin signs in and lands on the admin overview', async ({ page }) => {
  await signIn(page, 'admin@iclp.com', 'admin1234');
  await expect(page).toHaveURL(/\/admin$/);
});

test('wrong password is rejected with an inline error', async ({ page }) => {
  await signIn(page, 'demo@iclp.com', 'wrong-password');
  await expect(page.getByText('Invalid email or password.')).toBeVisible();
  await expect(page).toHaveURL(/\/SignIn/);
});
