import { test, expect, type Page } from '@playwright/test';

/**
 * Student / staff account lifecycle (Phase 2 Task 11): admin-provisioned accounts
 * are INVITED (no password) until the invitee sets one via a single-use link;
 * archiving an account blocks sign-in but keeps every record and can be undone;
 * a deactivated account loses access immediately, mid-session included; password
 * reset and in-app password change work off the existing auth stack.
 *
 * Seeded fixtures: admin@iclp.com / admin1234; instructor@iclp.com / admin1234
 * (INSTRUCTOR); invited.student@example.com + invited.instructor@example.com
 * (INVITED, no password); archived.student@example.com / student1234
 * (DEACTIVATED, with a graded submission "Solid work — kept on file..." and a
 * manual payment).
 */

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/SignIn');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

async function signInExpectingSuccess(page: Page, email: string, password: string) {
  await signIn(page, email, password);
  await page.waitForURL((url) => !url.pathname.startsWith('/SignIn'));
}

/** Create a student via the admin dialog; returns the one-time invite URL shown when email is unconfigured. */
async function inviteStudent(page: Page, name: string, email: string): Promise<string> {
  await page.goto('/admin/students');
  await page.getByRole('button', { name: 'Add Student' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name').fill(name);
  await dialog.getByLabel('Email').fill(email);
  await dialog.getByRole('button', { name: 'Add Student' }).click();
  await expect(dialog).toBeHidden();
  const link = page.locator('code', { hasText: '/invite/' }).first();
  await expect(link).toBeVisible();
  return (await link.textContent())!.trim();
}

test('admin invites a student → single-use activation link → sign in → change password', async ({
  page,
  context,
}) => {
  const stamp = Date.now();
  const email = `lifecycle.${stamp}@example.com`;
  const password = 'Activate123!';

  await signInExpectingSuccess(page, 'admin@iclp.com', 'admin1234');
  const inviteUrl = await inviteStudent(page, `Lifecycle ${stamp}`, email);
  const invitePath = new URL(inviteUrl).pathname;

  // The account exists but cannot sign in yet (no password).
  await context.clearCookies();
  await signIn(page, email, password);
  await expect(page.getByText('Invalid email or password.')).toBeVisible();

  // Activate via the link.
  await page.goto(invitePath);
  await expect(page.getByText(new RegExp(`Choose a password for ${email}`, 'i'))).toBeVisible();
  await page.getByLabel('New password', { exact: true }).fill(password);
  await page.getByLabel('Confirm new password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Activate my account' }).click();
  await expect(page.getByText('Account activated')).toBeVisible();

  // The link is single-use.
  await page.goto(invitePath);
  await expect(page.getByText(/invalid or has expired/i)).toBeVisible();

  // Now sign-in works; a PENDING enrollment means the onboarding state.
  await signInExpectingSuccess(page, email, password);
  await expect(page).toHaveURL(/\/dashboard$/);

  // In-app password change: wrong current is rejected, then a real rotation.
  // Settings has just the one working (Security) section — no tabs to switch
  // (V1 Launch Gate item 3 dropped the non-functional Profile/Notifications/
  // Language tabs and the fake 2FA card).
  await page.goto('/dashboard/settings');
  await page.getByLabel('Current Password').fill('not-the-password');
  await page.getByLabel('New Password', { exact: true }).fill('Rotated123!');
  await page.getByLabel('Confirm New Password').fill('Rotated123!');
  await page.getByRole('button', { name: 'Update Password' }).click();
  await expect(page.getByText(/current password is incorrect/i)).toBeVisible();

  await page.getByLabel('Current Password').fill(password);
  await page.getByLabel('New Password', { exact: true }).fill('Rotated123!');
  await page.getByLabel('Confirm New Password').fill('Rotated123!');
  await page.getByRole('button', { name: 'Update Password' }).click();
  await expect(page.getByText('Your password has been updated.')).toBeVisible();

  await context.clearCookies();
  await signIn(page, email, password);
  await expect(page.getByText('Invalid email or password.')).toBeVisible();
  await signInExpectingSuccess(page, email, 'Rotated123!');
});

test('an invited-but-not-activated student cannot sign in', async ({ page }) => {
  await signIn(page, 'invited.student@example.com', 'anything-at-all');
  await expect(page.getByText('Invalid email or password.')).toBeVisible();
  await expect(page).toHaveURL(/\/SignIn/);
});

test('revoking a pending invite removes the account and kills its link', async ({ page }) => {
  const stamp = Date.now();
  const email = `revoke.${stamp}@example.com`;

  await signInExpectingSuccess(page, 'admin@iclp.com', 'admin1234');
  const inviteUrl = await inviteStudent(page, `Revoke ${stamp}`, email);
  const invitePath = new URL(inviteUrl).pathname;

  const row = page.getByRole('row', { name: new RegExp(email) });
  await row.getByRole('button', { name: 'Revoke invite' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Revoke invite' }).click();
  await expect(page.getByRole('alertdialog')).toBeHidden();
  await expect(page.getByRole('row', { name: new RegExp(email) })).toHaveCount(0);

  // The activation link no longer resolves.
  await page.context().clearCookies();
  await page.goto(invitePath);
  await expect(page.getByText(/invalid or has expired/i)).toBeVisible();
});

test('a deactivated student is locked out but keeps their history; reactivation restores access', async ({
  page,
  context,
}) => {
  const archivedRow = () =>
    page.getByRole('row', { name: /archived\.student@example\.com/ });

  // Normalise the shared-DB fixture to DEACTIVATED (a prior run may have left it
  // active).
  await signInExpectingSuccess(page, 'admin@iclp.com', 'admin1234');
  await page.goto('/admin/students?deactivated=1');
  if (await archivedRow().getByRole('button', { name: 'Deactivate' }).count()) {
    await archivedRow().getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Deactivate' }).click();
    await expect(archivedRow().getByText('deactivated', { exact: true })).toBeVisible();
  }

  // Locked out while archived.
  await context.clearCookies();
  await signIn(page, 'archived.student@example.com', 'student1234');
  await expect(page.getByText('Invalid email or password.')).toBeVisible();

  await signInExpectingSuccess(page, 'admin@iclp.com', 'admin1234');

  // The archived account is hidden by default, shown behind the toggle, and its
  // graded work is still on the record.
  await page.goto('/admin/students');
  await expect(archivedRow()).toHaveCount(0);
  await page.getByRole('button', { name: 'Show deactivated' }).click();
  const row = archivedRow();
  await expect(row).toBeVisible();
  await expect(row.getByText('deactivated', { exact: true })).toBeVisible();

  await page.goto('/admin/grading');
  await page.getByRole('tab', { name: /Graded/ }).click();
  await expect(page.getByText('Solid work — kept on file after the account was archived.')).toBeVisible();

  // Reactivate → the student can sign in again with their data intact.
  await page.goto('/admin/students?deactivated=1');
  await page
    .getByRole('row', { name: /archived\.student@example\.com/ })
    .getByRole('button', { name: 'Reactivate' })
    .click();
  await expect(
    page.getByRole('row', { name: /archived\.student@example\.com/ }).getByText('active', { exact: true })
  ).toBeVisible();

  try {
    await context.clearCookies();
    await signInExpectingSuccess(page, 'archived.student@example.com', 'student1234');
    await expect(page).toHaveURL(/\/dashboard$/);
  } finally {
    // Restore the fixture to DEACTIVATED for the next run.
    await context.clearCookies();
    await signInExpectingSuccess(page, 'admin@iclp.com', 'admin1234');
    await page.goto('/admin/students');
    await page
      .getByRole('row', { name: /archived\.student@example\.com/ })
      .getByRole('button', { name: 'Deactivate' })
      .click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Deactivate' }).click();
    await expect(page.getByRole('alertdialog')).toBeHidden();
  }
});

test('deactivating a student mid-session revokes access on the next request', async ({ browser }) => {
  const studentCtx = await browser.newContext();
  const adminCtx = await browser.newContext();
  try {
    const studentPage = await studentCtx.newPage();
    const adminPage = await adminCtx.newPage();

    const stamp = Date.now();
    const email = `midsession.${stamp}@example.com`;
    const password = 'MidSession123!';

    await signInExpectingSuccess(adminPage, 'admin@iclp.com', 'admin1234');
    const inviteUrl = await inviteStudent(adminPage, `Mid Session ${stamp}`, email);
    await studentPage.goto(new URL(inviteUrl).pathname);
    await studentPage.getByLabel('New password', { exact: true }).fill(password);
    await studentPage.getByLabel('Confirm new password', { exact: true }).fill(password);
    await studentPage.getByRole('button', { name: 'Activate my account' }).click();
    await expect(studentPage.getByText('Account activated')).toBeVisible();

    await signInExpectingSuccess(studentPage, email, password);
    await expect(studentPage).toHaveURL(/\/dashboard$/);

    // Admin archives the student while their session cookie is still valid.
    await adminPage.goto('/admin/students');
    await adminPage
      .getByRole('row', { name: new RegExp(email) })
      .getByRole('button', { name: 'Deactivate' })
      .click();
    await adminPage.getByRole('alertdialog').getByRole('button', { name: 'Deactivate' }).click();
    await expect(adminPage.getByRole('alertdialog')).toBeHidden();

    // Next navigation with the still-present cookie is bounced to sign-in.
    await studentPage.goto('/dashboard');
    await expect(studentPage).toHaveURL(/\/SignIn/);
  } finally {
    await studentCtx.close();
    await adminCtx.close();
  }
});

test('admin invites an instructor; deactivating a staff account removes privileged access', async ({
  page,
  context,
}) => {
  const stamp = Date.now();
  const staffEmail = `instructor.${stamp}@example.com`;

  await signInExpectingSuccess(page, 'admin@iclp.com', 'admin1234');

  // Invite a fresh instructor — shows up as INVITED.
  await page.goto('/admin/staff');
  await page.getByRole('button', { name: 'Invite Staff' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name').fill(`New Instructor ${stamp}`);
  await dialog.getByLabel('Email').fill(staffEmail);
  await dialog.getByRole('button', { name: 'Send Invite' }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole('row', { name: new RegExp(staffEmail) }).getByText('invited', { exact: true })
  ).toBeVisible();

  // Admin cannot deactivate their own account.
  const selfRow = page.getByRole('row', { name: /admin@iclp\.com/ });
  await expect(selfRow.getByRole('button', { name: 'Deactivate' })).toBeDisabled();

  // Deactivate the seeded instructor → they lose access; reactivate to restore.
  await page
    .getByRole('row', { name: /instructor@iclp\.com/ })
    .getByRole('button', { name: 'Deactivate' })
    .click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Deactivate' }).click();
  await expect(page.getByRole('alertdialog')).toBeHidden();

  try {
    await context.clearCookies();
    await signIn(page, 'instructor@iclp.com', 'admin1234');
    await expect(page.getByText('Invalid email or password.')).toBeVisible();
  } finally {
    await context.clearCookies();
    await signInExpectingSuccess(page, 'admin@iclp.com', 'admin1234');
    await page.goto('/admin/staff');
    await page
      .getByRole('row', { name: /instructor@iclp\.com/ })
      .getByRole('button', { name: 'Reactivate' })
      .click();
    await expect(
      page.getByRole('row', { name: /instructor@iclp\.com/ }).getByText('active', { exact: true })
    ).toBeVisible();
  }

  // Reactivated instructor can reach the attendance-management surface again.
  await context.clearCookies();
  await signInExpectingSuccess(page, 'instructor@iclp.com', 'admin1234');
  await page.goto('/attendance/manage');
  await expect(page).toHaveURL(/\/attendance\/manage/);
});

test('a student cannot reach the staff admin screen', async ({ page }) => {
  await signInExpectingSuccess(page, 'aisha.bello@example.com', 'student1234');
  await page.goto('/admin/staff');
  await expect(page).toHaveURL(/\/SignIn/);
});

test('password reset request always shows the same neutral confirmation', async ({ page }) => {
  await page.goto('/reset-password');
  await page.getByLabel('Email').fill(`ghost.${Date.now()}@nowhere.example`);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByText(/if that email has an ICLP account/i)).toBeVisible();
});
