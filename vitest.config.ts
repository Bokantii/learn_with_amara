import { defineConfig } from 'vitest/config';

// Unit tests for pure domain logic that Playwright can only exercise
// indirectly (notification de-duplication, retry eligibility, recipient
// entitlement). Prisma / Resend are mocked per-test — these never touch a
// database or the network. Playwright (`e2e/`) remains the integration layer.
export default defineConfig({
  test: {
    include: ['lib/**/*.test.ts'],
    environment: 'node',
  },
});
