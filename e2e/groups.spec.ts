import { test, expect } from '@playwright/test';

async function signIn(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/SignIn');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

test('admin sees seeded groups with correct member counts', async ({ page }) => {
  await signIn(page, 'admin@iclp.com', 'admin1234');
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/groups');
  await expect(page.getByText('TCF Morning Cohort')).toBeVisible();
  await expect(page.getByText('2 members')).toBeVisible();
  await expect(page.getByText('TEF Weekend Intensive')).toBeVisible();
  await expect(page.getByText('1 member', { exact: true })).toBeVisible();
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
  await signIn(page, 'elena.rossi@example.com', 'student1234');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("You haven't been added to a group yet.")).toBeVisible();

  await page.goto('/dashboard/assignments');
  await expect(page.getByText('TCF Morning Cohort Speaking Drill')).not.toBeVisible();
});
