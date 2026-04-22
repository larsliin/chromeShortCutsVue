import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBookmarksStore } from '@stores/bookmarks';
import { useBookmarkOps } from '@cmp/useBookmarkOps';
import { useAccordionSync } from '@cmp/useAccordionSync';
import { isValidURL } from '@utils/urlUtils';
import type { BookmarkNode } from '@/types/bookmark';
import { chromeMock, fireCallback } from './mocks/chrome';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBookmark(id: string, parentId: string, url = 'https://test.com'): BookmarkNode {
    return { id, title: `Bookmark ${id}`, parentId, url, syncing: false };
}

function makeFolder(id: string, children: BookmarkNode[] = []): BookmarkNode {
    return { id, title: `Folder ${id}`, parentId: 'root', children, syncing: false };
}

function makeTree(folders: BookmarkNode[]): chrome.bookmarks.BookmarkTreeNode[] {
    return [{ id: 'root', title: 'root', children: folders as chrome.bookmarks.BookmarkTreeNode[], syncing: false }];
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let store: ReturnType<typeof useBookmarksStore>;
let bookmarkOps: ReturnType<typeof useBookmarkOps>;
let accordionSync: ReturnType<typeof useAccordionSync>;

beforeEach(() => {
    setActivePinia(createPinia());
    store = useBookmarksStore();
    bookmarkOps = useBookmarkOps();
    accordionSync = useAccordionSync();
});

// ---------------------------------------------------------------------------
// getStoredBookmarkById
// ---------------------------------------------------------------------------

describe('getStoredBookmarkById', () => {
    it('returns the matching bookmark from nested children', () => {
        const target = makeBookmark('bm2', 'f1');
        store.bookmarks = [
            makeFolder('f1', [makeBookmark('bm1', 'f1'), target]),
            makeFolder('f2', [makeBookmark('bm3', 'f2')]),
        ];

        expect(bookmarkOps.getStoredBookmarkById('bm2')).toEqual(target);
    });

    it('returns null when the id is not found', () => {
        store.bookmarks = [makeFolder('f1', [makeBookmark('bm1', 'f1')])];

        expect(bookmarkOps.getStoredBookmarkById('nonexistent')).toBeNull();
    });

    it('returns null when bookmarks state is null', () => {
        store.bookmarks = null;

        expect(bookmarkOps.getStoredBookmarkById('any')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// getBookmarksAsFlatArr
// ---------------------------------------------------------------------------

describe('getBookmarksAsFlatArr', () => {
    it('returns null when rootId is not set', async () => {
        store.rootId = null;

        const result = await bookmarkOps.getBookmarksAsFlatArr();

        expect(result).toBeNull();
    });

    it('returns a flat array of all bookmarks across all folders', async () => {
        const bm1 = makeBookmark('bm1', 'f1');
        const bm2 = makeBookmark('bm2', 'f2');
        const folder1 = makeFolder('f1', [bm1]);
        const folder2 = makeFolder('f2', [bm2]);
        const tree = makeTree([folder1, folder2]);

        store.rootId = 'root';
        store.bookmarksBarId = 'bar';
        fireCallback(chromeMock.bookmarks.getSubTree, [tree]);

        const result = await bookmarkOps.getBookmarksAsFlatArr();

        expect(result).toHaveLength(2);
        expect((result ?? []).map((b) => b.id)).toEqual(['bm1', 'bm2']);
    });
});

// ---------------------------------------------------------------------------
// updateAccordionModel
// ---------------------------------------------------------------------------

describe('updateAccordionModel', () => {
    it('does nothing when accordionModel is null', async () => {
        store.accordionModel = null;
        vi.spyOn(store, 'setSyncStorage').mockResolvedValue(undefined);

        await accordionSync.updateAccordionModel(0);

        expect(store.accordionModel).toBeNull();
    });

    it('removes the index from the model and shifts higher indices', async () => {
        store.accordionModel = [0, 1, 2];
        vi.spyOn(store, 'setSyncStorage').mockResolvedValue(undefined);

        await accordionSync.updateAccordionModel(1);

        // index 1 removed; index 2 → 1
        expect(store.accordionModel).toEqual([0, 1]);
    });

    it('shifts indices down when a lower index is removed', async () => {
        store.accordionModel = [0, 2, 4];
        vi.spyOn(store, 'setSyncStorage').mockResolvedValue(undefined);

        await accordionSync.updateAccordionModel(0);

        // index 0 removed; 2→1, 4→3
        expect(store.accordionModel).toEqual([1, 3]);
    });
});

// ---------------------------------------------------------------------------
// buildRootFolder — creates root if not found
// ---------------------------------------------------------------------------

describe('buildRootFolder', () => {
    beforeEach(() => {
        store.bookmarksBarId = 'bar';
        vi.spyOn(store, 'setLocalStorage').mockResolvedValue(undefined);
        vi.spyOn(store, 'setSyncStorage').mockResolvedValue(undefined);
    });

    it('sets rootId from existing folder when it already exists', async () => {
        const rootFolder = { id: 'rf1', title: 'My Shortcuts Tab', parentId: 'bar', children: [] };
        const tree = [{ id: 'bar', title: 'Bookmarks bar', children: [rootFolder] }];
        fireCallback(chromeMock.bookmarks.getSubTree, [tree]);

        await accordionSync.buildRootFolder();

        expect(store.rootId).toBe('rf1');
        expect(store.setLocalStorage).toHaveBeenCalledWith({ root: 'rf1' });
    });

    it('creates root folder and sets rootId when folder is missing', async () => {
        const emptyTree = [{ id: 'bar', title: 'Bookmarks bar', children: [] }];
        const created = { id: 'newRf', title: 'My Shortcuts Tab', parentId: 'bar' };

        fireCallback(chromeMock.bookmarks.getSubTree, [emptyTree]);
        fireCallback(chromeMock.bookmarks.create, [created]);

        chromeMock.storage.sync.get.mockResolvedValue({});

        await accordionSync.buildRootFolder();

        expect(store.rootId).toBe('newRf');
        expect(chromeMock.bookmarks.create).toHaveBeenCalledWith(
            expect.objectContaining({ parentId: 'bar', title: 'My Shortcuts Tab' }),
            expect.any(Function),
        );
    });
});

// ---------------------------------------------------------------------------
// isValidURL
// ---------------------------------------------------------------------------

describe('isValidURL', () => {
    it('returns true for a valid https URL', () => {
        expect(isValidURL('https://example.com')).toBe(true);
    });

    it('returns true for a valid http URL', () => {
        expect(isValidURL('http://example.com/path?q=1')).toBe(true);
    });

    it('returns false for a plain string', () => {
        expect(isValidURL('not a url')).toBe(false);
    });

    it('returns false for an empty string', () => {
        expect(isValidURL('')).toBe(false);
    });
});
