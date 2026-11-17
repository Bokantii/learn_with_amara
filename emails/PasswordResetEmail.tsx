import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import { main, container, heading, text, muted, footer, button } from './_styles';

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
}

export default function PasswordResetEmail({ name, resetUrl }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your ICLP password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Hi {name}, reset your password</Heading>
          <Text style={text}>
            We received a request to reset the password for your ICLP account. Use the button below to
            choose a new one.
          </Text>
          <Button style={button} href={resetUrl}>
            Reset my password
          </Button>
          <Text style={muted}>
            This link can be used once and expires in 1 hour. If you did not request a reset, you can
            safely ignore this email — your password is unchanged.
          </Text>
          <Text style={footer}>— The ICLP Team</Text>
        </Container>
      </Body>
    </Html>
  );
}
