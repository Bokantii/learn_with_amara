import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/authz';
import { getCheckInPreview } from '@/lib/attendance/checkin';
import { buildCheckInPath } from '@/lib/attendance/url';
import CheckInConfirmClient from './CheckInConfirmClient';

export const dynamic = 'force-dynamic';

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <CheckInConfirmClient token={null} preview={{ ok: false }} />;
  }

  const user = await getSessionUser();
  if (!user?.id) {
    // Resume the scan after login. `callbackUrl` is a fixed same-origin relative
    // path; SignIn re-validates it before navigating.
    redirect(`/SignIn?callbackUrl=${encodeURIComponent(buildCheckInPath(token))}`);
  }

  const preview = await getCheckInPreview(token);

  return (
    <CheckInConfirmClient
      token={token}
      preview={
        preview.ok
          ? {
              ok: true,
              title: preview.title,
              instructorName: preview.instructorName,
              startsAt: preview.startsAt.toISOString(),
              classStatus: preview.classStatus,
            }
          : { ok: false }
      }
    />
  );
}
