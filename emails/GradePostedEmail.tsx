import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Button, Hr,
} from '@react-email/components';

interface GradePostedEmailProps {
  studentName: string;
  assignmentTitle: string;
  score: number;
  feedback?: string | null;
  appUrl: string;
}

export default function GradePostedEmail({
  studentName,
  assignmentTitle,
  score,
  feedback,
  appUrl,
}: GradePostedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your grade for {assignmentTitle} is in</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Hi {studentName}, your assignment has been graded</Heading>
          <Text style={text}>
            <strong>{assignmentTitle}</strong> — {score} points
          </Text>
          {feedback && (
            <>
              <Hr style={hr} />
              <Text style={text}>{feedback}</Text>
            </>
          )}
          <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
            <Button style={button} href={`${appUrl}/dashboard/assignments`}>
              View Your Assignments
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
const hr = { borderColor: '#e2e8f0', margin: '20px 0' };
const button = {
  backgroundColor: '#0ea5e9',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '15px',
  padding: '12px 24px',
  textDecoration: 'none',
};
