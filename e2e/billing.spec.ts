import { test, expect, type Page } from '@playwright/test';

/**
 * Billing + enrollment / payment lifecycle (Phase 2 Task 9). Student billing
 * shows only real payment/enrollment records; a student never sees another
 * student's billing; content access follows the enrollment lifecycle
 * (ACTIVE / COMPLETED only), and admin-approved activation is explicit.
 *
 * Seeded fixtures:
 *   aisha.bello@example.com   — ACTIVE (TCF), 1 manual payment (ref ICLP-2026-0142)
 *   elena.rossi@example.com   — ACTIVE (DELF), 1 manual payment (ref ICLP-2026-0173)
 *   noah.park@example.com     — ACTIVE (TCF), NO payment  → empty-state fixture
 *   pending.pay@example.com   — PENDING (TCF), no payment  → lifecycle fixture
 *   david.kim@example.com     — PAUSED (Business Spanish)  → access fixture
 */

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/SignIn');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/SignIn'));
}

test.describe('student billing', () => {
  test('a student sees their own real payment history', async ({ page }) => {
    await signIn(page, 'aisha.bello@example.com', 'student1234');
    await page.goto('/dashboard/billing');

    const table = page.getByRole('table');
    await expect(table.getByText('$300.00 CAD').first()).toBeVisible();
    await expect(table.getByText('TCF Exam Preparation').first()).toBeVisible();
    await expect(table.getByText('Bank transfer').first()).toBeVisible();
    await expect(table.getByText('paid').first()).toBeVisible();
    await expect(page.getByText('ICLP-2026-0142')).toBeVisible();
  });

  test('a student cannot see another student’s billing data', async ({ page }) => {
    await signIn(page, 'aisha.bello@example.com', 'student1234');
    await page.goto('/dashboard/billing');
    // elena's payment reference must not appear on aisha's page
    await expect(page.getByText('ICLP-2026-0173')).toHaveCount(0);
  });

  test('a student with no payments sees a truthful empty state', async ({ page }) => {
    await signIn(page, 'noah.park@example.com', 'student1234');
    await page.goto('/dashboard/billing');

    await expect(page.getByText('No payments recorded yet')).toBeVisible();
    for (const fake of ['$199', '4242', 'Next billing', 'Add Payment Method']) {
      await expect(page.getByText(fake, { exact: false })).toHaveCount(0);
    }
  });

  test('anonymous visitors cannot reach billing', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await expect(page).toHaveURL(/\/SignIn/);
  });
});

