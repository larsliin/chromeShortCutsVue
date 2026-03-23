import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBookmarksStore } from '@stores/bookmarks';
import { useUtils } from '@/shared/composables/utils';
import type { BookmarkNode } from '@/types/bookmark';
import { chromeMock, fireCallback } from './mocks/chrome';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBookmark(id: string, parentId: string, url = 'https://test.com'): BookmarkNode {
    return { id, title: `Bookmark ${id}`, parentId, url };
}

function makeFolder(id: string, children: BookmarkNode[] = []): BookmarkNode {
    return { id, title: `Folder ${id}`, parentId: 'root', children };
}

function makeTree(folders: BookmarkNode[]): chrome.bookmarks.BookmarkTreeNode[] {
    return [{ id: 'root', title: 'root', children: folders }];
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let store: ReturnType<typeof useBookmarksStore>;
let utils: ReturnType<typeof useUtils>;

beforeEach(() => {
    setActivePinia(createPinia());
    store = useBookmarksStore();
    utils = useUtils();
});

// ---------------------------------------------------------------------------
// setSliderIndex
// ---------------------------------------------------------------------------

describe('setSliderIndex', () => {
    it('sets the slider index in the store', async () => {
        store.bookmarks = [makeFolder('f1'), makeFolder('f2'), makeFolder('f3')];

        await utils.setSliderIndex(1, false);

        expect(store.sliderIndex).toBe(1);
    });

    it('clamps index to 0 when negative', async () => {
        store.bookmarks = [makeFolder('f1'), makeFolder('f2')];

        await utils.setSliderIndex(-5, false);

        expect(store.sliderIndex).toBe(0);
    });

    it('clamps index to last folder when exceeds bookmarks length', async () => {
        store.bookmarks = [makeFolder('f1'), makeFolder('f2')];

        await utils.setSliderIndex(99, false);

        expect(store.sliderIndex).toBe(1);
    });

    it('calls set_syncStorage when setLocalStorage is true', async () => {
        store.bookmarks = [makeFolder('f1')];
        const setSyncSpy = vi.spyOn(store, 'set_syncStorage').mockResolvedValue(undefined);

        await utils.setSliderIndex(0, true);

        expect(setSyncSpy).toHaveBeenCalledWith({ sliderIndex: 0 });
    });

    it('does not call set_syncStorage when setLocalStorage is false', async () => {
        store.bookmarks = [makeFolder('f1')];
        const setSyncSpy = vi.spyOn(store, 'set_syncStorage').mockResolvedValue(undefined);

        await utils.setSliderIndex(0, false);

        expect(setSyncSpy).not.toHaveBeenCalled();
    });
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

        expect(utils.getStoredBookmarkById('bm2')).toEqual(target);
    });

    it('returns null when the id is not found', () => {
        store.bookmarks = [makeFolder('f1', [makeBookmark('bm1', 'f1')])];

        expect(utils.getStoredBookmarkById('nonexistent')).toBeNull();
    });

    it('returns null when bookmarks state is null', () => {
        store.bookmarks = null;

        expect(utils.getStoredBookmarkById('any')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// getBookmarksAsFlatArr
// ---------------------------------------------------------------------------

describe('getBookmarksAsFlatArr', () => {
    it('returns null when rootId is not set', async () => {
        store.rootId = null;

        const result = await utils.getBookmarksAsFlatArr();

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

        const result = await utils.getBookmarksAsFlatArr();

        expect(result).toHaveLength(2);
        expect(result!.map((b) => b.id)).toEqual(['bm1', 'bm2']);
    });
});

// ---------------------------------------------------------------------------
// updateAccordionModel
// ---------------------------------------------------------------------------

describe('updateAccordionModel', () => {
    it('does nothing when accordionModel is null', async () => {
        store.accordionModel = null;
        vi.spyOn(store, 'set_syncStorage').mockResolvedValue(undefined);

        await utils.updateAccordionModel(0);

        expect(store.accordionModel).toBeNull();
    });

    it('removes the index from the model and shifts higher indices', async () => {
        store.accordionModel = [0, 1, 2];
        vi.spyOn(store, 'set_syncStorage').mockResolvedValue(undefined);

        await utils.updateAccordionModel(1);

        // index 1 removed; index 2 → 1
        expect(store.accordionModel).toEqual([0, 1]);
    });

    it('shifts indices down when a lower index is removed', async () => {
        store.accordionModel = [0, 2, 4];
        vi.spyOn(store, 'set_syncStorage').mockResolvedValue(undefined);

        await utils.updateAccordionModel(0);

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
        vi.spyOn(store, 'set_localStorage').mockResolvedValue(undefined);
        vi.spyOn(store, 'set_syncStorage').mockResolvedValue(undefined);
    });

    it('sets rootId from existing folder when it already exists', async () => {
        const rootFolder = { id: 'rf1', title: 'My Shortcuts Tab', parentId: 'bar', children: [] };
        const tree = [{ id: 'bar', title: 'Bookmarks bar', children: [rootFolder] }];
        fireCallback(chromeMock.bookmarks.getSubTree, [tree]);

        await utils.buildRootFolder();

        expect(store.rootId).toBe('rf1');
        expect(store.set_localStorage).toHaveBeenCalledWith({ root: 'rf1' });
    });

    it('creates root folder and sets rootId when folder is missing', async () => {
        const emptyTree = [{ id: 'bar', title: 'Bookmarks bar', children: [] }];
        const created = { id: 'newRf', title: 'My Shortcuts Tab', parentId: 'bar' };

        fireCallback(chromeMock.bookmarks.getSubTree, [emptyTree]);
        fireCallback(chromeMock.bookmarks.create, [created]);

        chromeMock.storage.sync.get.mockResolvedValue({});

        await utils.buildRootFolder();

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
        expect(utils.isValidURL('https://example.com')).toBe(true);
    });

    it('returns true for a valid http URL', () => {
        expect(utils.isValidURL('http://example.com/path?q=1')).toBe(true);
    });

    it('returns false for a plain string', () => {
        expect(utils.isValidURL('not a url')).toBe(false);
    });

    it('returns false for an empty string', () => {
        expect(utils.isValidURL('')).toBe(false);
    });
});
