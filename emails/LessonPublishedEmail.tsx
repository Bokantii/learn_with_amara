import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import { main, container, heading, text, muted, footer, button } from './_styles';

interface LessonPublishedEmailProps {
  studentName: string;
  lessonTitle: string;
  moduleName: string;
  programName: string;
  appUrl: string;
}

export default function LessonPublishedEmail({
  studentName,
  lessonTitle,
  moduleName,
  programName,
  appUrl,
}: LessonPublishedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New lesson: {lessonTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Hi {studentName}, a new lesson is available</Heading>
          <Text style={text}>
            <strong>{lessonTitle}</strong>
          </Text>
          <Text style={muted}>
            {programName} · {moduleName}
          </Text>
          <Button style={button} href={`${appUrl}/dashboard/recordedlessons`}>
            Go to lessons
          </Button>
          <Text style={footer}>— The ICLP Team</Text>
        </Container>
      </Body>
    </Html>
  );
}
