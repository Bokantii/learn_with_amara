import { test, expect, type Page } from '@playwright/test';

/**
 * Assessments + placement test (Phase 2 Task 7). Covers: taking the seeded
 * placement test end to end, resuming an in-progress attempt, cross-student
 * isolation, DRAFT invisibility, PRACTICE program-scoping, the free-text
 * manual-grade path, and the answer key never reaching the take flow.
 *
 * Seeded fixtures used: demo@iclp.com (student, NO enrolment), admin@iclp.com,
 * aisha.bello@example.com (TCF), marcus.chen@example.com (TEF), and the
 * published "French Placement Test".
 */

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/SignIn');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/SignIn'));
}

/** Opens the placement runner — starting a fresh attempt, or following the redirect into an existing in-progress one. */
async function startPlacement(page: Page) {
  await page.goto('/assessments/placement');
  const path = new URL(page.url()).pathname;
  if (path !== '/assessments/placement') return; // already redirected into an in-progress attempt
  await page.getByRole('button', { name: /Start (the placement test|a new attempt)/ }).click();
  await page.waitForURL(
    (url) => /^\/assessments\/[^/]+$/.test(url.pathname) && url.pathname !== '/assessments/placement'
  );
}

/** Answers every question (first choice / free text) and submits. Deterministic: drives off the "N / total" counter. */
async function completeRunner(page: Page) {
  await page.waitForURL(/\/assessments\/[^/]+$/);
  const counter = page.getByText(/^\d+ \/ \d+$/);
  const total = Number((await counter.textContent())!.split('/')[1].trim());

  for (let i = 1; i <= total; i++) {
    const radios = page.getByRole('radio');
    if (await radios.count()) {
      await radios.first().click();
    } else {
      const textarea = page.getByLabel('Your answer');
      if (await textarea.count()) await textarea.fill('Une réponse rédigée pour le test.');
    }
    if (i < total) {
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(counter).toHaveText(`${i + 1} / ${total}`);
    } else {
      await page.getByRole('button', { name: 'Submit', exact: true }).click();
    }
  }
  await page.waitForURL(/\/assessments\/result\/[^/]+$/, { timeout: 20_000 });
}

