import type { CefrLevel } from '../generated/prisma/client';

/**
 * Maps an estimated CEFR level to a recommended ICLP program (SPEC §9.2
 * "recommend an appropriate program/next step"). This is a deliberate, tunable
 * static config — there is no self-serve enrolment flow, so the result page
 * surfaces the recommendation as guidance with a link to /Courses, never an
 * automatic enrolment. `headline` is a display fallback if the program row
 * cannot be resolved by `track`.
 */

export interface TrackRecommendation {
  track: string;
  headline: string;
  rationale: string;
}

const NONE: TrackRecommendation = {
  track: 'tcf-exam-prep',
  headline: 'TCF Exam Preparation',
  rationale:
    'Start with the fundamentals and build steadily toward exam-ready French, with TCF/TEF prep in the final stretch.',
};

const BY_LEVEL: Record<CefrLevel, TrackRecommendation> = {
  A1: NONE,
  A2: NONE,
  B1: {
    track: 'tef-canada-prep',
    headline: 'TEF Canada Preparation',
    rationale:
      'You already have a working base. Focused exam preparation will sharpen the specific skills the TEF/TCF tests.',
  },
  B2: {
    track: 'tef-canada-prep',
    headline: 'TEF Canada Preparation',
    rationale:
      'You are close to exam-ready. Targeted practice on timing and exam technique is the best next step.',
  },
  C1: {
    track: 'delf-dalf-track',
    headline: 'DELF/DALF Track',
    rationale:
      'At an advanced level, the DELF/DALF diplomas certify your French for study and professional use.',
  },
  C2: {
    track: 'delf-dalf-track',
    headline: 'DELF/DALF Track',
    rationale:
      'Your French is strong. The DALF (C1/C2) is the credential that reflects mastery for academic and professional contexts.',
  },
};

export function recommendTrack(cefr: CefrLevel | null): TrackRecommendation {
  return cefr ? BY_LEVEL[cefr] : NONE;
}
