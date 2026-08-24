// Centralized tuition data for the /Pricing page's programme catalogue.
// Fixed official prices per currency — never derive one currency from
// another via a live exchange rate (see business rules in the Pricing spec).

export type Currency = 'CAD' | 'NGN' | 'USD' | 'GBP';

export const CURRENCIES: Currency[] = ['CAD', 'NGN', 'USD', 'GBP'];

export type ProgrammeCategory = 'group-french' | 'group-tef-tcf' | 'private';

export interface ProgrammeCategoryMeta {
  id: ProgrammeCategory;
  label: string;
  description: string;
}

export const PROGRAMME_CATEGORIES: ProgrammeCategoryMeta[] = [
  {
    id: 'group-french',
    label: 'Group French',
    description: 'Cohort-based French classes that take you from A0 through B2.',
  },
  {
    id: 'group-tef-tcf',
    label: 'TEF/TCF Preparation',
    description: 'Focused group prep for the TEF and TCF Canada exams.',
  },
  {
    id: 'private',
    label: 'Private Classes',
    description: 'One-on-one instruction, scheduled around you.',
  },
];

type ProgrammePrices = Record<Currency, number>;

interface AlternativePayment {
  currency: Currency;
  amount: number;
  label: string;
}

export interface Programme {
  id: string;
  name: string;
  category: ProgrammeCategory;
  duration: string;
  isMinimumDuration: boolean;
  frequency: string;
  frequencyCount: number;
  sessionLength?: string;
  billingPeriod: 'once' | 'month';
  prices: ProgrammePrices;
  currencyNotes?: Partial<Record<Currency, string>>;
  alternativePayment?: AlternativePayment;
}

export const PROGRAMMES: Programme[] = [
  {
    id: 'group-french-a0-a2',
    name: 'A0–A2 Foundation French',
    category: 'group-french',
    duration: '3 Months',
    isMinimumDuration: false,
    frequency: '3× Weekly',
    frequencyCount: 3,
    sessionLength: '1 hr 30 mins',
    billingPeriod: 'once',
    prices: { CAD: 350, NGN: 350000, USD: 255, GBP: 189 },
    currencyNotes: { NGN: 'Paid Once' },
  },
  {
    id: 'group-french-a2-b2',
    name: 'A2–B2 Intermediate French',
    category: 'group-french',
    duration: '3 Months',
    isMinimumDuration: false,
    frequency: '3× Weekly',
    frequencyCount: 3,
    sessionLength: '1 hr 30 mins',
    billingPeriod: 'once',
    prices: { CAD: 360, NGN: 360000, USD: 263, GBP: 194 },
    alternativePayment: { currency: 'NGN', amount: 120000, label: 'Monthly' },
  },
  {
    id: 'group-tef-tcf-canada-prep',
    name: 'Group TEF/TCF Canada Preparation',
    category: 'group-tef-tcf',
    duration: '2 Months',
    isMinimumDuration: true,
    frequency: '3× Weekly',
    frequencyCount: 3,
    sessionLength: '1 hr 30 mins',
    billingPeriod: 'month',
    prices: { CAD: 120, NGN: 120000, USD: 80, GBP: 59 },
  },
  {
    id: 'private-french-enthusiast-premier',
    name: 'French Enthusiast Premier',
    category: 'private',
    duration: '1 Month',
    isMinimumDuration: true,
    frequency: '1 time a week',
    frequencyCount: 1,
    billingPeriod: 'month',
    prices: { CAD: 60, NGN: 60000, USD: 44, GBP: 32 },
  },
  {
    id: 'private-french-enthusiast-plus',
    name: 'French Enthusiast Plus',
    category: 'private',
    duration: '1 Month',
    isMinimumDuration: true,
    frequency: '2 times a week',
    frequencyCount: 2,
    billingPeriod: 'month',
    prices: { CAD: 120, NGN: 120000, USD: 88, GBP: 65 },
  },
  {
    id: 'private-no-pain-no-gain-intensive',
    name: 'No Pain No Gain Intensive',
    category: 'private',
    duration: '1 Month',
    isMinimumDuration: true,
    frequency: '3 times a week',
    frequencyCount: 3,
    billingPeriod: 'month',
    prices: { CAD: 180, NGN: 180000, USD: 131, GBP: 97 },
  },
  {
    id: 'private-no-pain-no-gain-elite',
    name: 'No Pain No Gain Elite',
    category: 'private',
    duration: '1 Month',
    isMinimumDuration: true,
    frequency: '4 times a week',
    frequencyCount: 4,
    billingPeriod: 'month',
    prices: { CAD: 240, NGN: 240000, USD: 175, GBP: 130 },
  },
  {
    id: 'private-focus-max-executive',
    name: 'Focus Max Executive',
    category: 'private',
    duration: '1 Month',
    isMinimumDuration: true,
    frequency: '5 times a week',
    frequencyCount: 5,
    billingPeriod: 'month',
    prices: { CAD: 300, NGN: 300000, USD: 219, GBP: 162 },
  },
];

export const GROUP_PROGRAMME_INCLUDES = [
  'Live instructor-led classes',
  'Structured lesson plans',
  'Weekly assessments and progress reviews',
  'Mock examinations',
  'Speaking, Listening, Reading and Writing practice',
  'Grammar and vocabulary development',
  'Proven TEF/TCF examination strategies',
];

export const PRIVATE_PROGRAMME_INCLUDES = [
  'One-on-one live sessions with an instructor',
  'Flexible scheduling based on learner availability and time zone',
  'Personalized learning materials and structured lesson plans',
  'Weekly progress reviews and guided practice sessions',
  'Conversation-based learning support',
  'Vocabulary and grammar support tailored to learner level',
];

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  CAD: '$',
  NGN: '₦',
  USD: '$',
  GBP: '£',
};

// Only currencies that share the "$" glyph need a disambiguating suffix.
const CURRENCY_SUFFIX: Partial<Record<Currency, string>> = {
  CAD: 'CAD',
  USD: 'USD',
};

export function formatPrice(currency: Currency, amount: number): string {
  const formatted = amount.toLocaleString('en-US');
  const suffix = CURRENCY_SUFFIX[currency];
  return `${CURRENCY_SYMBOLS[currency]}${formatted}${suffix ? ` ${suffix}` : ''}`;
}

export function findProgrammeById(id: string): Programme | undefined {
  return PROGRAMMES.find((p) => p.id === id);
}

export function getProgrammesByCategory(category: ProgrammeCategory): Programme[] {
  return PROGRAMMES.filter((p) => p.category === category);
}
