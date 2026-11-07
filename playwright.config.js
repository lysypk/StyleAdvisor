import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  reporter: [['html', { open: 'never' }]],
  timeout: 300000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 800 }
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    env: { VITE_AI_MODEL: 'tev1:4b' },
    reuseExistingServer: true,
    timeout: 120000
  }
});
