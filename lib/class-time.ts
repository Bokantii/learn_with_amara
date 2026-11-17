/**
 * Live-class time formatting (SPEC Known Deferred Issue #5).
 *
 * `LiveClass.startsAt` is stored as an exact instant (the admin form converts
 * the admin's local wall-clock time to UTC), so the stored data is correct.
 * What was wrong is how server-side text showed it: hard-coded UTC. Emails and
 * in-app notification text are rendered on the server, where the student's own
 * time zone is unknown, so they list the class time in every zone ICLP's
 * students live in, the same way the team's hand-written reminders do
 * ("9pm GMT+1 / 3pm EST (Toronto)"). Daylight saving is handled by the IANA
 * zone data, never by fixed offsets.
 *
 * Pages that render in the browser show the viewer's own local time instead
 * (see components/LocalClassTime.tsx).
 */

/** The zones every class time is shown in. The first one anchors the date. */
export const CLASS_TIME_ZONES = [
  { timeZone: 'Africa/Lagos', label: 'Lagos' },
  { timeZone: 'America/Toronto', label: 'Toronto' },
  { timeZone: 'America/Winnipeg', label: 'Winnipeg' },
  { timeZone: 'America/Vancouver', label: 'Vancouver' },
  { timeZone: 'Europe/London', label: 'London' },
] as const;

export const PRIMARY_CLASS_TIME_ZONE = CLASS_TIME_ZONES[0];

const LOCALE = 'en-US';

/** YYYY-MM-DD of `date` as seen in `timeZone` (used to detect a day change). */
function calendarDay(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    date
  );
}

function zoneAbbreviation(date: Date, timeZone: string): string {
  const part = new Intl.DateTimeFormat(LOCALE, { timeZone, timeZoneName: 'short' })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName');
  return part?.value ?? timeZone;
}

/** "Thursday, November 12, 2026" in the primary (Lagos) zone. */
export function formatClassDate(date: Date): string {
  return date.toLocaleDateString(LOCALE, {
    timeZone: PRIMARY_CLASS_TIME_ZONE.timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * One entry per zone, e.g. "9:00 PM Lagos (GMT+1)" or, when that zone is
 * already on a different calendar day than Lagos, "11:30 PM Wed Vancouver (PST)".
 */
export function formatClassTimeInZones(date: Date): string[] {
  const anchorDay = calendarDay(date, PRIMARY_CLASS_TIME_ZONE.timeZone);
  return CLASS_TIME_ZONES.map(({ timeZone, label }) => {
    const time = date.toLocaleTimeString(LOCALE, { timeZone, hour: 'numeric', minute: '2-digit' });
    const day =
      calendarDay(date, timeZone) === anchorDay
        ? ''
        : ` ${date.toLocaleDateString(LOCALE, { timeZone, weekday: 'short' })}`;
    return `${time}${day} ${label} (${zoneAbbreviation(date, timeZone)})`;
  });
}

/**
 * Full server-side text for emails and notifications:
 * "Thursday, November 12, 2026 — 9:00 PM Lagos (GMT+1) · 3:00 PM Toronto (EST) · …"
 */
export function formatClassTime(date: Date): string {
  return `${formatClassDate(date)} — ${formatClassTimeInZones(date).join(' · ')}`;
}
