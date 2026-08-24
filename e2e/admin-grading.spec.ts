import { test, expect } from '@playwright/test';

test('admin grades a pending submission', async ({ page }) => {
  await page.goto('/SignIn');
  await page.getByLabel('Email').fill('admin@iclp.com');
  await page.getByLabel('Password').fill('admin1234');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/grading');

  const pendingTab = page.getByRole('tab', { name: /Pending/ });
  const pendingCountBefore = Number((await pendingTab.textContent())?.match(/\((\d+)\)/)?.[1]);
  test.skip(pendingCountBefore === 0, 'No pending submissions left to grade — reseed the database first.');

  const firstCard = page.locator('form').first();
  await firstCard.getByLabel('Score').fill('18');
  await firstCard.getByLabel('Feedback').fill('Solid work — automated smoke test.');
  await firstCard.getByRole('button', { name: 'Save Grade' }).click();

  await expect(page.getByRole('tab', { name: /Pending/ })).toHaveText(
    `Pending (${pendingCountBefore - 1})`
  );

  await page.getByRole('tab', { name: /Graded/ }).click();
  await expect(page.getByText('Solid work — automated smoke test.')).toBeVisible();
});
