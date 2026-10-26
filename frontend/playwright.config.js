import { defineConfig } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5211'

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: { baseURL, headless: true },
  webServer: {
    command: 'bash e2e/serve.sh',
    url: `${baseURL}/admin/login`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
