import { test, expect } from '@playwright/test';

test('home page pricing teaser shows real catalogue prices, not the old stale tiers', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('A0–A2 Foundation French')).toBeVisible();
  await expect(page.getByText('$350 CAD')).toBeVisible();
  await expect(page.getByText('Group TEF/TCF Canada Preparation')).toBeVisible();
  await expect(page.getByText('French Enthusiast Premier')).toBeVisible();

  // The old hardcoded teaser tiers must be gone.
  await expect(page.getByText('$800', { exact: false })).not.toBeVisible();
  await expect(page.getByText('Beginner to TCF/TEF', { exact: true })).not.toBeVisible();
});

test('clicking a teaser card sends users to the full Pricing experience', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'View Pricing' }).first().click();
  await expect(page.getByRole('heading', { name: 'Simple, Transparent Tuition' })).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: 'Display currency' })).toBeVisible();
});
