import {
    test,
    expect,
    createBookmarkFolder,
    createBookmark,
    getRootId,
    removeBookmarkNode,
    cleanupBookmarksByTitle,
    enableSliderMode,
    restoreAccordionMode,
    storeBookmarkIcon,
    seedSliderIndex,
    clearSliderIndex,
} from './fixtures';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Wait for the app to finish initialising (add-button visible = init complete).
 * .toolbar has height:0 by design so we target the first button inside it.
 * 20 s covers the cold-start of a fresh Chrome profile on first run.
 */
async function waitForAppReady(page: import('@playwright/test').Page) {
    await expect(page.locator('.toolbar-add-button')).toBeVisible({ timeout: 20_000 });
}

// ---------------------------------------------------------------------------
// Page load
// ---------------------------------------------------------------------------

test.describe('New tab page — loading', () => {
    test('loads without a console error', async ({ extensionPage }) => {
        const errors: string[] = [];
        extensionPage.on('pageerror', (err) => errors.push(err.message));

        await waitForAppReady(extensionPage);

        expect(errors).toHaveLength(0);
    });

    test('document title is set', async ({ extensionPage }) => {
        await waitForAppReady(extensionPage);

        // The extension overrides new-tab — any non-empty title is acceptable
        expect(await extensionPage.title()).toBeTruthy();
    });
});

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

