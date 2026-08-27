import { test, expect } from '@playwright/test';

async function signIn(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/SignIn');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

test('admin sees seeded groups with correct member counts', async ({ page }) => {
  // Scoped to each seeded group's own card rather than a page-wide text search, so this
  // doesn't assume the dev DB contains only these two groups — other groups created through
  // manual testing may coexist without affecting this assertion.
  await signIn(page, 'admin@iclp.com', 'admin1234');
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/groups');

  const tcfCard = page.locator('[data-slot="card"]', { hasText: 'TCF Morning Cohort' });
  await expect(tcfCard).toBeVisible();
  await expect(tcfCard.getByText('2 members')).toBeVisible();

  const tefCard = page.locator('[data-slot="card"]', { hasText: 'TEF Weekend Intensive' });
  await expect(tefCard).toBeVisible();
  await expect(tefCard.getByText('1 member', { exact: true })).toBeVisible();
});

test('group member sees their group on the dashboard and the group assignment alongside individual ones', async ({ page }) => {
  await signIn(page, 'aisha.bello@example.com', 'student1234');
  await expect(page).toHaveURL(/\/dashboard$/);

  await expect(page.getByText('My Group')).toBeVisible();
  await expect(page.getByText('TCF Morning Cohort')).toBeVisible();

  await page.goto('/dashboard/assignments');
  const groupAssignmentCard = page.getByText('TCF Morning Cohort Speaking Drill').locator('..').locator('..');
  await expect(groupAssignmentCard.getByText('Group: TCF Morning Cohort')).toBeVisible();
});

test('non-member does not see the group assignment', async ({ page }) => {
  // elena.rossi is guaranteed by prisma/seed.ts's groupMemberSeeds to never be a member of
  // TCF Morning Cohort specifically (only aisha.bello/lucas.martin are seeded into it) —
  // that's the only thing this test needs to be true, regardless of what other groups she
  // may have been added to via manual testing.
  await signIn(page, 'elena.rossi@example.com', 'student1234');
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/dashboard/assignments');
  await expect(page.getByText('TCF Morning Cohort Speaking Drill')).not.toBeVisible();
});
