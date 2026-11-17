import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Row, Column, Hr,
} from '@react-email/components';
import { button } from './_styles';

interface PaymentReceiptEmailProps {
  name: string;
  amountFormatted: string;
  date: string;
  receiptId: string;
  /** Manual payments: how it was paid, e.g. "Interac e-Transfer". */
  method?: string | null;
  /** Manual payments: the bank / transfer reference the student can match. */
  reference?: string | null;
  programName?: string | null;
  /** When set, links the student to their billing history. */
  appUrl?: string;
}

export default function PaymentReceiptEmail({
  name,
  amountFormatted,
  date,
  receiptId,
  method,
  reference,
  programName,
  appUrl,
}: PaymentReceiptEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your ICLP payment receipt — {amountFormatted}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Thanks, {name}!</Heading>
          <Text style={text}>We&apos;ve received your payment. Here&apos;s your receipt:</Text>
          <Section style={receiptBox}>
            <Row>
              <Column style={label}>Amount</Column>
              <Column style={value}>{amountFormatted}</Column>
            </Row>
            {programName && (
              <>
                <Hr style={hr} />
                <Row>
                  <Column style={label}>Programme</Column>
                  <Column style={value}>{programName}</Column>
                </Row>
              </>
            )}
            {method && (
              <>
                <Hr style={hr} />
                <Row>
                  <Column style={label}>Method</Column>
                  <Column style={value}>{method}</Column>
                </Row>
              </>
            )}
            {reference && (
              <>
                <Hr style={hr} />
                <Row>
                  <Column style={label}>Reference</Column>
                  <Column style={value}>{reference}</Column>
                </Row>
              </>
            )}
            <Hr style={hr} />
            <Row>
              <Column style={label}>Date</Column>
              <Column style={value}>{date}</Column>
            </Row>
            <Hr style={hr} />
            <Row>
              <Column style={label}>Receipt ID</Column>
              <Column style={value}>{receiptId}</Column>
            </Row>
          </Section>
          {appUrl && (
            <Button style={button} href={`${appUrl}/dashboard/billing`}>
              View billing history
            </Button>
          )}
          <Text style={footer}>— The ICLP Team</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: '#f8fafc', fontFamily: 'Helvetica, Arial, sans-serif' };
const container = { margin: '0 auto', padding: '32px 24px', maxWidth: '480px' };
const heading = { fontSize: '22px', color: '#0f172a' };
const text = { fontSize: '15px', lineHeight: '24px', color: '#334155' };
const footer = { fontSize: '13px', color: '#94a3b8', marginTop: '32px' };
const hr = { borderColor: '#e2e8f0', margin: '8px 0' };
const receiptBox = {
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '20px 0',
};
const label = { fontSize: '14px', color: '#64748b' };
const value = { fontSize: '14px', color: '#0f172a', textAlign: 'right' as const };
