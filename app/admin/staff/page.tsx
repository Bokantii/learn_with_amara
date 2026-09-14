import { redirect } from 'next/navigation';
import { getSessionUser } from '../../../lib/authz';
import { listAdminStaff } from '../../../lib/account/queries';
import StaffClient from './StaffClient';

export const dynamic = 'force-dynamic';

export default async function AdminStaffPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') {
    redirect('/SignIn');
  }

  const staff = await listAdminStaff();

  const rows = staff.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role as 'ADMIN' | 'INSTRUCTOR',
    status: s.status,
    joinedDate: s.createdAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  }));

  return <StaffClient initialStaff={rows} currentAdminId={user.id} />;
}
