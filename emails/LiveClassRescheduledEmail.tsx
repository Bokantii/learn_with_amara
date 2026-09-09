import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Button,
} from '@react-email/components';

interface LiveClassRescheduledEmailProps {
  studentName: string;
  classTitle: string;
  programName: string;
  groupName?: string | null;
  newWhenFormatted: string;
  meetingUrl: string;
}

export default function LiveClassRescheduledEmail({
  studentName,
  classTitle,
  programName,
  groupName,
  newWhenFormatted,
  meetingUrl,
}: LiveClassRescheduledEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{classTitle} has a new date/time</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Hi {studentName}, a class was rescheduled</Heading>
          <Text style={text}>
            <strong>{classTitle}</strong> — {programName}
            {groupName ? ` · ${groupName}` : ''}
          </Text>
          <Text style={text}>
            This class&apos;s schedule has changed. The new date/time is:
            <br />
            <strong>{newWhenFormatted}</strong>
          </Text>
          <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
            <Button style={button} href={meetingUrl}>
              Join Class
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
const heading = { fontSize: '22px', color: '#0f172a' };
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
