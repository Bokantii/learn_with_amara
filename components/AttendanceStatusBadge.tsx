import { Check, Clock, Minus, ShieldCheck } from 'lucide-react';
import { Badge } from './ui/badge';

export type AttendanceStatusValue = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';

const CONFIG: Record<
  AttendanceStatusValue,
  { label: string; className: string; Icon: typeof Check }
> = {
  PRESENT: { label: 'Present', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100', Icon: Check },
  LATE: { label: 'Late', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100', Icon: Clock },
  ABSENT: { label: 'Absent', className: 'bg-slate-100 text-slate-600 hover:bg-slate-100', Icon: Minus },
  EXCUSED: { label: 'Excused', className: 'bg-sky-100 text-sky-700 hover:bg-sky-100', Icon: ShieldCheck },
};

/**
 * Status cue that never relies on colour alone — every state carries its own
 * word and glyph (SPEC §20 accessibility).
 */
export function AttendanceStatusBadge({ status }: { status: AttendanceStatusValue }) {
  const { label, className, Icon } = CONFIG[status];
  return (
    <Badge className={`${className} text-xs gap-1`}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      {label}
    </Badge>
  );
}
