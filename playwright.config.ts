import { defineConfig, devices } from '@playwright/test';
import { TEST_PROJECT_ID } from './vite.config';

const mode = process.env.MODE ?? 'test';
const runtimeMode = process.env.VITE_RUNTIME_MODE ?? 'test';
const projectId = process.env.VITE_SUPABASE_PROJECT_ID ?? 'unknown';
const supabaseUrl = process.env.VITE_SUPABASE_URL ?? 'unknown';
const projectRef = (() => {
  try {
    const hostname = new URL(supabaseUrl).hostname;
    return hostname.endsWith('.supabase.co') ? hostname.slice(0, -'.supabase.co'.length) : null;
  } catch {
    return null;
  }
})();

if (mode !== 'test' || runtimeMode !== 'test' || projectId !== TEST_PROJECT_ID || projectRef !== TEST_PROJECT_ID) {
  throw new Error(
    `E2E blocked: expected MODE=test, VITE_RUNTIME_MODE=test, and project ${TEST_PROJECT_ID}; got MODE=${mode}, VITE_RUNTIME_MODE=${runtimeMode}, PROJECT_ID=${projectId}, URL=${supabaseUrl}`,
  );
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome', headless: true },
    },
  ],
  webServer: {
    command: 'npm run dev:test -- --host 127.0.0.1 --strictPort --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: process.env.E2E_REUSE_TEST_SERVER === '1',
    timeout: 120000,
    env: {
      MODE: 'test',
      VITE_RUNTIME_MODE: 'test',
      VITE_SUPABASE_PROJECT_ID: TEST_PROJECT_ID,
      VITE_SUPABASE_URL: `https://${TEST_PROJECT_ID}.supabase.co`,
    },
  },
});
