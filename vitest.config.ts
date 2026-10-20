import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

// Fake values only. Real values live in wrangler.jsonc vars.
const TEST_VARS = {
  ACCESS_ISSUER: 'https://example-team.cloudflareaccess.com',
  ACCESS_AUD: 'test-aud',
  OWNER_EMAIL: 'owner@example.test',
  DAILY_BEACON_CAP: '5',
  DAILY_BYTE_CAP: '30000000',
  RETENTION_DAYS: '730',
};

export default defineConfig(async () => {
  const migrations = await readD1Migrations('migrations');
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: { bindings: { ...TEST_VARS, TEST_MIGRATIONS: migrations } },
      }),
    ],
    test: { include: ['test/**/*.test.ts'], setupFiles: ['./test/apply-migrations.ts'] },
  };
});
