import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import { main, container, heading, text, muted, footer, button } from './_styles';

interface StudentInviteEmailProps {
  name: string;
  inviteUrl: string;
}

export default function StudentInviteEmail({ name, inviteUrl }: StudentInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Set your password to activate your ICLP account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Welcome to ICLP, {name}</Heading>
          <Text style={text}>
            An administrator has created a student account for you. Choose a password to activate it
            and sign in.
          </Text>
          <Button style={button} href={inviteUrl}>
            Activate my account
          </Button>
          <Text style={muted}>
            This link can be used once and expires in 7 days. If it has expired, ask your
            administrator to send a new invite.
          </Text>
          <Text style={footer}>— The ICLP Team</Text>
        </Container>
      </Body>
    </Html>
  );
}
