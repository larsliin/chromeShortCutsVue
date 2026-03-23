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
// Helper: inject a Chrome bookmark folder via page.evaluate.
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

// ---------------------------------------------------------------------------
// Helper: inject a Chrome bookmark via page.evaluate.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helper: recursively remove a bookmark node (folder or leaf) by ID.
// ---------------------------------------------------------------------------

export async function removeBookmarkNode(page: Page, id: string): Promise<void> {
    return page.evaluate(
        (nodeId) => new Promise<void>((resolve, reject) => {
            chrome.bookmarks.removeTree(nodeId, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        }),
        id,
    );
}

// ---------------------------------------------------------------------------
// Helper: search for bookmark nodes by title and remove all matches.
// Used to clean up bookmarks created through the UI (where we don't have IDs).
// ---------------------------------------------------------------------------

export async function cleanupBookmarksByTitle(page: Page, title: string): Promise<void> {
    return page.evaluate(
        (t) => new Promise<void>((resolve) => {
            chrome.bookmarks.search({ title: t }, (results) => {
                if (chrome.runtime.lastError || !results.length) {
                    resolve();
                    return;
                }
                let pending = results.length;
                results.forEach((node) => {
                    chrome.bookmarks.removeTree(node.id, () => {
                        pending -= 1;
                        if (pending === 0) resolve();
                    });
                });
            });
        }),
        title,
    );
}

// ---------------------------------------------------------------------------
// Helper: get the root "My Shortcuts Tab" folder ID from chrome.storage.local.
// ---------------------------------------------------------------------------

/** Get the root "My Shortcuts Tab" folder ID from chrome.storage.local. */
export async function getRootId(page: Page): Promise<string | null> {
    return page.evaluate(
        () => new Promise<string | null>((resolve, reject) => {
            chrome.storage.local.get('root', (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                resolve((result.root as string) ?? null);
            });
        }),
    );
}

// ---------------------------------------------------------------------------
// Helper: switch app to slider mode by seeding sync storage.
// When `accordionNavigation` is truthy in storage, init() computes
// bookmarksStore.accordionNavigation = !truthy = false → slider rendered.
// ---------------------------------------------------------------------------

export async function enableSliderMode(page: Page): Promise<void> {
    return page.evaluate(
        () => new Promise<void>((resolve) => {
            chrome.storage.sync.set({ accordionNavigation: true }, resolve);
        }),
    );
}

// ---------------------------------------------------------------------------
// Helper: restore default accordion mode by removing the sync storage key.
// init() then gets undefined → bookmarksStore.accordionNavigation = !undefined = true.
// ---------------------------------------------------------------------------

export async function restoreAccordionMode(page: Page): Promise<void> {
    return page.evaluate(
        () => new Promise<void>((resolve) => {
            chrome.storage.sync.remove('accordionNavigation', resolve);
        }),
    );
}

// ---------------------------------------------------------------------------
// Helper: seed a sliderIndex value into sync storage so init() picks it up.
// ---------------------------------------------------------------------------

export async function seedSliderIndex(page: Page, index: number): Promise<void> {
    return page.evaluate(
        (idx) => new Promise<void>((resolve) => {
            chrome.storage.sync.set({ sliderIndex: idx }, resolve);
        }),
        index,
    );
}

export async function clearSliderIndex(page: Page): Promise<void> {
    return page.evaluate(
        () => new Promise<void>((resolve) => {
            chrome.storage.sync.remove('sliderIndex', resolve);
        }),
    );
}

// ---------------------------------------------------------------------------
// Helper: store a custom bookmark icon image in chrome.storage.local,
// matching the shape that BookmarkLink.vue's updateImage() expects.
// ---------------------------------------------------------------------------

export async function storeBookmarkIcon(
    page: Page,
    bookmarkId: string,
    parentId: string,
    imageData: string,
): Promise<void> {
    return page.evaluate(
        ({ id, pId, img }) => new Promise<void>((resolve) => {
            chrome.storage.local.set({ [id]: { id, parentId: pId, image: img } }, resolve);
        }),
        { id: bookmarkId, pId: parentId, img: imageData },
    );
}