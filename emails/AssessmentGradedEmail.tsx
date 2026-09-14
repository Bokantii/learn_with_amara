import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import { main, container, heading, text, footer, button } from './_styles';

interface AssessmentGradedEmailProps {
  studentName: string;
  assessmentTitle: string;
  appUrl: string;
}

export default function AssessmentGradedEmail({
  studentName,
  assessmentTitle,
  appUrl,
}: AssessmentGradedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your result for {assessmentTitle} is ready</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Hi {studentName}, your result is ready</Heading>
          <Text style={text}>
            An instructor has finished reviewing <strong>{assessmentTitle}</strong> — your full
            result is now available.
          </Text>
          <Button style={button} href={`${appUrl}/assessments/history`}>
            View result
          </Button>
          <Text style={footer}>— The ICLP Team</Text>
        </Container>
      </Body>
    </Html>
  );
}
