import { describe, it, expect, beforeEach, vi } from 'vitest';
import { chromeMock, fireCallback, fireNoArgCallback } from './mocks/chrome';

// ---------------------------------------------------------------------------
// background.js imports the `chrome` global and registers listeners at
// module level. We re-import it fresh for each test file run. Because Vitest
// caches modules, we use vi.resetModules() to force a fresh evaluation of
// the module so that the top-level chrome.*. addListener calls run again
// against our current mocks.
// ---------------------------------------------------------------------------

async function loadBackground() {
    vi.resetModules();
    await import('../../background.js');
}

// ---------------------------------------------------------------------------
// Helper data
// ---------------------------------------------------------------------------

function makeBookmarksBarNode(children: chrome.bookmarks.BookmarkTreeNode[] = []) {
    return {
        id: 'bar',
        title: 'Bookmarks bar',
        // Chrome exposes folderType on the bookmarks bar node
        folderType: 'bookmarks-bar',
        children,
    };
}

function makeRootTree(barChildren: chrome.bookmarks.BookmarkTreeNode[] = []) {
    return [{ id: '0', title: 'root', children: [makeBookmarksBarNode(barChildren)] }];
}

// ---------------------------------------------------------------------------
// Top-level listener registration
// ---------------------------------------------------------------------------

describe('background.js — listener registration', () => {
    it('registers chrome.runtime.onInstalled listener at module level', async () => {
        await loadBackground();

        expect(chromeMock.runtime.onInstalled.addListener).toHaveBeenCalledTimes(1);
    });

    it('registers chrome.tabs.onActivated listener at module level', async () => {
        await loadBackground();

        expect(chromeMock.tabs.onActivated.addListener).toHaveBeenCalledTimes(1);
    });

    it('registers chrome.tabs.onUpdated at module level — NOT inside onActivated', async () => {
        await loadBackground();

        // Both listeners must be registered exactly once at import time.
        // The old bug was registering onUpdated inside onActivated's callback,
        // which would cause it to be registered 0 times at import.
        // After the fix it is registered once at the top level.
        expect(chromeMock.tabs.onUpdated.addListener).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// onInstalled — install reason
// ---------------------------------------------------------------------------

describe('background.js — onInstalled handler', () => {
    it('skips folder creation when bookmarks bar node is not found', async () => {
        // Tree without any bookmarks-bar folderType node
        const tree = [{ id: '0', title: 'root', children: [{ id: 'other', title: 'Other', children: [] }] }];
        chromeMock.bookmarks.getTree.mockResolvedValue(tree);

        await loadBackground();

        // Grab the registered onInstalled callback and invoke it
        const onInstalledCb = chromeMock.runtime.onInstalled.addListener.mock.calls[0][0];
        await onInstalledCb({ reason: 'install' });

        expect(chromeMock.bookmarks.getSubTree).not.toHaveBeenCalled();
        expect(chromeMock.bookmarks.create).not.toHaveBeenCalled();
    });

    it('does nothing when reason is "update" (not "install")', async () => {
        chromeMock.bookmarks.getTree.mockResolvedValue(makeRootTree());

        await loadBackground();

        const onInstalledCb = chromeMock.runtime.onInstalled.addListener.mock.calls[0][0];
        await onInstalledCb({ reason: 'update' });

        expect(chromeMock.bookmarks.getTree).not.toHaveBeenCalled();
    });

    it('does not create folder when it already exists in bookmarks bar', async () => {
        const existingFolder = { id: 'rf1', title: 'My Shortcuts Tab', children: [] };
        const tree = makeRootTree([existingFolder]);
        chromeMock.bookmarks.getTree.mockResolvedValue(tree);

        const barTree = [makeBookmarksBarNode([existingFolder])];
        fireCallback(chromeMock.bookmarks.getSubTree, [barTree]);

        await loadBackground();

        const onInstalledCb = chromeMock.runtime.onInstalled.addListener.mock.calls[0][0];
        await onInstalledCb({ reason: 'install' });

        expect(chromeMock.bookmarks.create).not.toHaveBeenCalled();
    });

    it('creates the root folder when it is not present in the bookmarks bar', async () => {
        const tree = makeRootTree([]);
        chromeMock.bookmarks.getTree.mockResolvedValue(tree);

        const barTree = [makeBookmarksBarNode([])];
        fireCallback(chromeMock.bookmarks.getSubTree, [barTree]);
        fireCallback(chromeMock.bookmarks.create, [{ id: 'new', title: 'My Shortcuts Tab' }]);

        await loadBackground();

        const onInstalledCb = chromeMock.runtime.onInstalled.addListener.mock.calls[0][0];
        await onInstalledCb({ reason: 'install' });

        expect(chromeMock.bookmarks.create).toHaveBeenCalledWith(
            expect.objectContaining({ parentId: 'bar', title: 'My Shortcuts Tab' }),
            expect.any(Function),
        );
    });
});

// ---------------------------------------------------------------------------
// onActivated / onUpdated — popup toggling
// ---------------------------------------------------------------------------

describe('background.js — tab listeners', () => {
    it('sets popup to empty string for non-http/https URLs', async () => {
        await loadBackground();

        fireCallback(chromeMock.tabs.get, [{ id: 1, url: 'chrome://newtab' }]);

        const onActivatedCb = chromeMock.tabs.onActivated.addListener.mock.calls[0][0];
        await onActivatedCb({ tabId: 1 });

        expect(chromeMock.action.setPopup).toHaveBeenCalledWith({ popup: '' });
    });

    it('sets popup to popup.html for https URLs', async () => {
        await loadBackground();

        fireCallback(chromeMock.tabs.get, [{ id: 2, url: 'https://github.com' }]);

        const onActivatedCb = chromeMock.tabs.onActivated.addListener.mock.calls[0][0];
        await onActivatedCb({ tabId: 2 });

        expect(chromeMock.action.setPopup).toHaveBeenCalledWith({ popup: 'popup.html' });
    });

    it('onUpdated disables popup for non-http URLs on URL change', async () => {
        await loadBackground();

        const onUpdatedCb = chromeMock.tabs.onUpdated.addListener.mock.calls[0][0];
        onUpdatedCb(1, { url: 'chrome-extension://abc/index.html' }, {});

        expect(chromeMock.action.setPopup).toHaveBeenCalledWith({ popup: '' });
    });

    it('onUpdated does nothing when changeInfo has no url', async () => {
        await loadBackground();

        const onUpdatedCb = chromeMock.tabs.onUpdated.addListener.mock.calls[0][0];
        onUpdatedCb(1, {}, {});

        expect(chromeMock.action.setPopup).not.toHaveBeenCalled();
    });
});
