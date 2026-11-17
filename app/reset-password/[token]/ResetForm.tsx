"use client";

import { SetPasswordForm } from "../../../components/SetPasswordForm";
import { resetPasswordAction } from "../actions";

export default function ResetForm({ token }: { token: string }) {
  return (
    <SetPasswordForm
      action={(password) => resetPasswordAction({ token, password })}
      submitLabel="Set new password"
      pendingLabel="Saving..."
      successTitle="Password updated"
      successBody="Your password has been changed. You can now sign in with it."
    />
  );
}
