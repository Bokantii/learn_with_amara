import { describe, it, expect } from 'vitest';
import {
  getOfficialPaymentDestinations,
  isCompleteDestination,
  type PaymentDestination,
} from './payment-details';

const complete: PaymentDestination = {
  id: 'interac',
  method: 'Interac e-Transfer',
  region: 'Canada (CAD)',
  accountName: 'Example Name',
  details: [{ label: 'e-Transfer email', value: 'pay@example.com' }],
};

describe('isCompleteDestination', () => {
  it('accepts an entry with a name and every detail filled', () => {
    expect(isCompleteDestination(complete)).toBe(true);
  });

  it('rejects a blank account name', () => {
    expect(isCompleteDestination({ ...complete, accountName: '  ' })).toBe(false);
  });

  it('rejects any blank detail value', () => {
    expect(
      isCompleteDestination({
        ...complete,
        details: [...complete.details, { label: 'Account number', value: '' }],
      })
    ).toBe(false);
  });

  it('rejects an entry with no detail lines', () => {
    expect(isCompleteDestination({ ...complete, details: [] })).toBe(false);
  });
});

describe('getOfficialPaymentDestinations', () => {
  it('keeps only complete entries, in order', () => {
    const partial = { ...complete, id: 'bank', accountName: '' };
    expect(getOfficialPaymentDestinations([partial, complete]).map((d) => d.id)).toEqual([
      'interac',
    ]);
  });

  it('publishes nothing until real details are filled in', () => {
    expect(getOfficialPaymentDestinations()).toEqual([]);
  });
});
