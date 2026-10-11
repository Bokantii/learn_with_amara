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

test('enroll buttons open a pre-filled WhatsApp chat on the Canada line, no sign-in needed', async ({ page }) => {
  // Payments are manual-only until STRIPE_SECRET_KEY is configured (V1 Launch
  // Gate item 7) — this dev environment has no Stripe key, so each programme
  // links to admissions on WhatsApp instead of /checkout.
  await goToPricing(page);
  await page.getByRole('radio', { name: 'USD', exact: true }).click();
  await page.getByRole('tab', { name: 'TEF/TCF Preparation' }).click();

  const enroll = page.getByRole('link', { name: 'Enroll via WhatsApp' });
  await expect(enroll).toHaveAttribute('target', '_blank');
  const href = new URL((await enroll.getAttribute('href'))!);
  expect(href.origin + href.pathname).toBe('https://wa.me/14372918783');
  expect(href.searchParams.get('text')).toBe(
    'Hello, I want to buy the Group TEF/TCF Canada Preparation package ($80 USD / month).'
  );
});

test('naira prices route enrollment to the Nigeria WhatsApp line', async ({ page }) => {
  await goToPricing(page);
  await page.getByRole('radio', { name: 'NGN', exact: true }).click();
  await page.getByRole('tab', { name: 'Private Classes' }).click();

  const href = new URL(
    (await page.getByRole('link', { name: 'Enroll via WhatsApp' }).first().getAttribute('href'))!
  );
  expect(href.origin + href.pathname).toBe('https://wa.me/2348130408788');
  expect(href.searchParams.get('text')).toBe(
    'Hello, I want to buy the French Enthusiast Premier package (₦60,000 / month).'
  );
});

test('checkout fallback offers the pre-filled WhatsApp chat for the chosen plan', async ({ page }) => {
  await page.goto('/SignIn');
  await page.getByLabel('Email').fill('demo@iclp.com');
  await page.getByLabel('Password', { exact: true }).fill('demo1234');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/checkout?planId=private-french-enthusiast-premier&currency=CAD');
  await expect(page.getByText("Online payment isn't available yet")).toBeVisible();
  const href = new URL(
    (await page.getByRole('link', { name: 'Message us on WhatsApp' }).getAttribute('href'))!
  );
  expect(href.origin + href.pathname).toBe('https://wa.me/14372918783');
  expect(href.searchParams.get('text')).toBe(
    'Hello, I want to buy the French Enthusiast Premier package ($60 CAD / month).'
  );
});

test('explains how WhatsApp enrollment works and names the official numbers', async ({ page }) => {
  await goToPricing(page);
  await expect(page.getByRole('heading', { name: 'How enrollment works' })).toBeVisible();
  await expect(page.getByText('+1 437 291 8783', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('+234 813 040 8788', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/never ask for card numbers, passwords or one-time codes/).first()).toBeVisible();
  // No payment accounts are published until real details are filled in.
  await expect(page.getByRole('heading', { name: 'Official payment accounts' })).toHaveCount(0);
});
