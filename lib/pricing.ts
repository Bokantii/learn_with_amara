// Canonical charge amounts, independent of the display strings in
// lib/i18n/translations.ts (which are per-language formatted text like
// "$800" / "800 $" and aren't safe to parse for a real charge).
export const PLAN_PRICES_CENTS: Record<string, number> = {
  tcfTefBeginner: 80000,
  tcfTefExamPrep: 30000,
  delfDalfBeginner: 80000,
  delfDalfExamPrep: 30000,
};

export const DEFAULT_PLAN_ID = 'tcfTefBeginner';
