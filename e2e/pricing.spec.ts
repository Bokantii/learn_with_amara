import { test, expect } from '@playwright/test';

async function goToPricing(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Pricing', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Simple, Transparent Tuition' })).toBeVisible();
}

test('defaults to CAD and shows the Group French category', async ({ page }) => {
  await goToPricing(page);
  await expect(page.getByRole('radio', { name: 'CAD', exact: true })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('A0–A2 Foundation French')).toBeVisible();
  await expect(page.getByText('$350 CAD')).toBeVisible();
});

test('switching currency updates every visible price without navigation', async ({ page }) => {
  await goToPricing(page);
  await page.getByRole('radio', { name: 'NGN', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'NGN', exact: true })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('₦350,000')).toBeVisible();
  await expect(page.getByText('Paid Once', { exact: true })).toBeVisible();
  await expect(page).toHaveURL('/Pricing');
});

test('currency selection persists across category tabs and reloads', async ({ page }) => {
  await goToPricing(page);
  await page.getByRole('radio', { name: 'GBP', exact: true }).click();
  await page.getByRole('tab', { name: 'Private Classes' }).click();
  await expect(page.getByText('French Enthusiast Premier')).toBeVisible();
  await expect(page.getByText('£32')).toBeVisible();

  await page.reload();
  await goToPricing(page);
  await expect(page.getByRole('radio', { name: 'GBP', exact: true })).toHaveAttribute('aria-checked', 'true');
});

test('no obsolete package names are shown', async ({ page }) => {
  await goToPricing(page);
  await page.getByRole('tab', { name: 'Private Classes' }).click();
  await expect(page.getByText(/Package 1|Package 2|Package 3/)).not.toBeVisible();
  await expect(page.getByText('No Pain No Gain Elite')).toBeVisible();
  await expect(page.getByText('Focus Max Executive')).toBeVisible();
});

test('selecting a programme hands off to the existing checkout flow with currency', async ({ page }) => {
  await page.goto('/SignIn');
  await page.getByLabel('Email').fill('demo@iclp.com');
  await page.getByLabel('Password', { exact: true }).fill('demo1234');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await goToPricing(page);
  await page.getByRole('radio', { name: 'USD', exact: true }).click();
  await page.getByRole('tab', { name: 'TEF/TCF Preparation' }).click();
  await page.getByRole('button', { name: 'Select Programme' }).click();

  await expect(page).toHaveURL(/\/checkout\?planId=group-tef-tcf-canada-prep&currency=USD/);
  // Payments are manual-only until STRIPE_SECRET_KEY is configured (V1 Launch
  // Gate item 7) — this dev environment has no Stripe key, so /checkout shows
  // the honest "contact us to enroll" notice rather than a payment form that
  // would fail at the Stripe API call. The programme/currency handoff via the
  // URL (asserted above) is what this test actually protects.
  await expect(page.getByText("Online payment isn't available yet")).toBeVisible();
});
