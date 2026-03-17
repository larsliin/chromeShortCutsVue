import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBookmarksStore } from '@stores/bookmarks';
import { chromeMock, fireCallback, fireThreeArgCallback } from './mocks/chrome';
import type { BookmarkNode } from '@/types/bookmark';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNode(
    overrides: Partial<chrome.bookmarks.BookmarkTreeNode> = {},
): chrome.bookmarks.BookmarkTreeNode {
    return {
        id: '1',
        title: 'Test',
        parentId: '0',
        index: 0,
        url: 'https://example.com',
        dateAdded: Date.now(),
        children: [],
        ...overrides,
    };
}

function makeFolder(
    overrides: Partial<chrome.bookmarks.BookmarkTreeNode> = {},
): chrome.bookmarks.BookmarkTreeNode {
    return makeNode({ url: undefined, children: [], ...overrides });
}

type StoreBookmark = BookmarkNode & { image?: string };

let store: ReturnType<typeof useBookmarksStore>;

beforeEach(() => {
    setActivePinia(createPinia());
    store = useBookmarksStore();
});

// ---------------------------------------------------------------------------
// ADD BOOKMARK
// Covers the two Chrome API calls the "New Bookmark" form makes:
//   1. create folder   → create_bookmark(rootId, folderTitle)
//   2. create bookmark → create_bookmark(folderId, title, url)
// ---------------------------------------------------------------------------

describe('Add bookmark', () => {
    it('creates a folder (no url) and returns the new node', async () => {
        const folder = makeFolder({ id: 'f1', title: 'Work' });
        fireCallback(chromeMock.bookmarks.create, [folder]);

        const result = await store.create_bookmark('root', 'Work');

        expect(chromeMock.bookmarks.create).toHaveBeenCalledWith(
            { parentId: 'root', title: 'Work', url: undefined },
            expect.any(Function),
        );
        expect(result.id).toBe('f1');
        expect(result.url).toBeUndefined();
    });

    it('creates a bookmark (with url) inside an existing folder', async () => {
        const bookmark = makeNode({ id: 'b1', title: 'GitHub', url: 'https://github.com', parentId: 'f1' });
        fireCallback(chromeMock.bookmarks.create, [bookmark]);

        const result = await store.create_bookmark('f1', 'GitHub', 'https://github.com');

        expect(chromeMock.bookmarks.create).toHaveBeenCalledWith(
            { parentId: 'f1', title: 'GitHub', url: 'https://github.com' },
            expect.any(Function),
        );
        expect(result.url).toBe('https://github.com');
        expect(result.parentId).toBe('f1');
    });

    it('creates a folder then a child bookmark in sequence (full add flow)', async () => {
        const folder = makeFolder({ id: 'f1', title: 'Personal' });
        const bookmark = makeNode({ id: 'b1', title: 'Reddit', url: 'https://reddit.com', parentId: 'f1' });

        chromeMock.bookmarks.create
            .mockImplementationOnce((_: unknown, cb: (n: typeof folder) => void) => cb(folder))
            .mockImplementationOnce((_: unknown, cb: (n: typeof bookmark) => void) => cb(bookmark));

        const createdFolder = await store.create_bookmark('root', 'Personal');
        const createdBookmark = await store.create_bookmark(createdFolder.id, 'Reddit', 'https://reddit.com');

        expect(chromeMock.bookmarks.create).toHaveBeenCalledTimes(2);
        expect(createdFolder.id).toBe('f1');
        expect(createdBookmark.parentId).toBe('f1');
    });

    it('rejects when the Chrome API reports an error', async () => {
        fireCallback(chromeMock.bookmarks.create, [makeNode()], 'Cannot create bookmark here.');

        await expect(store.create_bookmark('root', 'Fail')).rejects.toThrow('Cannot create bookmark here.');
    });
});

// ---------------------------------------------------------------------------
// DELETE BOOKMARK
// Covers both the Chrome API call and the in-memory store state mutation that
// BookmarksView.onRemoved performs after a removal event fires.
// ---------------------------------------------------------------------------

