import { describe, it, expect } from 'vitest';
import { sentryOptions } from './sentry-options';

describe('sentryOptions', () => {
  it('samples 10% of traces in production', () => {
    expect(sentryOptions('production')).toEqual({ environment: 'production', tracesSampleRate: 0.1 });
  });
  it('tags preview and traces everything there', () => {
    expect(sentryOptions('preview')).toEqual({ environment: 'preview', tracesSampleRate: 1.0 });
  });
  it('falls back to development when unset', () => {
    expect(sentryOptions(undefined).environment).toBe('development');
    expect(sentryOptions('').environment).toBe('development');
  });
});
