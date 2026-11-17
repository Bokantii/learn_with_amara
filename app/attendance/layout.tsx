import Link from 'next/link';

/**
 * Thin shell for the attendance surface. Deliberately NOT under `/dashboard`
 * (whose layout hides everything behind an active-enrollment gate) or `/admin`
 * (ADMIN-only): QR check-in must work for any entitled student, and the manage
 * screens must be reachable by INSTRUCTOR as well as ADMIN.
 *
 * Auth is enforced per page, not here — the check-in page needs to redirect
 * unauthenticated visitors to sign-in with a `callbackUrl` so the scan resumes
 * after login, which a layout-level redirect would swallow.
 */
export default function AttendanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">I</span>
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-tight">ICLP</p>
            <p className="text-xs text-slate-500 leading-tight">Attendance</p>
          </div>
          <Link href="/dashboard" className="ml-auto text-sm text-slate-500 hover:text-slate-900">
            Back to dashboard
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 sm:p-8">{children}</main>
    </div>
  );
}
