import type { CefrLevel, QuestionSkill, QuestionType } from '../generated/prisma/client';

/**
 * The take-flow serializer. `toStudentQuestion` is the ONLY shape the assessment
 * runner (page props + save action) is ever given — it strips `isCorrect`,
 * `explanation`, and every grading field so an answer key can never reach the
 * client mid-attempt (SPEC §9.2 "prevent answer leakage", §19). The answer key
 * appears only via `toReviewQuestion`, on the post-submit result page, for an
 * attempt the requester owns.
 */

interface RawOption {
  id: string;
  text: string;
  order: number;
  isCorrect: boolean;
}

interface RawQuestion {
  id: string;
  type: QuestionType;
  skill: QuestionSkill;
  cefrLevel: CefrLevel | null;
  prompt: string;
  explanation: string | null;
  maxPoints: number | null;
  options: RawOption[];
}

interface RawResponse {
  selectedOptionId: string | null;
  textResponse: string | null;
  isCorrect: boolean | null;
  awardedPoints: number | null;
  graderFeedback: string | null;
}

export interface StudentQuestion {
  id: string;
  type: QuestionType;
  skill: QuestionSkill;
  cefrLevel: CefrLevel | null;
  prompt: string;
  options: { id: string; text: string }[];
}

export function toStudentQuestion(question: RawQuestion): StudentQuestion {
  return {
    id: question.id,
    type: question.type,
    skill: question.skill,
    cefrLevel: question.cefrLevel,
    prompt: question.prompt,
    options: [...question.options]
      .sort((a, b) => a.order - b.order)
      .map((o) => ({ id: o.id, text: o.text })),
  };
}

export interface ReviewQuestion {
  id: string;
  type: QuestionType;
  skill: QuestionSkill;
  cefrLevel: CefrLevel | null;
  prompt: string;
  explanation: string | null;
  maxPoints: number | null;
  options: { id: string; text: string; isCorrect: boolean }[];
  yourOptionId: string | null;
  yourText: string | null;
  isCorrect: boolean | null;
  awardedPoints: number | null;
  graderFeedback: string | null;
}

export function toReviewQuestion(
  question: RawQuestion,
  response: RawResponse | null | undefined
): ReviewQuestion {
  return {
    id: question.id,
    type: question.type,
    skill: question.skill,
    cefrLevel: question.cefrLevel,
    prompt: question.prompt,
    explanation: question.explanation,
    maxPoints: question.maxPoints,
    options: [...question.options]
      .sort((a, b) => a.order - b.order)
      .map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
    yourOptionId: response?.selectedOptionId ?? null,
    yourText: response?.textResponse ?? null,
    isCorrect: response?.isCorrect ?? null,
    awardedPoints: response?.awardedPoints ?? null,
    graderFeedback: response?.graderFeedback ?? null,
  };
}
