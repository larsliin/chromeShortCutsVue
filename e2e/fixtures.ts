import {
    test as base,
    chromium,
    expect,
    type BrowserContext,
    type Page,
} from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const pathToExtension = path.join(__dirname, '..', 'dist');

// ---------------------------------------------------------------------------
// Custom fixture types
// Worker-scoped: extensionContext + extensionId are shared across all tests in
// a worker (one cold-start per suite run instead of one per test).
// Test-scoped: extensionPage is recreated fresh for every test.
// ---------------------------------------------------------------------------

interface WorkerFixtures {
    /** Persistent Chromium context with the extension loaded. */
    extensionContext: BrowserContext;
    /** The unpacked extension's Chrome ID (resolved from the service worker URL). */
    extensionId: string;
}

interface TestFixtures {
    /** A Page already navigated to the extension's new-tab page (index.html). */
    extensionPage: Page;
}

// ---------------------------------------------------------------------------
// Base extension fixture
// ---------------------------------------------------------------------------

export const test = base.extend<TestFixtures, WorkerFixtures>({
    // Worker-scoped: one Chrome instance for the whole test suite.
    extensionContext: [async ({}, use) => {
        const ctx = await chromium.launchPersistentContext('', {
            headless: false,
            args: [
                // Prevent Chrome from showing the "restore pages?" dialog
                '--no-first-run',
                '--no-default-browser-check',
                // Speed up startup by disabling unnecessary background services
                '--disable-background-networking',
                '--disable-sync',
                `--disable-extensions-except=${pathToExtension}`,
                `--load-extension=${pathToExtension}`,
            ],
        });
        await use(ctx);
        await ctx.close();
    }, { scope: 'worker' }],

    // Worker-scoped: extension ID is stable for the lifetime of the context.
    extensionId: [async ({ extensionContext }, use) => {
        // The background service worker URL is chrome-extension://<ID>/background.js
        // Wait for it to register if it hasn't yet.
        let [worker] = extensionContext.serviceWorkers();
        if (!worker) {
            worker = await extensionContext.waitForEvent('serviceworker');
        }

        const extensionId = worker.url().split('/')[2];
        await use(extensionId);
    }, { scope: 'worker' }],

    // Test-scoped: each test gets a fresh page so dialogs / state don't bleed.
    extensionPage: async ({ extensionContext, extensionId }, use) => {
        const page = await extensionContext.newPage();
        await page.goto(`chrome-extension://${extensionId}/index.html`);
        await use(page);
        await page.close();
    },
});

export { expect };

// ---------------------------------------------------------------------------
// Helper: inject a Chrome bookmark folder + child bookmark via page.evaluate.
// The new-tab page runs inside the extension context, so it has full access
// to chrome.bookmarks.
// ---------------------------------------------------------------------------

export async function createBookmarkFolder(
    page: Page,
    parentId: string,
    title: string,
): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return page.evaluate(
        ({ pId, t }) => new Promise<chrome.bookmarks.BookmarkTreeNode>((resolve, reject) => {
            chrome.bookmarks.create({ parentId: pId, title: t }, (node) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(node);
                }
            });
        }),
        { pId: parentId, t: title },
    );
}

export async function createBookmark(
    page: Page,
    parentId: string,
    title: string,
    url: string,
): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return page.evaluate(
        ({ pId, t, u }) => new Promise<chrome.bookmarks.BookmarkTreeNode>((resolve, reject) => {
            chrome.bookmarks.create({ parentId: pId, title: t, url: u }, (node) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(node);
                }
            });
        }),
        { pId: parentId, t: title, u: url },
    );
}

/** Get the root "My Shortcuts Tab" folder ID from chrome.storage.local. */
export async function getRootId(page: Page): Promise<string | null> {
    return page.evaluate(
        () => new Promise<string | null>((resolve) => {
            chrome.storage.local.get('root', (result) => {
                resolve((result.root as string) ?? null);
            });
        }),
    );
}
