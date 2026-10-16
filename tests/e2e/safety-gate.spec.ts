import { test, expect } from '@playwright/test';
import { TEST_PROJECT_ID } from '../../vite.config';

const TEST_HOST = `https://${TEST_PROJECT_ID}.supabase.co`;
const PROD_HOST = 'https://xfscfjwapwnkiinkgbjg.supabase.co';
const PROD_APP_HOST = 'app.afpsulsel.org';

function assertTestRuntime(mode: string, runtimeMode: string, projectId: string, url: string) {
  expect(mode).toBe('test');
  expect(runtimeMode).toBe('test');
  expect(projectId).toBe(TEST_PROJECT_ID);
  expect(new URL(url).hostname).toBe(`${TEST_PROJECT_ID}.supabase.co`);
}

function isUnsafeRequest(url: string, method: string) {
  const parsed = new URL(url);
  const isUnexpectedSupabaseHost = parsed.hostname.endsWith('.supabase.co')
    && parsed.hostname !== `${TEST_PROJECT_ID}.supabase.co`;
  const isHonorDml = parsed.pathname.replace(/\/$/, '') === '/rest/v1/honors'
    && !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());

  return parsed.hostname === 'xfscfjwapwnkiinkgbjg.supabase.co'
    || parsed.hostname === PROD_APP_HOST
    || isUnexpectedSupabaseHost
    || isHonorDml;
}

test('TEST runtime is accepted', () => {
  assertTestRuntime('test', 'test', TEST_PROJECT_ID, TEST_HOST);
});

test('production project is rejected in test mode', () => {
  expect(() => assertTestRuntime('test', 'test', 'xfscfjwapwnkiinkgbjg', PROD_HOST)).toThrow();
});

test('unknown project is rejected in test mode', () => {
  expect(() => assertTestRuntime('test', 'test', 'unknown', 'https://unknown.supabase.co')).toThrow();
});

test('production URL is rejected in test mode', () => {
  expect(() => assertTestRuntime('test', 'test', TEST_PROJECT_ID, PROD_HOST)).toThrow();
});

test('browser requests stay on TEST services and use no direct honor DML', async ({ page }) => {
  const unsafeRequests: string[] = [];

  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = request.url();
    if (isUnsafeRequest(url, request.method())) {
      unsafeRequests.push(`${request.method()} ${new URL(url).hostname}${new URL(url).pathname}`);
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });

  await page.goto('http://127.0.0.1:4173');

  expect(unsafeRequests).toEqual([]);
});

test('request classifier rejects forbidden hosts and direct honor writes', () => {
  expect(isUnsafeRequest(PROD_HOST, 'GET')).toBe(true);
  expect(isUnsafeRequest(`https://${PROD_APP_HOST}/`, 'GET')).toBe(true);
  expect(isUnsafeRequest('https://unknown.supabase.co/rest/v1/events', 'GET')).toBe(true);
  expect(isUnsafeRequest(`${TEST_HOST}/rest/v1/honors`, 'PATCH')).toBe(true);
  expect(isUnsafeRequest(`${TEST_HOST}/rest/v1/honors`, 'GET')).toBe(false);
  expect(isUnsafeRequest(`${TEST_HOST}/rest/v1/rpc/create_honor_draft`, 'POST')).toBe(false);
});
