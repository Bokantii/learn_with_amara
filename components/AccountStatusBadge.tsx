import { Badge } from "./ui/badge";

export type AccountStatus = "INVITED" | "ACTIVE" | "DEACTIVATED";

const BADGE_CLASS: Record<AccountStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  INVITED: "bg-amber-50 text-amber-700 hover:bg-amber-50",
  DEACTIVATED: "bg-slate-200 text-slate-600 hover:bg-slate-200",
};

const LABEL: Record<AccountStatus, string> = {
  ACTIVE: "active",
  INVITED: "invited",
  DEACTIVATED: "deactivated",
};

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  return (
    <Badge variant="secondary" className={BADGE_CLASS[status]}>
      {LABEL[status]}
    </Badge>
  );
}
