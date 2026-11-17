import { getAppOriginOrEmpty } from '../app-url';
import { sendAccountEmail } from './mail';
import StudentInviteEmail from '../../emails/StudentInviteEmail';
import StaffInviteEmail from '../../emails/StaffInviteEmail';

/**
 * Email the `/invite/<token>` activation link. Never fails the caller's write:
 * when the origin can't be resolved or email is unconfigured/rejected, it
 * returns the link so the admin UI can offer "Copy invite link" instead.
 */
export async function deliverInvite(opts: {
  name: string;
  email: string;
  rawToken: string;
  kind: 'student' | 'staff';
  /** Required for `kind: 'staff'` — "administrator" / "instructor". */
  roleLabel?: string;
}): Promise<{ inviteEmailSent: boolean; inviteUrl?: string }> {
  const origin = await getAppOriginOrEmpty();
  const url = `${origin}/invite/${opts.rawToken}`; // relative when origin === ''

  const react =
    opts.kind === 'staff'
      ? StaffInviteEmail({
          name: opts.name,
          roleLabel: opts.roleLabel ?? 'staff',
          inviteUrl: url,
        })
      : StudentInviteEmail({ name: opts.name, inviteUrl: url });

  // A relative link is useless in an email — only attempt delivery with a real origin.
  const { sent } = origin
    ? await sendAccountEmail({ to: opts.email, subject: 'Activate your ICLP account', react })
    : { sent: false };

  return { inviteEmailSent: sent, inviteUrl: sent ? undefined : url };
}
