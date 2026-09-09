import { describe, it, expect } from 'vitest';
import { toStudentQuestion, toReviewQuestion } from './serialize';

const rawQuestion = {
  id: 'q1',
  type: 'SINGLE_CHOICE' as const,
  skill: 'GRAMMAR' as const,
  cefrLevel: 'A2' as const,
  prompt: 'Complète : « Je ___ au marché hier. »',
  explanation: 'Passé composé of aller with être: « suis allé ».',
  maxPoints: null,
  options: [
    { id: 'o3', text: 'vais', order: 2, isCorrect: false },
    { id: 'o1', text: 'suis allé', order: 0, isCorrect: true },
    { id: 'o2', text: 'ai allé', order: 1, isCorrect: false },
  ],
};

describe('toStudentQuestion', () => {
  it('never exposes correctness or explanation, and sorts options by order', () => {
    const s = toStudentQuestion(rawQuestion);
    expect(s.options.map((o) => o.id)).toEqual(['o1', 'o2', 'o3']);
    const json = JSON.stringify(s);
    expect(json).not.toContain('isCorrect');
    expect(json).not.toContain('explanation');
    expect(json).not.toContain('Passé composé');
    // options carry only id + text
    expect(Object.keys(s.options[0]).sort()).toEqual(['id', 'text']);
  });
});

describe('toReviewQuestion', () => {
  it('includes the answer key, explanation and the student response (post-submit only)', () => {
    const r = toReviewQuestion(rawQuestion, {
      selectedOptionId: 'o2',
      textResponse: null,
      isCorrect: false,
      awardedPoints: 0,
      graderFeedback: null,
    });
    expect(r.options.find((o) => o.isCorrect)?.id).toBe('o1');
    expect(r.explanation).toContain('Passé composé');
    expect(r.yourOptionId).toBe('o2');
    expect(r.isCorrect).toBe(false);
  });

  it('tolerates a missing response', () => {
    const r = toReviewQuestion(rawQuestion, null);
    expect(r.yourOptionId).toBeNull();
    expect(r.yourText).toBeNull();
    expect(r.awardedPoints).toBeNull();
  });
});