test.describe('Toolbar', () => {
    test.beforeEach(async ({ extensionPage }) => {
        await waitForAppReady(extensionPage);
    });

    test('add-bookmark button is visible', async ({ extensionPage }) => {
        await expect(extensionPage.locator('.toolbar-add-button')).toBeVisible();
    });

    test('settings button is visible', async ({ extensionPage }) => {
        await expect(extensionPage.locator('.toolbar-settings-button')).toBeVisible();
    });

    test('filter input is visible', async ({ extensionPage }) => {
        await expect(extensionPage.locator('.toolbar-filter-input')).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Add-bookmark dialog
// ---------------------------------------------------------------------------

test.describe('Add-bookmark dialog', () => {
    test.beforeEach(async ({ extensionPage }) => {
        await waitForAppReady(extensionPage);
    });

    test('opens when add button is clicked', async ({ extensionPage }) => {
        await extensionPage.locator('.toolbar-add-button').click();

        await expect(extensionPage.getByText('New Bookmark')).toBeVisible();
    });

    test('closes when Cancel is clicked', async ({ extensionPage }) => {
        await extensionPage.locator('.toolbar-add-button').click();
        await expect(extensionPage.getByText('New Bookmark')).toBeVisible();

        await extensionPage.getByRole('button', { name: 'Cancel' }).click();

        await expect(extensionPage.getByText('New Bookmark')).not.toBeVisible({ timeout: 5_000 });
    });
});

// ---------------------------------------------------------------------------
// Settings dialog
// ---------------------------------------------------------------------------

test.describe('Settings dialog', () => {
    test.beforeEach(async ({ extensionPage }) => {
        await waitForAppReady(extensionPage);
    });

    test('opens when settings button is clicked', async ({ extensionPage }) => {
        await extensionPage.locator('.toolbar-settings-button').click();

        await expect(extensionPage.getByText('Settings')).toBeVisible();
    });

    test('closes when Close is clicked', async ({ extensionPage }) => {
        await extensionPage.locator('.toolbar-settings-button').click();
        await expect(extensionPage.getByText('Settings')).toBeVisible();

        await extensionPage.getByRole('button', { name: 'Close' }).click();

        await expect(extensionPage.getByText('Settings')).not.toBeVisible({ timeout: 5_000 });
    });

    test('dark mode switch is present', async ({ extensionPage }) => {
        await extensionPage.locator('.toolbar-settings-button').click();

        await expect(extensionPage.getByText('Prefer dark mode')).toBeVisible();
    });

    test('accordion layout switch is present', async ({ extensionPage }) => {
        await extensionPage.locator('.toolbar-settings-button').click();

        await expect(extensionPage.getByText('Use accordion layout')).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Bookmark creation flow (requires Chrome bookmarks API via page.evaluate)
// ---------------------------------------------------------------------------

test.describe('Bookmark creation via UI', () => {
    test.beforeEach(async ({ extensionPage }) => {
        await waitForAppReady(extensionPage);
    });

    test.afterEach(async ({ extensionPage }) => {
        await cleanupBookmarksByTitle(extensionPage, 'E2E Test Folder');
    });

    test('creating a bookmark via the form adds it to the page', async ({ extensionPage }) => {
        // Open dialog
        await extensionPage.locator('.toolbar-add-button').click();
        await expect(extensionPage.getByText('New Bookmark')).toBeVisible();

        // Fill in folder name (new folder tab)
        await extensionPage.getByRole('tab', { name: 'New Folder' }).click();
        await extensionPage.getByLabel('Bookmark Folder Name').fill('E2E Test Folder');

        // Fill in bookmark details
        await extensionPage.getByLabel('Bookmark Title').fill('Example Site');
        await extensionPage.getByLabel('Bookmark URL').fill('https://example.com');

        // Save
        await extensionPage.getByRole('button', { name: 'Save' }).click();

        // Dialog should close
        await expect(extensionPage.getByText('New Bookmark')).not.toBeVisible({ timeout: 5_000 });

        // Folder titles are bound via v-model to <input> elements inside accordion headers.
        // CSS selectors cannot match input values (property vs attribute), so use
        // waitForFunction to check the live DOM value.
        await extensionPage.waitForFunction(
            (name) => Array.from(document.querySelectorAll('.v-expansion-panel-title input'))
                .some((el) => (el as HTMLInputElement).value === name),
            'E2E Test Folder',
            { timeout: 5_000 },
        );
    });
});

// ---------------------------------------------------------------------------
// Bookmark folder created via API — tests that need pre-existing data
// ---------------------------------------------------------------------------

test.describe('Bookmarks display', () => {
    let createdFolderId: string | null = null;

    test.beforeEach(async ({ extensionPage }) => {
        await waitForAppReady(extensionPage);
    });

    test.afterEach(async ({ extensionPage }) => {
        if (createdFolderId) {
            await removeBookmarkNode(extensionPage, createdFolderId);
            createdFolderId = null;
        }
    });

    test('folder title is shown after creating a folder via Chrome API', async ({ extensionPage }) => {
        // Wait for the root folder to be initialised
        let rootId: string | null = null;
        await expect.poll(async () => {
            rootId = await getRootId(extensionPage);
            return rootId;
        }, { timeout: 8_000 }).not.toBeNull();

        // Inject a test folder with a bookmark inside it via the Chrome bookmarks API.
        // The bookmark must be inside the folder so the folder is not empty (empty
        // folders are not rendered by the app).
        const folder = await createBookmarkFolder(extensionPage, rootId!, 'API Test Folder');
        createdFolderId = folder.id;
        await createBookmark(extensionPage, folder.id, 'placeholder', 'https://placeholder.com');

        // Reload so the UI picks up the new Chrome bookmark
        await extensionPage.reload();
        await waitForAppReady(extensionPage);

        // Folder titles are bound via v-model to <input> elements inside accordion headers —
        // waitForFunction checks the live DOM value since CSS selectors cannot match input
        // values set as properties (not attributes).
        await extensionPage.waitForFunction(
            (name) => Array.from(document.querySelectorAll('.v-expansion-panel-title input'))
                .some((el) => (el as HTMLInputElement).value === name),
            'API Test Folder',
            { timeout: 5_000 },
        );
    });
});

// ---------------------------------------------------------------------------
// currentFolder getter — catches the off-by-one bug in _getters.ts
// Bug: bookmarks[sliderIndex - 1] instead of bookmarks[sliderIndex]
// ---------------------------------------------------------------------------

test.describe('Current folder title (slider mode)', () => {
    const folderIds: string[] = [];

    test.beforeEach(async ({ extensionPage }) => {
        await waitForAppReady(extensionPage);
    });

    test.afterEach(async ({ extensionPage }) => {
        for (const id of folderIds) {
            await removeBookmarkNode(extensionPage, id);
        }
        folderIds.length = 0;
        await clearSliderIndex(extensionPage);
        await restoreAccordionMode(extensionPage);
    });

    test('navigation title shows a folder name when sliderIndex is 0', async ({ extensionPage }) => {
        let rootId: string | null = null;
        await expect.poll(async () => {
            rootId = await getRootId(extensionPage);
            return rootId;
        }, { timeout: 8_000 }).not.toBeNull();

        // Create 2 folders so NavigationDots renders (requires bookmarks.length > 1)
        const folderA = await createBookmarkFolder(extensionPage, rootId!, 'Getter Test A');
        folderIds.push(folderA.id);
        await createBookmark(extensionPage, folderA.id, 'placeholder', 'https://example.com');

        const folderB = await createBookmarkFolder(extensionPage, rootId!, 'Getter Test B');
        folderIds.push(folderB.id);
        await createBookmark(extensionPage, folderB.id, 'placeholder', 'https://example.com');

        // Seed sliderIndex=0 so init() sets it directly; reload in slider mode.
        await seedSliderIndex(extensionPage, 0);
        await enableSliderMode(extensionPage);
        await extensionPage.reload();
        await waitForAppReady(extensionPage);

        // With the getter bug: currentFolder = bookmarks[-1] = undefined → null.
        // Accessing null.title in the template throws → Vue catches it → input has no value.
        // Without the bug: currentFolder = bookmarks[0] = a real folder → input shows its title.
        await extensionPage.waitForFunction(
            () => {
                const input = document.querySelector(
                    '[aria-label="Bookmark Folder Title"]',
                ) as HTMLInputElement | null;
                return !!(input?.value);
            },
            undefined,
            { timeout: 5_000 },
        );
    });
});

// ---------------------------------------------------------------------------
// setSliderIndex clamping — catches the missing upper-bound clamp in utils.ts
// Bug: Math.min(index, bookmarks.length - 1) call removed
// ---------------------------------------------------------------------------

test.describe('Slider index clamping (slider mode)', () => {
    const folderIds: string[] = [];

    test.beforeEach(async ({ extensionPage }) => {
        await waitForAppReady(extensionPage);
    });

    test.afterEach(async ({ extensionPage }) => {
        for (const id of folderIds) {
            await removeBookmarkNode(extensionPage, id);
        }
        folderIds.length = 0;
        await clearSliderIndex(extensionPage);
        await restoreAccordionMode(extensionPage);
    });

    test('navigating left from an out-of-bounds index clamps to a valid folder', async ({ extensionPage }) => {
        let rootId: string | null = null;
        await expect.poll(async () => {
            rootId = await getRootId(extensionPage);
            return rootId;
        }, { timeout: 8_000 }).not.toBeNull();

        const folderA = await createBookmarkFolder(extensionPage, rootId!, 'Clamp Test A');
        folderIds.push(folderA.id);
        await createBookmark(extensionPage, folderA.id, 'placeholder', 'https://example.com');

        const folderB = await createBookmarkFolder(extensionPage, rootId!, 'Clamp Test B');
        folderIds.push(folderB.id);
        await createBookmark(extensionPage, folderB.id, 'placeholder', 'https://example.com');

        // Seed sliderIndex=99 so init() assigns it directly (bypassing setSliderIndex).
        // This puts the slider in an out-of-bounds state at load time.
        await seedSliderIndex(extensionPage, 99);
        await enableSliderMode(extensionPage);
        await extensionPage.reload();
        await waitForAppReady(extensionPage);

        // The left arrow is enabled when sliderIndex > 0 (99 > 0 = true).
        // Clicking it calls setSliderIndex(98, true).
        // With clamping:    Math.min(98, lastIndex) → valid index → currentFolder is real → title shown.
        // Without clamping: sliderIndex stays 98 → currentFolder = null → title still broken.
        await extensionPage.locator('button.navigation-arrow.left').click();

        await extensionPage.waitForFunction(
            () => {
                const input = document.querySelector(
                    '[aria-label="Bookmark Folder Title"]',
                ) as HTMLInputElement | null;
                return !!(input?.value);
            },
            undefined,
            { timeout: 5_000 },
        );
    });
});

// ---------------------------------------------------------------------------
// get_localStorage return value — catches the wrong return in _actions.ts
// Bug: resolve(event) instead of resolve(event[id]) → full storage object returned
// ---------------------------------------------------------------------------

test.describe('Bookmark icon persistence (slider mode)', () => {
    const folderIds: string[] = [];

    // A minimal 1 × 1 transparent PNG, valid enough to set as background-image.
    const TEST_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    test.beforeEach(async ({ extensionPage }) => {
        await waitForAppReady(extensionPage);
    });

    test.afterEach(async ({ extensionPage }) => {
        for (const id of folderIds) {
            await removeBookmarkNode(extensionPage, id);
        }
        folderIds.length = 0;
        await restoreAccordionMode(extensionPage);
    });

    test('custom bookmark icon is displayed after reload', async ({ extensionPage }) => {
        let rootId: string | null = null;
        await expect.poll(async () => {
            rootId = await getRootId(extensionPage);
            return rootId;
        }, { timeout: 8_000 }).not.toBeNull();

        const folder = await createBookmarkFolder(extensionPage, rootId!, 'Icon Test Folder');
        folderIds.push(folder.id);
        const bookmark = await createBookmark(
            extensionPage,
            folder.id,
            'Icon Test Bookmark',
            'https://example.com',
        );

        // Store the icon before reload so BookmarkLink.vue reads it on mount.
        await storeBookmarkIcon(extensionPage, bookmark.id, folder.id, TEST_IMAGE);

        await enableSliderMode(extensionPage);
        await extensionPage.reload();
        await waitForAppReady(extensionPage);

        // BookmarkLink.vue calls get_localStorage(bookmarkId) on mount.
        // Without the bug: returns { image: TEST_IMAGE } → image ref set → .bookmark-image rendered.
        // With the bug: returns { [bookmarkId]: { image: TEST_IMAGE } } → .image is undefined
        //               → image ref stays falsy → .bookmark-image element is never rendered.
        await expect(extensionPage.locator('.bookmark-image').first()).toBeVisible({ timeout: 5_000 });
    });
});