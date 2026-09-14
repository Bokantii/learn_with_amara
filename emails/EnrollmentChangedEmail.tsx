import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import { main, container, heading, text, footer, button } from './_styles';

interface EnrollmentChangedEmailProps {
  studentName: string;
  programName: string;
  statusLabel: string;
  appUrl: string;
}

export default function EnrollmentChangedEmail({
  studentName,
  programName,
  statusLabel,
  appUrl,
}: EnrollmentChangedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your enrollment in {programName} is now {statusLabel}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Hi {studentName}, an enrollment was updated</Heading>
          <Text style={text}>
            Your enrollment in <strong>{programName}</strong> is now <strong>{statusLabel}</strong>.
          </Text>
          <Button style={button} href={`${appUrl}/dashboard/myprograms`}>
            View my programs
          </Button>
          <Text style={footer}>— The ICLP Team</Text>
        </Container>
      </Body>
    </Html>
  );
}