test.describe('enrollment lifecycle + access', () => {
  test('a PENDING student gets the dashboard shell but no course content', async ({ page }) => {
    await signIn(page, 'pending.pay@example.com', 'student1234');
    await expect(page).toHaveURL(/\/dashboard$/);
    // dashboard shell, not the "not enrolled" onboarding screen
    await expect(page.getByText("You're not enrolled in a program yet")).toHaveCount(0);

    await page.goto('/dashboard/billing');
    await expect(page.getByRole('heading', { name: 'Billing' })).toBeVisible();
    await expect(
      page.locator('[data-slot="card"]', { hasText: 'TCF Exam Preparation' }).getByText('pending')
    ).toBeVisible();

    await page.goto('/dashboard/myprograms');
    const card = page.locator('[data-slot="card"]', { hasText: 'TCF Exam Preparation' });
    await expect(card.getByText('Awaiting activation')).toBeVisible();
    await expect(card.getByRole('link', { name: /View Lessons/ })).toHaveCount(0);
  });

  test('the admin status control only offers legal transitions for a PENDING enrollment', async ({
    page,
  }) => {
    await signIn(page, 'admin@iclp.com', 'admin1234');
    await page.goto('/admin/students');
    await page
      .getByRole('row', { name: /pending\.pay@example\.com/ })
      .getByRole('button', { name: 'Manage' })
      .click();

    const dialog = page.getByRole('dialog');
    // Scope to the TCF enrollment row (pending.pay may have picked up other
    // enrollments in earlier runs against the shared dev DB).
    const tcfRow = dialog
      .locator('.flex.items-center.justify-between', { hasText: 'TCF Exam Preparation' })
      .first();
    await tcfRow.getByRole('combobox').click();
    await expect(page.getByRole('option', { name: 'active', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'cancelled', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'paused', exact: true })).toHaveCount(0);
    await expect(page.getByRole('option', { name: 'completed', exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
  });

  test('admin records a manual payment and the student sees it', async ({ page, context }) => {
    const reference = `E2E-${Date.now()}`;
    await signIn(page, 'admin@iclp.com', 'admin1234');
    await page.goto('/admin/payments');

    await page.getByRole('button', { name: 'Record Payment' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Student').click();
    await page.getByRole('option', { name: /Pending Payer/ }).click();
    await dialog.getByLabel('Amount').fill('250');
    await dialog.getByLabel('Method').fill('Cash');
    await dialog.getByLabel('Reference (optional)').fill(reference);
    await dialog.getByRole('button', { name: 'Record payment' }).click();
    await expect(dialog).toBeHidden();

    // Admin table has no reference column — assert the new row by student + amount.
    await expect(
      page
        .getByRole('row', { name: /Pending Payer/ })
        .filter({ hasText: '$250.00 CAD' })
        .first()
    ).toBeVisible();

    await context.clearCookies();
    await signIn(page, 'pending.pay@example.com', 'student1234');
    await page.goto('/dashboard/billing');
    await expect(page.getByText(reference)).toBeVisible();
    await expect(page.getByRole('table').getByText('$250.00 CAD').first()).toBeVisible();
  });

  test('activating a paused enrollment restores course access', async ({ page, context }) => {
    // Toggle david.kim (Business Spanish) PAUSED -> ACTIVE, verify access, then always restore.
    const setStatus = async (target: 'active' | 'paused') => {
      await context.clearCookies();
      await signIn(page, 'admin@iclp.com', 'admin1234');
      await page.goto('/admin/students');
      await page
        .getByRole('row', { name: /david\.kim@example\.com/ })
        .getByRole('button', { name: 'Manage' })
        .click();
      const dialog = page.getByRole('dialog');
      await dialog.locator('button[role="combobox"]:not(#enrollProgram)').click();
      await page.getByRole('option', { name: target, exact: true }).click();
      await page.getByRole('button', { name: 'Done' }).click();
      await expect(
        page
          .getByRole('row', { name: /david\.kim@example\.com/ })
          .getByText(`Business Spanish · ${target}`)
      ).toBeVisible();
    };

    try {
      await setStatus('active');

      await context.clearCookies();
      await signIn(page, 'david.kim@example.com', 'student1234');
      await page.goto('/dashboard/myprograms');
      await expect(
        page
          .locator('[data-slot="card"]', { hasText: 'Business Spanish' })
          .getByRole('link', { name: /View Lessons/ })
      ).toBeVisible();
    } finally {
      await setStatus('paused'); // restore the shared fixture no matter what
    }

    await context.clearCookies();
    await signIn(page, 'david.kim@example.com', 'student1234');
    await page.goto('/dashboard/myprograms');
    const card = page.locator('[data-slot="card"]', { hasText: 'Business Spanish' });
    await expect(card.getByText('Access paused')).toBeVisible();
    await expect(card.getByRole('link', { name: /View Lessons/ })).toHaveCount(0);
  });

  test('a multi-enrollment student is correctly scoped in billing and access', async ({ page }) => {
    // pending.pay is seeded with two PENDING enrollments (TCF + DELF).
    await signIn(page, 'pending.pay@example.com', 'student1234');

    await page.goto('/dashboard/billing');
    const billing = page.locator('[data-slot="card"]', { hasText: 'Joined' });
    await expect(billing.filter({ hasText: 'TCF Exam Preparation' })).toBeVisible();
    await expect(billing.filter({ hasText: 'DELF/DALF Track' })).toBeVisible();

    // Each program's access is independent — both PENDING, so neither is openable.
    await page.goto('/dashboard/myprograms');
    for (const name of ['TCF Exam Preparation', 'DELF/DALF Track']) {
      const card = page.locator('[data-slot="card"]', { hasText: name });
      await expect(card.getByText('Awaiting activation')).toBeVisible();
      await expect(card.getByRole('link', { name: /View Lessons/ })).toHaveCount(0);
    }
  });
});
