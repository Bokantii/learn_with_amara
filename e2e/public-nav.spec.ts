import { test, expect } from '@playwright/test';

test('header links navigate to real routes', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Courses', exact: true }).click();
  await expect(page).toHaveURL('/Courses');
  await expect(page.getByRole('heading', { name: 'Choose Your French Track' })).toBeVisible();

  await page.getByRole('link', { name: 'Exam Prep', exact: true }).click();
  await expect(page).toHaveURL('/TCFTEFPrep');

  await page.getByRole('link', { name: 'Pricing', exact: true }).click();
  await expect(page).toHaveURL('/Pricing');

  await page.getByRole('link', { name: 'Blog', exact: true }).click();
  await expect(page).toHaveURL('/Blog');

  await page.getByRole('link', { name: 'About', exact: true }).first().click();
  await expect(page).toHaveURL('/about');

  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page).toHaveURL('/');
});

test('footer links navigate to real routes', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'About', exact: true }).last().click();
  await expect(page).toHaveURL('/about');

  await page.goto('/');
  await page.getByRole('link', { name: 'Community', exact: true }).click();
  await expect(page).toHaveURL('/community');

  await page.goto('/');
  await page.getByRole('link', { name: 'Terms of Service', exact: true }).click();
  await expect(page).toHaveURL('/terms');

  await page.goto('/');
  await page.getByRole('link', { name: 'Privacy Policy', exact: true }).click();
  await expect(page).toHaveURL('/privacy');
});

test('unavailable social links are absent; Instagram and WhatsApp are real', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('a[href*="facebook.com"]')).toHaveCount(0);
  await expect(page.locator('a[href*="twitter.com"]')).toHaveCount(0);
  await expect(page.locator('a[href*="youtube.com"]')).toHaveCount(0);
  await expect(page.locator('a[href*="linkedin.com"]')).toHaveCount(0);

  await expect(page.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
    'href',
    'https://www.instagram.com/centerforlanguageproficiency/'
  );

  const whatsappLinks = page.getByRole('link', { name: 'WhatsApp' });
  await expect(whatsappLinks).toHaveCount(2);
  await expect(whatsappLinks.nth(0)).toHaveAttribute('href', 'https://wa.me/14372918783');
  await expect(whatsappLinks.nth(1)).toHaveAttribute('href', 'https://wa.me/2348130408788');
});

test('copyright year is the current year, not hardcoded', async ({ page }) => {
  await page.goto('/');
  const year = new Date().getFullYear().toString();
  await expect(page.getByText(`© ${year} International Center for Language Proficiency`)).toBeVisible();
});

test('no fabricated student-count or success-rate claims are shown', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('50K+', { exact: false })).not.toBeVisible();
  await expect(page.getByText('95%', { exact: false })).not.toBeVisible();

  await page.goto('/Courses');
  await expect(page.getByText('15K+', { exact: false })).not.toBeVisible();
  await expect(page.getByText('8K+', { exact: false })).not.toBeVisible();
});

test('Get Started (header and hero) reaches Pricing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Get Started', exact: true }).first().click();
  await expect(page).toHaveURL('/Pricing');

  await page.goto('/');
  await page.getByRole('link', { name: 'Get Started', exact: true }).last().click();
  await expect(page).toHaveURL('/Pricing');
});

test('TCF/TEF exam prep CTAs resolve to real destinations, none silently inert', async ({ page }) => {
  await page.goto('/TCFTEFPrep');

  await page.getByRole('link', { name: 'Start Your Preparation' }).click();
  await expect(page).toHaveURL('/Pricing');

  await page.goto('/TCFTEFPrep');
  await page.getByRole('link', { name: 'Start From Scratch' }).first().click();
  await expect(page).toHaveURL('/Pricing');

  await page.goto('/TCFTEFPrep');
  await page.getByRole('link', { name: 'Fast-Track My Exam' }).first().click();
  await expect(page).toHaveURL('/Pricing');

  await page.goto('/TCFTEFPrep');
  const practiceExamButton = page.getByRole('button', { name: 'Take a Practice Exam' });
  await expect(practiceExamButton).toBeDisabled();
  await expect(page.getByText('Practice exams are launching in a future update')).toBeVisible();
});
