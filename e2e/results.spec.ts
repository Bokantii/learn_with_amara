import { test, expect, type Page } from '@playwright/test';

/**
 * Student Results + Analytics (Phase 2 Task 8). The Results page and the
 * dashboard's results/analytics cards must show only real graded data or a
 * truthful empty state — never the old hardcoded "TCF Mock Test" / 86.3%
 * fixtures — and a student must never see another student's result.
 *
 * Seeded fixtures used:
 *   aisha.bello@example.com — enrolled TCF (ACTIVE); ONE graded submission:
 *     "TCF Reading Comprehension Check" 18/20.
 *   noah.park@example.com — enrolled TCF (ACTIVE), no group, NO graded work.
 */

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/SignIn');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/SignIn'));
}

/** Opens the placement runner — fresh attempt or a redirect into an in-progress one. */
async function startPlacement(page: Page) {
  await page.goto('/assessments/placement');
  if (new URL(page.url()).pathname !== '/assessments/placement') return;
  await page.getByRole('button', { name: /Start (the placement test|a new attempt)/ }).click();
  await page.waitForURL(
    (u) => /^\/assessments\/[^/]+$/.test(u.pathname) && u.pathname !== '/assessments/placement'
  );
}

/** Answers every question (first choice) and submits — drives off the "N / total" counter. */
async function completeRunner(page: Page) {
  await page.waitForURL(/\/assessments\/[^/]+$/);
  const counter = page.getByText(/^\d+ \/ \d+$/);
  const total = Number((await counter.textContent())!.split('/')[1].trim());

  for (let i = 1; i <= total; i++) {
    const radios = page.getByRole('radio');
    if (await radios.count()) await radios.first().click();
    if (i < total) {
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(counter).toHaveText(`${i + 1} / ${total}`);
    } else {
      await page.getByRole('button', { name: 'Submit', exact: true }).click();
    }
  }
  await page.waitForURL(/\/assessments\/result\/[^/]+$/, { timeout: 20_000 });
}

test.describe('student Results page', () => {
  test('a graded assignment shows on the Results page with score and feedback', async ({ page }) => {
    await signIn(page, 'aisha.bello@example.com', 'student1234');
    await page.goto('/dashboard/results');

    // Scope to this assignment's own card — other specs may add more graded rows
    // to the shared dev DB, so assert the seeded row rather than counts.
    const row = page.locator('[data-slot="card"]', {
      hasText: 'TCF Reading Comprehension Check',
    });
    await expect(row.getByText('18/20')).toBeVisible();
    await expect(row.getByText('90%')).toBeVisible();
    await expect(row.getByText('TCF Exam Preparation')).toBeVisible();
    await expect(
      row.getByText('Strong comprehension — review the inference questions in section 3.')
    ).toBeVisible();
  });

  test('a completed assessment appears and View Details opens the real result', async ({ page }) => {
    await signIn(page, 'aisha.bello@example.com', 'student1234');
    await startPlacement(page);
    await completeRunner(page);

    await page.goto('/dashboard/results');
    const card = page
      .locator('[data-slot="card"]', { hasText: 'French Placement Test' })
      .first();
    await expect(card).toBeVisible();

    await card.getByRole('link', { name: 'View Details' }).click();
    await expect(page).toHaveURL(/\/assessments\/result\/[^/]+$/);
    await expect(page.getByText('Estimated level')).toBeVisible();
  });

  test('a student cannot open another student’s assessment result', async ({ page, context }) => {
    await signIn(page, 'aisha.bello@example.com', 'student1234');
    await startPlacement(page);
    await completeRunner(page);
    const resultUrl = page.url();
    expect(resultUrl).toMatch(/\/assessments\/result\//);

    await context.clearCookies();
    await signIn(page, 'noah.park@example.com', 'student1234');
    await page.goto(resultUrl);
    await expect(page).toHaveURL(/\/assessments\/placement$/);
  });

  test('a student with no graded work sees a truthful empty state — no charts, no fake numbers', async ({
    page,
  }) => {
    await signIn(page, 'noah.park@example.com', 'student1234');
    await page.goto('/dashboard/results');

    await expect(page.getByText('No graded work yet')).toBeVisible();
    await expect(page.locator('.recharts-surface')).toHaveCount(0);
    for (const fake of ['86.3%', '79.8%', 'TCF Mock Test - Full Exam']) {
      await expect(page.getByText(fake, { exact: false })).toHaveCount(0);
    }
  });
});

test.describe('dashboard results metrics', () => {
  test('are a truthful empty state for a student with no graded work', async ({ page }) => {
    await signIn(page, 'noah.park@example.com', 'student1234');
    await page.goto('/dashboard');

    const avg = page.locator('[data-slot="card"]', { hasText: 'Assignment average' });
    await expect(avg.getByText('—')).toBeVisible();
    await expect(avg.getByText('No grades yet')).toBeVisible();

    await expect(page.getByText('No assessment results yet.')).toBeVisible();
    // the old hardcoded value must be gone
    await expect(page.getByText('86.3', { exact: false })).toHaveCount(0);
  });

  test('reflect a real graded average for a student who has grades', async ({ page }) => {
    await signIn(page, 'aisha.bello@example.com', 'student1234');
    await page.goto('/dashboard');

    // aisha has at least the seeded 18/20 grade — the card shows a real percentage,
    // not the "—" empty state and not the old hardcoded "86.3".
    const avg = page.locator('[data-slot="card"]', { hasText: 'Assignment average' });
    await expect(avg.getByText(/^\d+%$/)).toBeVisible();
    await expect(avg.getByText('—')).toHaveCount(0);
    await expect(avg.getByText(/\bgraded\b/)).toBeVisible();
    await expect(page.getByText('86.3', { exact: false })).toHaveCount(0);
  });
});

test('anonymous visitors get no student results or history', async ({ page }) => {
  await page.goto('/dashboard/results');
  await expect(page).toHaveURL(/\/SignIn/);
  await page.goto('/assessments/history');
  await expect(page).toHaveURL(/\/SignIn/);
});
