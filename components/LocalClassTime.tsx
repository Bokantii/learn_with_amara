'use client';

import { useSyncExternalStore } from 'react';
import { PRIMARY_CLASS_TIME_ZONE } from '@/lib/class-time';

/**
 * Renders a live-class date or time range in the VIEWER's own time zone
 * (SPEC Known Deferred Issue #5). Server components don't know the viewer's
 * zone — on Vercel they would format in UTC — so the server/first paint shows
 * the primary zone (Lagos, labelled), and after mount the browser swaps in the
 * viewer's local time with its zone abbreviation. Client-only because the
 * browser's time zone is genuinely only known in the browser.
 */
type Props = {
  startsAt: string;
  endsAt?: string;
  /** 'date' → "Thursday, November 12, 2026"; 'time' → "9:00 PM – 10:30 PM GMT+1"; 'dateTime' → both, short date. */
  variant: 'date' | 'time' | 'dateTime';
};

function format(startsAt: Date, endsAt: Date | null, variant: Props['variant'], timeZone?: string): string {
  const opts = timeZone ? { timeZone } : {};
  if (variant === 'date') {
    return startsAt.toLocaleDateString('en-US', { ...opts, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
  const time = (d: Date, withZone: boolean) =>
    d.toLocaleTimeString('en-US', { ...opts, hour: 'numeric', minute: '2-digit', ...(withZone ? { timeZoneName: 'short' } : {}) });
  const range = endsAt ? `${time(startsAt, false)} – ${time(endsAt, true)}` : time(startsAt, true);
  if (variant === 'time') return range;
  const date = startsAt.toLocaleDateString('en-US', { ...opts, month: 'short', day: 'numeric', year: 'numeric' });
  return `${date} · ${range}`;
}

const subscribeNoop = () => () => {};

export function LocalClassTime({ startsAt, endsAt, variant }: Props) {
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;
  const primary = PRIMARY_CLASS_TIME_ZONE;
  const fallback =
    format(start, end, variant, primary.timeZone) + (variant === 'date' ? '' : ` (${primary.label})`);

  // false during SSR and hydration (so the first client render matches the
  // server HTML), true afterwards — then the browser's own zone is used.
  const isBrowser = useSyncExternalStore(subscribeNoop, () => true, () => false);

  return <time dateTime={startsAt}>{isBrowser ? format(start, end, variant) : fallback}</time>;
}
