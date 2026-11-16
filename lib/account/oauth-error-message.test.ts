import { describe, it, expect } from 'vitest';
import { oauthErrorMessage } from './oauth-error-message';

describe('oauthErrorMessage', () => {
  it('returns null without an error', () => {
    expect(oauthErrorMessage(null)).toBeNull();
    expect(oauthErrorMessage('')).toBeNull();
  });

  it('tells an existing password user to sign in with their password', () => {
    expect(oauthErrorMessage('OAuthAccountNotLinked')).toMatch(/already has an ICLP account.*email and password/);
  });

  it('explains a refused Google sign-in', () => {
    expect(oauthErrorMessage('AccessDenied')).toMatch(/verified email/);
  });

  it('falls back to a generic message for other errors', () => {
    expect(oauthErrorMessage('Configuration')).toBe('Unable to sign in with that provider. Please try again.');
  });
});
