import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import { main, container, heading, text, muted, footer, button } from './_styles';

interface StaffInviteEmailProps {
  name: string;
  roleLabel: string;
  inviteUrl: string;
}

export default function StaffInviteEmail({ name, roleLabel, inviteUrl }: StaffInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Set your password to activate your ICLP {roleLabel} account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Hi {name}, you have been added to ICLP</Heading>
          <Text style={text}>
            An administrator has created an ICLP <strong>{roleLabel}</strong> account for you. Choose a
            password to activate it and sign in.
          </Text>
          <Button style={button} href={inviteUrl}>
            Activate my account
          </Button>
          <Text style={muted}>
            This link can be used once and expires in 7 days. If it has expired, ask another
            administrator to send a new invite.
          </Text>
          <Text style={footer}>— The ICLP Team</Text>
        </Container>
      </Body>
    </Html>
  );
}
