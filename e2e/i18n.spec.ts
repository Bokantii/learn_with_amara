import { test, expect } from '@playwright/test';

test('selecting FR persists across a real route navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'EN' }).first()).toBeVisible();

  await page.getByRole('button', { name: 'EN' }).first().click();
  await expect(page.getByRole('button', { name: 'FR' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tarifs', exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Tarifs', exact: true }).click();
  await expect(page).toHaveURL('/Pricing');
  await expect(page.getByRole('button', { name: 'FR' }).first()).toBeVisible();
});

test('selected language persists across a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'EN' }).first().click();
  await expect(page.getByRole('button', { name: 'FR' }).first()).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: 'FR' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tarifs', exact: true })).toBeVisible();
});