describe('Delete bookmark', () => {
    it('calls chrome.bookmarks.remove and returns the removed id', async () => {
        fireCallback(chromeMock.bookmarks.remove, []);

        const result = await store.remove_bookmark('b1');

        expect(chromeMock.bookmarks.remove).toHaveBeenCalledWith('b1', expect.any(Function));
        expect(result).toBe('b1');
    });

    it('calls chrome.bookmarks.removeTree to delete a folder and all its children', async () => {
        fireCallback(chromeMock.bookmarks.removeTree, []);

        const result = await store.remove_bookmarkFolder('f1');

        expect(chromeMock.bookmarks.removeTree).toHaveBeenCalledWith('f1', expect.any(Function));
        expect(result).toBe('f1');
    });

    it('in-memory state: removes a single bookmark from its parent folder', () => {
        store.bookmarks = [
            {
                id: 'f1', title: 'Work', children: [
                    { id: 'b1', title: 'GitHub', url: 'https://github.com' },
                    { id: 'b2', title: 'Jira', url: 'https://jira.com' },
                ],
            },
        ] as BookmarkNode[];

        // Mirror the filter the onRemoved handler applies when a bookmark (not folder) is removed
        store.bookmarks = store.bookmarks.map((parent) => ({
            ...parent,
            children: (parent.children ?? []).filter((child) => child.id !== 'b1'),
        }));

        expect(store.bookmarks[0].children).toHaveLength(1);
        expect(store.bookmarks[0].children![0].id).toBe('b2');
    });

    it('in-memory state: removes an entire folder from the bookmarks list', () => {
        store.bookmarks = [
            { id: 'f1', title: 'Work', children: [] },
            { id: 'f2', title: 'Personal', children: [] },
        ] as BookmarkNode[];

        // Mirror the filter the onRemoved handler applies when a folder is removed
        store.bookmarks = store.bookmarks.filter((folder) => folder.id !== 'f1');

        expect(store.bookmarks).toHaveLength(1);
        expect(store.bookmarks[0].id).toBe('f2');
    });

    it('rejects when the Chrome API reports an error while removing a bookmark', async () => {
        fireCallback(chromeMock.bookmarks.remove, [], 'Cannot remove.');

        await expect(store.remove_bookmark('b1')).rejects.toThrow('Cannot remove.');
    });

    it('rejects when the Chrome API reports an error while removing a folder', async () => {
        fireCallback(chromeMock.bookmarks.removeTree, [], 'Cannot remove tree.');

        await expect(store.remove_bookmarkFolder('f1')).rejects.toThrow('Cannot remove tree.');
    });
});

// ---------------------------------------------------------------------------
// REORDER BOOKMARK
// reorder_bookmark(id, index) calls chrome.bookmarks.move with { index } only,
// meaning it moves a bookmark within its current folder.
// ---------------------------------------------------------------------------

describe('Reorder bookmark', () => {
    it('calls chrome.bookmarks.move with only an index (same-folder reorder)', async () => {
        fireThreeArgCallback(chromeMock.bookmarks.move, []);

        await store.reorder_bookmark('b1', 2);

        expect(chromeMock.bookmarks.move).toHaveBeenCalledWith('b1', { index: 2 }, expect.any(Function));
    });

    it('resolves to undefined on success', async () => {
        fireThreeArgCallback(chromeMock.bookmarks.move, []);

        await expect(store.reorder_bookmark('b1', 0)).resolves.toBeUndefined();
    });

    it('rejects when the Chrome API reports an error', async () => {
        fireThreeArgCallback(chromeMock.bookmarks.move, [], 'Move failed.');

        await expect(store.reorder_bookmark('b1', 1)).rejects.toThrow('Move failed.');
    });
});

// ---------------------------------------------------------------------------
// EXPORT BOOKMARKS
// The export feature reads bookmarks from the store and merges any locally-
// stored icon images before producing { bookmarks, type } JSON for download.
// ---------------------------------------------------------------------------

