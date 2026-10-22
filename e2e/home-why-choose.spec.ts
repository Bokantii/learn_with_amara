import { test, expect } from '@playwright/test';

const FABRICATED_NAMES = ['Sarah Johnson', 'Michael Chen', 'Emma Rodriguez'];

test('home page shows the truthful "Why Students Choose ICLP" section, not fabricated testimonials', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Why Students Choose ICLP' })).toBeVisible();
  for (const title of [
    'Interactive Live Classes via Zoom',
    'Structured Programs & Exercises',
    'Personalized Assignment Feedback',
    'Flexible Access to Resources & Replays',
  ]) {
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
  }

  // The old invented testimonials must be gone.
  await expect(page.getByText('What Our Students Say')).toHaveCount(0);
  for (const name of FABRICATED_NAMES) {
    await expect(page.getByText(name)).toHaveCount(0);
  }
});

test('the "Why Students Choose ICLP" section follows the FR toggle', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'EN' }).first().click();
  await expect(page.getByRole('button', { name: 'FR' }).first()).toBeVisible();

  await expect(page.getByRole('heading', { name: 'Pourquoi choisir ICLP ?' })).toBeVisible();
  for (const title of [
    'Cours interactifs en direct sur Zoom',
    'Programmes structurés et exercices',
    'Commentaires personnalisés sur les devoirs',
    'Accès flexible aux ressources et aux rediffusions',
  ]) {
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
  }
  await expect(page.getByText('Ce que disent nos étudiants')).toHaveCount(0);
});
