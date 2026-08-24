import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Button,
} from '@react-email/components';

interface WelcomeEmailProps {
  name: string;
  appUrl: string;
}

export default function WelcomeEmail({ name, appUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to ICLP — let's get started on your French journey</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Welcome, {name}!</Heading>
          <Text style={text}>
            Your ICLP account is ready. Whether you're starting French from scratch or
            fast-tracking your TCF/TEF/DELF/DALF exam prep, we're glad to have you.
          </Text>
          <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
            <Button style={button} href={`${appUrl}/dashboard`}>
              Go to Your Dashboard
            </Button>
          </Section>
          <Text style={footer}>— The ICLP Team</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: '#f8fafc', fontFamily: 'Helvetica, Arial, sans-serif' };
const container = { margin: '0 auto', padding: '32px 24px', maxWidth: '480px' };
const heading = { fontSize: '24px', color: '#0f172a' };
const text = { fontSize: '15px', lineHeight: '24px', color: '#334155' };
const footer = { fontSize: '13px', color: '#94a3b8', marginTop: '32px' };
const button = {
  backgroundColor: '#0ea5e9',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '15px',
  padding: '12px 24px',
  textDecoration: 'none',
};
