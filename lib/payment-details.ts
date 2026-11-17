// Official payment destinations shown publicly while enrollment is arranged over
// WhatsApp, so students can check that the details admissions sends them in
// chat match what ICLP publishes — the main defence against impersonators.
//
// Fill these in with the real details. An entry with ANY blank field is not
// rendered, so the site never shows a placeholder or partial account.

export interface PaymentDetailLine {
  label: string;
  value: string;
}

export interface PaymentDestination {
  id: string;
  method: string;
  region: string;
  /** The name the student will see when paying (recipient / account / merchant name). */
  accountName: string;
  details: PaymentDetailLine[];
}

export const PAYMENT_DESTINATIONS: PaymentDestination[] = [
  {
    id: 'interac',
    method: 'Interac e-Transfer',
    region: 'Canada (CAD)',
    accountName: 'Daniel Bokantero',
    details: [{ label: 'e-Transfer email', value: 'dbokantero@gmail.com' }],
  },
  {
    id: 'ngn-bank-transfer',
    method: 'Bank transfer',
    region: 'Nigeria (NGN)',
    accountName: 'INTERNATIONAL CENTER FOR LANGUAGE PROFICIENCY LIMITED',
    details: [
      { label: 'Bank', value: 'Signature Bank' },
      { label: 'Account number', value: '2000469732' },
    ],
  },
  {
    id: 'ngn-bank-transfer-private',
    method: 'Bank transfer — private learners',
    region: 'Nigeria (NGN)',
    accountName: 'LEARN WITH AMARA',
    details: [
      { label: 'Bank', value: 'Union Bank' },
      { label: 'Account number', value: '0228514418' },
    ],
  },
  {
    id: 'payment-link',
    method: 'Secure payment link',
    region: 'All currencies',
    accountName: '',
    details: [{ label: 'Provider', value: '' }],
  },
];

export function isCompleteDestination(destination: PaymentDestination): boolean {
  return (
    destination.accountName.trim() !== '' &&
    destination.details.length > 0 &&
    destination.details.every((d) => d.label.trim() !== '' && d.value.trim() !== '')
  );
}

export function getOfficialPaymentDestinations(
  destinations: PaymentDestination[] = PAYMENT_DESTINATIONS
): PaymentDestination[] {
  return destinations.filter(isCompleteDestination);
}
