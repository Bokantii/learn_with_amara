import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from '@react-email/components';
import { main, container, heading, text, muted, footer, hr, button } from './_styles';

interface AnnouncementEmailProps {
  studentName: string;
  announcementTitle: string;
  body: string;
  scopeLabel: string;
  appUrl: string;
}

export default function AnnouncementEmail({
  studentName,
  announcementTitle,
  body,
  scopeLabel,
  appUrl,
}: AnnouncementEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{announcementTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{announcementTitle}</Heading>
          <Text style={muted}>Hi {studentName} — {scopeLabel}</Text>
          <Hr style={hr} />
          <Section>
            <Text style={{ ...text, whiteSpace: 'pre-line' }}>{body}</Text>
          </Section>
          {appUrl && (
            <Button style={button} href={`${appUrl}/dashboard/announcements`}>
              Open announcements
            </Button>
          )}
          <Text style={footer}>— The ICLP Team</Text>
        </Container>
      </Body>
    </Html>
  );
}
