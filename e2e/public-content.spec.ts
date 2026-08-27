import { test, expect } from '@playwright/test';

test('About renders real Meet the Director content', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'About ICLP' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Meet the Director' })).toBeVisible();
  await expect(page.getByText('Amarachi Nwankpa', { exact: false })).toBeVisible();
  await expect(page.getByText('Nnamdi Azikiwe University', { exact: false })).toBeVisible();
});

test('Terms renders real, non-placeholder content', async ({ page }) => {
  await page.goto('/terms');
  await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
  await expect(page.getByText('lorem ipsum', { exact: false })).not.toBeVisible();
  await expect(page.getByText('qualified legal counsel', { exact: false })).toBeVisible();
  await expect(page.getByText('centerforlanguageproficiency@gmail.com').first()).toBeVisible();
});

test('Privacy renders real, non-placeholder content', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
  await expect(page.getByText('lorem ipsum', { exact: false })).not.toBeVisible();
  await expect(page.getByText('Stripe', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('Resend', { exact: false }).first()).toBeVisible();
});

test('Community renders a real, truthful page describing group learning', async ({ page }) => {
  await page.goto('/community');
  await expect(page.getByRole('heading', { name: 'Community' })).toBeVisible();
  await expect(page.getByText('cohort', { exact: false }).first()).toBeVisible();
});

test('a Blog index card opens a real detail page with matching content', async ({ page }) => {
  await page.goto('/Blog');
  const cardTitle = '10 Tips to Pass Your TCF Canada Exam on the First Try';
  await page.getByRole('link', { name: cardTitle }).click();
  await expect(page).toHaveURL('/Blog/tips-to-pass-tcf-canada-exam');
  await expect(page.getByRole('heading', { name: cardTitle })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to Blog' })).toBeVisible();
});

test('an unknown Blog slug 404s', async ({ page }) => {
  const response = await page.goto('/Blog/not-a-real-post');
  expect(response?.status()).toBe(404);
});
