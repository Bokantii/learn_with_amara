import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Row, Column, Hr,
} from '@react-email/components';

interface PaymentReceiptEmailProps {
  name: string;
  amountFormatted: string;
  date: string;
  receiptId: string;
}

export default function PaymentReceiptEmail({
  name,
  amountFormatted,
  date,
  receiptId,
}: PaymentReceiptEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your ICLP payment receipt — {amountFormatted}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Thanks, {name}!</Heading>
          <Text style={text}>Your payment was successful. Here's your receipt:</Text>
          <Section style={receiptBox}>
            <Row>
              <Column style={label}>Amount</Column>
              <Column style={value}>{amountFormatted}</Column>
            </Row>
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
