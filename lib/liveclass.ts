// Institutional default Zoom link (SPEC §10.6). Admin may override per class.
export const DEFAULT_MEETING_URL =
  'https://us06web.zoom.us/j/79255568040?pwd=x7q9aFaZEGwmSQjLbn6DrXla7uWO6d.1';

export const CANCELLATION_REASON_LABEL = {
  NETWORK_ISSUES: 'Network issues',
  INSTRUCTOR_UNAVAILABLE: 'Instructor unavailable',
  EMERGENCY: 'Emergency',
  SCHEDULING_CONFLICT: 'Scheduling conflict',
  OTHER: 'Other',
} as const;

export type CancellationReason = keyof typeof CANCELLATION_REASON_LABEL;

export const CANCELLATION_REASONS = Object.keys(CANCELLATION_REASON_LABEL) as CancellationReason[];
