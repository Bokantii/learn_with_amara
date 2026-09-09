import { ATTENDANCE_LATE_THRESHOLD_MINUTES } from './constants';

/**
 * PRESENT/LATE is computed from the check-in timestamp against the class
 * start time — never entered manually for a real QR check-in. Pure function,
 * no I/O.
 */
export function computeCheckInStatus(checkedInAt: Date, startsAt: Date): 'PRESENT' | 'LATE' {
  const lateAfter = startsAt.getTime() + ATTENDANCE_LATE_THRESHOLD_MINUTES * 60_000;
  return checkedInAt.getTime() <= lateAfter ? 'PRESENT' : 'LATE';
}