/** Admin: create an assessment via the admin UI, returns the editor URL. */
async function createAssessment(
  page: Page,
  opts: { type: 'PLACEMENT' | 'PRACTICE'; title: string; program?: string }
): Promise<string> {
  await page.goto('/admin/assessments');
  await page.getByRole('button', { name: 'New Assessment' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Type').click();
  await page.getByRole('option', { name: opts.type === 'PLACEMENT' ? 'Placement / diagnostic' : 'Practice' }).click();
  await dialog.getByLabel('Title').fill(opts.title);
  if (opts.type === 'PRACTICE' && opts.program) {
    await dialog.getByLabel('Program').click();
    await page.getByRole('option', { name: opts.program }).click();
  }
  await dialog.getByRole('button', { name: 'Create' }).click();
  await page.waitForURL(/\/admin\/assessments\/[^/]+$/);
  return page.url();
}

/** Admin: add a single-choice question with two options (first is correct) to the open editor. */
async function addSingleChoiceQuestion(page: Page, prompt: string) {
  await page.getByRole('button', { name: 'Add Question' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Prompt').fill(prompt);
  await dialog.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText(prompt)).toBeVisible();
  const card = page.locator('[data-slot="card"]', { hasText: prompt });
  await card.getByPlaceholder('Add an option…').fill('Bonne réponse');
  await card.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(card.getByText('Bonne réponse')).toBeVisible();
  await card.getByPlaceholder('Add an option…').fill('Mauvaise réponse');
  await card.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(card.getByText('Mauvaise réponse')).toBeVisible();
  // mark the first option correct
  await card.getByRole('button', { name: 'Mark as correct' }).first().click();
  await expect(card.getByRole('button', { name: 'Correct answer' })).toBeVisible();
}

test.describe('anonymous public placement', () => {
  test('anyone can take the placement from the homepage and see a result — no sign-in', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Start the placement test/i }).first().click();
    await expect(page).toHaveURL(/\/assessments\/placement$/);
    await page.getByRole('button', { name: /Start the placement test|Start a new attempt/ }).click();
    await completeRunner(page);

    await expect(page).toHaveURL(/\/assessments\/result\//);
    await expect(page.getByText('Estimated level')).toBeVisible();
    await expect(page.getByRole('heading', { name: "What's next" })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse programs' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'See pricing' })).toBeVisible();
    await expect(
      page.getByText('not an official TCF, TEF, DELF or DALF score', { exact: false })
    ).toBeVisible();
    // never nudged toward an account, never redirected to sign-in
    await expect(page).not.toHaveURL(/\/SignIn/);
    const html = await page.content();
    expect(html).not.toMatch(/create (a|an) (free )?account/i);
    expect(html).not.toMatch(/save (this|your) result/i);
  });

  test('the anonymous result is bound to the taker’s browser, not the URL', async ({ page, browser }) => {
    await page.goto('/assessments/placement');
    await page.getByRole('button', { name: /Start the placement test|Start a new attempt/ }).click();
    await completeRunner(page);
    const resultUrl = page.url();
    expect(resultUrl).toMatch(/\/assessments\/result\//);

    // A different browser context has no claim cookie → cannot see the result.
    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await otherPage.goto(resultUrl);
    await expect(otherPage).toHaveURL(/\/assessments\/placement$/);
    await other.close();
  });

  test('the answer key is not present in the take flow', async ({ page }) => {
    await page.goto('/assessments/placement');
    await page.getByRole('button', { name: /Start the placement test|Start a new attempt/ }).click();
    await page.waitForURL(
      (u) => /^\/assessments\/[^/]+$/.test(u.pathname) && u.pathname !== '/assessments/placement'
    );

    const html = await page.content();
    expect(html).not.toContain('isCorrect');
    expect(html).not.toContain('on emploie le subjonctif'); // an explanation from the seed bank
  });

  test('anonymous users cannot reach the hub or history', async ({ page }) => {
    await page.goto('/assessments/history');
    await expect(page).toHaveURL(/\/SignIn/);
    await page.goto('/assessments');
    await expect(page).toHaveURL(/\/SignIn/);
  });
});

test.describe('signed-in placement', () => {
  test('a signed-in student’s placement attempt is attached to the account and in history', async ({ page }) => {
    await signIn(page, 'demo@iclp.com', 'demo1234');
    await startPlacement(page);
    await completeRunner(page);
    await expect(page.getByText('Estimated level')).toBeVisible();

    await page.goto('/assessments/history');
    await expect(page.locator('[data-slot="card"]', { hasText: 'French Placement Test' }).first()).toBeVisible();
  });

  test('resume with the saved answer on reload', async ({ page }) => {
    await signIn(page, 'demo@iclp.com', 'demo1234');
    await startPlacement(page);
    const runnerUrl = page.url();
    const counter = page.getByText(/^\d+ \/ \d+$/);
    const total = (await counter.textContent())!.split('/')[1].trim();

    await page.getByRole('radio').first().click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(counter).toHaveText(`2 / ${total}`);

    await page.goto(runnerUrl);
    await expect(page).toHaveURL(runnerUrl);
    await expect(counter).toHaveText(/^1 \/ /);
    await expect(page.getByRole('radio').first()).toBeChecked();
  });

  test('a student cannot open another student’s result', async ({ page, context }) => {
    await signIn(page, 'demo@iclp.com', 'demo1234');
    await startPlacement(page);
    await completeRunner(page);
    const resultUrl = page.url();
    expect(resultUrl).toMatch(/\/assessments\/result\//);

    await context.clearCookies();
    await signIn(page, 'aisha.bello@example.com', 'student1234');
    await page.goto(resultUrl);
    await expect(page).toHaveURL(/\/assessments\/placement$/);
  });
});

test.describe('admin authoring + practice + review', () => {
  test('DRAFT practice assessment is invisible to students; publishing a scoped one respects enrolment', async ({
    page,
    context,
  }) => {
    const title = `E2E Practice ${Date.now()}`;
    await signIn(page, 'admin@iclp.com', 'admin1234');
    await createAssessment(page, { type: 'PRACTICE', title, program: 'TCF Exam Preparation' });
    await addSingleChoiceQuestion(page, `Q1 for ${title}`);

    // Still DRAFT — an enrolled TCF student must not see it.
    await context.clearCookies();
    await signIn(page, 'aisha.bello@example.com', 'student1234');
    await page.goto('/assessments');
    await expect(page.getByText(title)).toHaveCount(0);

    // Publish it.
    await context.clearCookies();
    await signIn(page, 'admin@iclp.com', 'admin1234');
    await page.goto('/admin/assessments');
    await page
      .locator('[data-slot="card"]', { hasText: title })
      .getByRole('button', { name: 'Publish' })
      .click();
    await expect(
      page.locator('[data-slot="card"]', { hasText: title }).getByText('PUBLISHED')
    ).toBeVisible();

    // TCF student now sees + can start it; TEF student does not.
    await context.clearCookies();
    await signIn(page, 'aisha.bello@example.com', 'student1234');
    await page.goto('/assessments');
    await expect(page.getByText(title)).toBeVisible();

    await context.clearCookies();
    await signIn(page, 'marcus.chen@example.com', 'student1234');
    await page.goto('/assessments');
    await expect(page.getByText(title)).toHaveCount(0);
  });

  test('a free-text answer routes the attempt to review; admin grades and finalizes', async ({
    page,
    context,
  }) => {
    const title = `E2E Written ${Date.now()}`;
    await signIn(page, 'admin@iclp.com', 'admin1234');
    await createAssessment(page, { type: 'PRACTICE', title, program: 'TCF Exam Preparation' });

    // one short-text question
    await page.getByRole('button', { name: 'Add Question' }).click();
    const qDialog = page.getByRole('dialog');
    await qDialog.getByLabel('Type').click();
    await page.getByRole('option', { name: 'Short text' }).click();
    await qDialog.getByLabel('Prompt').fill(`Écris une phrase — ${title}`);
    await qDialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(`Écris une phrase — ${title}`)).toBeVisible();

    await page.goto('/admin/assessments');
    await page
      .locator('[data-slot="card"]', { hasText: title })
      .getByRole('button', { name: 'Publish' })
      .click();
    await expect(
      page.locator('[data-slot="card"]', { hasText: title }).getByText('PUBLISHED')
    ).toBeVisible();

    // student takes it
    await context.clearCookies();
    await signIn(page, 'aisha.bello@example.com', 'student1234');
    await page.goto('/assessments');
    await page
      .locator('[data-slot="card"]', { hasText: title })
      .getByRole('button', { name: 'Start' })
      .click();
    await completeRunner(page);
    await expect(page.getByText(/being reviewed by an instructor/)).toBeVisible();

    // admin grades + finalizes
    await context.clearCookies();
    await signIn(page, 'admin@iclp.com', 'admin1234');
    await page.goto('/admin/assessments/review');
    await page.getByText(title).click();
    await page.waitForURL(/\/admin\/assessments\/review\/[^/]+$/);
    await page.getByLabel(/Points/).fill('1');
    await page.getByRole('button', { name: /Save|Update/ }).click();
    await page.getByRole('button', { name: 'Finalize & release result' }).click();
    await expect(page.getByText('Result finalized and released to the student.')).toBeVisible();

    // student now sees a finalized result
    await context.clearCookies();
    await signIn(page, 'aisha.bello@example.com', 'student1234');
    await page.goto('/assessments/history');
    await expect(page.locator('[data-slot="card"]', { hasText: title })).toBeVisible();
    await expect(
      page.locator('[data-slot="card"]', { hasText: title }).getByText('Awaiting review')
    ).toHaveCount(0);
  });
});
