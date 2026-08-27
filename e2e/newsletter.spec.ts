import { test, expect } from '@playwright/test';

function uniqueEmail() {
  return `e2e-newsletter-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
}

test('invalid email is rejected, not silently accepted', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('Subscribe to newsletter');
  await input.fill('not-an-email');
  await page.getByRole('button', { name: 'Subscribe' }).click();
  await page.waitForTimeout(500);

  await expect(page.getByText("You're on the list!")).not.toBeVisible();
  const isValid = await input.evaluate((el: HTMLInputElement) => el.validity.valid);
  expect(isValid).toBe(false);
});

test('valid email subscribes successfully', async ({ page }) => {
  await page.goto('/');
  const email = uniqueEmail();
  await page.getByLabel('Subscribe to newsletter').fill(email);
  await page.getByRole('button', { name: 'Subscribe' }).click();

  await expect(page.getByText("You're on the list!")).toBeVisible();
});

test('resubmitting the same email is handled safely, not as a crash', async ({ page }) => {
  await page.goto('/');
  const email = uniqueEmail();

  await page.getByLabel('Subscribe to newsletter').fill(email);
  await page.getByRole('button', { name: 'Subscribe' }).click();
  await expect(page.getByText("You're on the list!")).toBeVisible();

  await page.getByLabel('Subscribe to newsletter').fill(email);
  await page.getByRole('button', { name: 'Subscribe' }).click();
  await expect(page.getByText("You're already subscribed.")).toBeVisible();
});
