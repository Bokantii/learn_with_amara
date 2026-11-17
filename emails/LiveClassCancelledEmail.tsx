import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from '@react-email/components';

interface LiveClassCancelledEmailProps {
  studentName: string;
  classTitle: string;
  programName: string;
  groupName?: string | null;
  whenFormatted: string;
  reasonLabel: string;
  customMessage?: string | null;
}

export default function LiveClassCancelledEmail({
  studentName,
  classTitle,
  programName,
  groupName,
  whenFormatted,
  reasonLabel,
  customMessage,
}: LiveClassCancelledEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{classTitle} has been cancelled</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Hi {studentName}, a class was cancelled</Heading>
          <Text style={text}>
            <strong>{classTitle}</strong> — {programName}
            {groupName ? ` · ${groupName}` : ''}
          </Text>
          <Text style={{ ...text, color: '#dc2626' }}>
            <strong>CANCELLED</strong> — was scheduled for {whenFormatted}
          </Text>
          <Text style={text}>Reason: {reasonLabel}</Text>
          {customMessage && (
            <>
              <Hr style={hr} />
              <Section>
                <Text style={text}>{customMessage}</Text>
              </Section>
            </>
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
const hr = { borderColor: '#e2e8f0', margin: '20px 0' };