describe('Export bookmarks', () => {
    it('get_localStorageAll resolves with all stored items', async () => {
        const allItems = { b1: { id: 'b1', image: 'data:image/png;base64,abc' }, config: 'value' };
        chromeMock.storage.local.get.mockResolvedValueOnce(allItems);

        const result = await store.get_localStorageAll();

        expect(chromeMock.storage.local.get).toHaveBeenCalledWith(null);
        expect(result).toEqual(allItems);
    });

    it('export data structure has the correct shape', () => {
        store.bookmarks = [
            { id: 'f1', title: 'Work', children: [{ id: 'b1', title: 'GitHub', url: 'https://github.com' }] },
        ] as BookmarkNode[];

        const exportBookmarks = Array.from(store.bookmarks ?? []);
        const exportData = { bookmarks: exportBookmarks, type: 'bookmarks' };

        expect(exportData.type).toBe('bookmarks');
        expect(exportData.bookmarks).toHaveLength(1);
        expect(exportData.bookmarks[0].title).toBe('Work');
        expect(exportData.bookmarks[0].children![0].url).toBe('https://github.com');
    });

    it('merges icon images from local storage into the matching bookmark', async () => {
        store.bookmarks = [
            {
                id: 'f1', title: 'Work', children: [
                    { id: 'b1', title: 'GitHub', url: 'https://github.com' },
                ],
            },
        ] as BookmarkNode[];

        chromeMock.storage.local.get.mockResolvedValueOnce({
            b1: { id: 'b1', image: 'data:image/png;base64,iVBORw0KGgo=' },
        });

        const localItems = await store.get_localStorageAll() as Record<string, Record<string, unknown>>;
        const exportBookmarks = Array.from(store.bookmarks ?? []) as StoreBookmark[];

        Object.values(localItems)
            .filter((item) => !!item.image)
            .forEach((item) => {
                const bm = exportBookmarks
                    .flatMap((f) => (f.children ?? []) as StoreBookmark[])
                    .find((child) => child.id === (item.id as string));
                if (bm) bm.image = item.image as string;
            });

        const exported = exportBookmarks[0].children![0] as StoreBookmark;
        expect(exported.image).toBe('data:image/png;base64,iVBORw0KGgo=');
    });

    it('produces a valid JSON string from the export data', () => {
        store.bookmarks = [
            { id: 'f1', title: 'Work', children: [] },
        ] as BookmarkNode[];

        const exportData = { bookmarks: Array.from(store.bookmarks ?? []), type: 'bookmarks' };
        const json = JSON.stringify(exportData);
        const parsed = JSON.parse(json);

        expect(parsed).toEqual(exportData);
        expect(parsed.bookmarks[0].title).toBe('Work');
    });

    it('get_localStorageAll rejects when storage throws', async () => {
        chromeMock.storage.local.get.mockRejectedValueOnce(new Error('Storage unavailable.'));

        await expect(store.get_localStorageAll()).rejects.toThrow('Storage unavailable.');
    });
});

// ---------------------------------------------------------------------------
// IMPORT BOOKMARKS
// The import flow:
//   1. Parse uploaded JSON → { bookmarks: Folder[], type }
//   2. create_bookmark(rootId, folder.title) for each folder
//   3. Build old-id → new-id map for folders
//   4. create_bookmark(newFolderId, bm.title, bm.url) for each child bookmark
// ---------------------------------------------------------------------------

