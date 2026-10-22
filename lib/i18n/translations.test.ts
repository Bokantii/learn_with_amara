import { describe, expect, it } from 'vitest';
import { translations, type Language } from './translations';

const LANGUAGES: Language[] = ['EN', 'FR'];
const FABRICATED_NAMES = ['Sarah Johnson', 'Michael Chen', 'Emma Rodriguez'];

describe('homepage "Why Students Choose ICLP" copy', () => {
  it.each(LANGUAGES)('%s has a heading, subheading and exactly four non-empty benefits', (lang) => {
    const { heading, subheading, benefits } = translations[lang].whyChoose;
    expect(heading.trim()).not.toBe('');
    expect(subheading.trim()).not.toBe('');
    expect(benefits).toHaveLength(4);
    for (const benefit of benefits) {
      expect(benefit.title.trim()).not.toBe('');
      expect(benefit.description.trim()).not.toBe('');
    }
  });

  it('is localized rather than falling back to English', () => {
    expect(translations.EN.whyChoose.heading).toBe('Why Students Choose ICLP');
    expect(translations.FR.whyChoose.heading).toBe('Pourquoi choisir ICLP ?');
    translations.FR.whyChoose.benefits.forEach((benefit, i) => {
      expect(benefit.title).not.toBe(translations.EN.whyChoose.benefits[i].title);
    });
  });

  it('testimonials subheading is truthful, non-numeric copy', () => {
    expect(translations.EN.testimonials.subheading).toBe('Start your language-learning journey with ICLP.');
    expect(translations.FR.testimonials.subheading).toBe('Commencez votre apprentissage des langues avec ICLP.');
  });

  it.each(LANGUAGES)('%s makes no unverified "thousands of learners" claim', (lang) => {
    expect(JSON.stringify(translations[lang])).not.toMatch(/thousands|milliers/i);
  });

  it.each(LANGUAGES)('%s no longer carries fabricated testimonials', (lang) => {
    expect(translations[lang].testimonials).not.toHaveProperty('quotes');
    expect(translations[lang].testimonials).not.toHaveProperty('heading');
    const serialized = JSON.stringify(translations[lang]);
    for (const name of FABRICATED_NAMES) {
      expect(serialized).not.toContain(name);
    }
  });
});
