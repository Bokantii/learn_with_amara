"use client";

import { SetPasswordForm } from "../../../components/SetPasswordForm";
import { acceptInviteAction } from "../actions";

export default function InviteForm({ token }: { token: string }) {
  return (
    <SetPasswordForm
      action={(password) => acceptInviteAction({ token, password })}
      submitLabel="Activate my account"
      pendingLabel="Activating..."
      successTitle="Account activated"
      successBody="Your account is ready. Sign in with your email and new password."
    />
  );
}
