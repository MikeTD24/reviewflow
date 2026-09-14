import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'review-flow.spec.ts',
  outputDir: 'test-results/demo-video',
  workers: 1,
  timeout: 60_000,
  reporter: 'list',
  use: {
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 900 },
    video: 'on',
    // Le ralenti rend les etapes lisibles sans modifier le scenario teste.
    launchOptions: { slowMo: 250 },
  },
  webServer: [
    {
      command: 'npm run start --workspace api',
      url: 'http://127.0.0.1:3000/api/health',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'npm run demo',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'node scripts/serve-extension.mjs',
      url: 'http://127.0.0.1:4174/popup/popup.html',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