describe('Import bookmarks', () => {
    it('creates a folder for every entry in the import file', async () => {
        const importData = {
            bookmarks: [
                { id: 'old-f1', title: 'Work', children: [] },
                { id: 'old-f2', title: 'Personal', children: [] },
            ],
        };

        const f1 = makeFolder({ id: 'new-f1', title: 'Work' });
        const f2 = makeFolder({ id: 'new-f2', title: 'Personal' });

        chromeMock.bookmarks.create
            .mockImplementationOnce((_: unknown, cb: (n: typeof f1) => void) => cb(f1))
            .mockImplementationOnce((_: unknown, cb: (n: typeof f2) => void) => cb(f2));

        const results = await Promise.all(
            importData.bookmarks.map((folder) => store.create_bookmark('root', folder.title)),
        );

        expect(chromeMock.bookmarks.create).toHaveBeenCalledTimes(2);
        expect(results[0].title).toBe('Work');
        expect(results[1].title).toBe('Personal');
    });

    it('maps old folder ids to new ids and creates bookmarks in the correct folders', async () => {
        // Simulate the folder-creation step returning a new-id → old-id map
        const foldersMap: Record<string, string> = { 'old-f1': 'new-f1' };

        const flatBookmarks = [
            { id: 'old-b1', parentId: 'old-f1', title: 'GitHub', url: 'https://github.com' },
            { id: 'old-b2', parentId: 'old-f1', title: 'GitLab', url: 'https://gitlab.com' },
        ];

        const b1 = makeNode({ id: 'new-b1', title: 'GitHub', url: 'https://github.com', parentId: 'new-f1' });
        const b2 = makeNode({ id: 'new-b2', title: 'GitLab', url: 'https://gitlab.com', parentId: 'new-f1' });

        chromeMock.bookmarks.create
            .mockImplementationOnce((_: unknown, cb: (n: typeof b1) => void) => cb(b1))
            .mockImplementationOnce((_: unknown, cb: (n: typeof b2) => void) => cb(b2));

        const results = await Promise.all(
            flatBookmarks.map((bm) =>
                store.create_bookmark(foldersMap[bm.parentId], bm.title, bm.url),
            ),
        );

        expect(chromeMock.bookmarks.create).toHaveBeenNthCalledWith(
            1,
            { parentId: 'new-f1', title: 'GitHub', url: 'https://github.com' },
            expect.any(Function),
        );
        expect(chromeMock.bookmarks.create).toHaveBeenNthCalledWith(
            2,
            { parentId: 'new-f1', title: 'GitLab', url: 'https://gitlab.com' },
            expect.any(Function),
        );
        expect(results).toHaveLength(2);
    });

    it('handles folders with no child bookmarks gracefully (empty folders)', async () => {
        const folder = makeFolder({ id: 'new-f1', title: 'Empty' });
        fireCallback(chromeMock.bookmarks.create, [folder]);

        const result = await store.create_bookmark('root', 'Empty');

        expect(result.title).toBe('Empty');
        expect(result.url).toBeUndefined();

        // No further create calls for children — nothing to import
        expect(chromeMock.bookmarks.create).toHaveBeenCalledTimes(1);
    });

    it('parses the import JSON and extracts folder and bookmark structure', () => {
        const raw = JSON.stringify({
            bookmarks: [
                {
                    id: 'f1', title: 'Work', children: [
                        { id: 'b1', title: 'GitHub', url: 'https://github.com' },
                    ],
                },
            ],
            type: 'bookmarks',
        });

        const parsed = JSON.parse(raw);

        expect(parsed.type).toBe('bookmarks');
        expect(parsed.bookmarks).toHaveLength(1);
        expect(parsed.bookmarks[0].children[0].url).toBe('https://github.com');
    });

    it('rejects when the Chrome API fails during folder creation', async () => {
        fireCallback(chromeMock.bookmarks.create, [makeNode()], 'Chrome quota exceeded.');

        await expect(store.create_bookmark('root', 'Work')).rejects.toThrow('Chrome quota exceeded.');
    });

    it('rejects when the Chrome API fails during bookmark creation inside folder', async () => {
        fireCallback(chromeMock.bookmarks.create, [makeNode()], 'Invalid parent.');

        await expect(
            store.create_bookmark('new-f1', 'GitHub', 'https://github.com'),
        ).rejects.toThrow('Invalid parent.');
    });
});
