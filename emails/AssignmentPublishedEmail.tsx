import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import { main, container, heading, text, muted, footer, button } from './_styles';

interface AssignmentPublishedEmailProps {
  studentName: string;
  assignmentTitle: string;
  programName: string;
  groupName?: string | null;
  dueDateFormatted: string;
  points: number;
  appUrl: string;
}

export default function AssignmentPublishedEmail({
  studentName,
  assignmentTitle,
  programName,
  groupName,
  dueDateFormatted,
  points,
  appUrl,
}: AssignmentPublishedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New assignment: {assignmentTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Hi {studentName}, a new assignment was posted</Heading>
          <Text style={text}>
            <strong>{assignmentTitle}</strong> — {programName}
            {groupName ? ` · ${groupName}` : ''}
          </Text>
          <Text style={muted}>
            Due {dueDateFormatted} · {points} points
          </Text>
          <Button style={button} href={`${appUrl}/dashboard/assignments`}>
            View assignment
          </Button>
          <Text style={footer}>— The ICLP Team</Text>
        </Container>
      </Body>
    </Html>
  );
}
