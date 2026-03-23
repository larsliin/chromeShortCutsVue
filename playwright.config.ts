import { defineConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    testDir: './e2e',
    // Run each test file sequentially (extension tests share Chrome storage state)
    fullyParallel: false,
    // Prevent accidentally-committed .only tests from blocking CI
    forbidOnly: !!process.env.CI,
    // Retry once on CI to handle flaky startup timing
    retries: process.env.CI ? 1 : 0,
    // One worker: extension tests share a single Chrome context
    workers: 1,
    // 60 s per test: the first test pays the cold-start cost (~12 s); the rest
    // are fast because context + storage are worker-scoped.
    timeout: 60_000,
    use: {
        // Extensions require a non-headless Chromium instance.
        // On Linux CI use: xvfb-run npx playwright test
        headless: false,
        trace: 'on-first-retry',
        screenshot: 'off',
        video: 'off',
    },
    // Build the extension before any E2E test runs
    globalSetup: path.join(__dirname, 'e2e', 'global-setup.ts'),
    reporter: [['./e2e/table-reporter.ts']],
});