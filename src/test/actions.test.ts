import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBookmarksStore } from '@stores/bookmarks';
import { chromeMock, fireCallback, fireNoArgCallback, fireThreeArgCallback } from './mocks/chrome';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNode(overrides: Partial<chrome.bookmarks.BookmarkTreeNode> = {}): chrome.bookmarks.BookmarkTreeNode {
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

function makeTree(children: chrome.bookmarks.BookmarkTreeNode[] = []): chrome.bookmarks.BookmarkTreeNode[] {
    return [makeNode({ id: 'root', title: 'root', children })];
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let store: ReturnType<typeof useBookmarksStore>;

beforeEach(() => {
    setActivePinia(createPinia());
    store = useBookmarksStore();
});

// ---------------------------------------------------------------------------
// get_bookmarks
// ---------------------------------------------------------------------------

describe('get_bookmarks', () => {
    it('resolves with the bookmark tree for a given id', async () => {
        const tree = makeTree([makeNode({ id: '2', title: 'Child' })]);
        fireCallback(chromeMock.bookmarks.getSubTree, [tree]);

        const result = await store.get_bookmarks('root');

        expect(chromeMock.bookmarks.getSubTree).toHaveBeenCalledWith('root', expect.any(Function));
        expect(result).toEqual(tree);
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        fireCallback(chromeMock.bookmarks.getSubTree, [[]], 'Extension context invalidated.');

        await expect(store.get_bookmarks('root')).rejects.toThrow('Extension context invalidated.');
    });
});

// ---------------------------------------------------------------------------
// get_bookmarkById
// ---------------------------------------------------------------------------

describe('get_bookmarkById', () => {
    it('resolves with the first matching bookmark', async () => {
        const node = makeNode({ id: '42', title: 'My Bookmark' });
        fireCallback(chromeMock.bookmarks.get, [[node]]);

        const result = await store.get_bookmarkById('42');

        expect(result).toEqual(node);
    });

    it('rejects with "Bookmark not found" when the result array is empty', async () => {
        fireCallback(chromeMock.bookmarks.get, [[]]);

        await expect(store.get_bookmarkById('99')).rejects.toThrow('Bookmark not found');
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        fireCallback(chromeMock.bookmarks.get, [[]], 'Invalid bookmark ID.');

        await expect(store.get_bookmarkById('bad')).rejects.toThrow('Invalid bookmark ID.');
    });
});

// ---------------------------------------------------------------------------
// get_folderByTitle
// ---------------------------------------------------------------------------

describe('get_folderByTitle', () => {
    it('resolves with matching folder when title found', async () => {
        const folder = makeNode({ id: '5', title: 'My Shortcuts Tab', url: undefined });
        const tree = makeTree([folder]);
        fireCallback(chromeMock.bookmarks.getSubTree, [tree]);

        const result = await store.get_folderByTitle('root', 'My Shortcuts Tab');

        expect(result).toEqual([folder]);
    });

    it('resolves with empty array when folder title not found', async () => {
        const tree = makeTree([makeNode({ id: '5', title: 'Other Folder' })]);
        fireCallback(chromeMock.bookmarks.getSubTree, [tree]);

        const result = await store.get_folderByTitle('root', 'Missing Folder');

        expect(result).toEqual([]);
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        fireCallback(chromeMock.bookmarks.getSubTree, [[]], 'Subtree error.');

        await expect(store.get_folderByTitle('root', 'Any')).rejects.toThrow('Subtree error.');
    });
});

// ---------------------------------------------------------------------------
// create_bookmark
// ---------------------------------------------------------------------------

describe('create_bookmark', () => {
    it('resolves with the created bookmark', async () => {
        const created = makeNode({ id: '10', title: 'New Link', url: 'https://new.com' });
        fireCallback(chromeMock.bookmarks.create, [created]);

        const result = await store.create_bookmark('5', 'New Link', 'https://new.com');

        expect(chromeMock.bookmarks.create).toHaveBeenCalledWith(
            { parentId: '5', title: 'New Link', url: 'https://new.com' },
            expect.any(Function),
        );
        expect(result).toEqual(created);
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        fireCallback(chromeMock.bookmarks.create, [makeNode()], 'Cannot create bookmark here.');

        await expect(store.create_bookmark('5', 'Fail')).rejects.toThrow('Cannot create bookmark here.');
    });
});

// ---------------------------------------------------------------------------
// update_bookmark
// ---------------------------------------------------------------------------

describe('update_bookmark', () => {
    it('resolves with the updated bookmark', async () => {
        const updated = makeNode({ id: '3', title: 'Renamed' });
        fireThreeArgCallback(chromeMock.bookmarks.update, [updated]);

        const result = await store.update_bookmark('3', { title: 'Renamed' });

        expect(chromeMock.bookmarks.update).toHaveBeenCalledWith(
            '3',
            { title: 'Renamed', url: undefined },
            expect.any(Function),
        );
        expect(result.title).toBe('Renamed');
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        fireThreeArgCallback(chromeMock.bookmarks.update, [makeNode()], 'Update failed.');

        await expect(store.update_bookmark('3', { title: 'X' })).rejects.toThrow('Update failed.');
    });
});

// ---------------------------------------------------------------------------
// remove_bookmark
// ---------------------------------------------------------------------------

describe('remove_bookmark', () => {
    it('resolves with the removed bookmark id', async () => {
        fireCallback(chromeMock.bookmarks.remove, []);

        const result = await store.remove_bookmark('7');

        expect(chromeMock.bookmarks.remove).toHaveBeenCalledWith('7', expect.any(Function));
        expect(result).toBe('7');
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        fireCallback(chromeMock.bookmarks.remove, [], 'Cannot remove.');

        await expect(store.remove_bookmark('7')).rejects.toThrow('Cannot remove.');
    });
});

// ---------------------------------------------------------------------------
// remove_bookmarkFolder
// ---------------------------------------------------------------------------

describe('remove_bookmarkFolder', () => {
    it('resolves with the removed folder id', async () => {
        fireCallback(chromeMock.bookmarks.removeTree, []);

        const result = await store.remove_bookmarkFolder('4');

        expect(chromeMock.bookmarks.removeTree).toHaveBeenCalledWith('4', expect.any(Function));
        expect(result).toBe('4');
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        fireCallback(chromeMock.bookmarks.removeTree, [], 'Cannot remove tree.');

        await expect(store.remove_bookmarkFolder('4')).rejects.toThrow('Cannot remove tree.');
    });
});

// ---------------------------------------------------------------------------
// move_bookmark
// ---------------------------------------------------------------------------

describe('move_bookmark', () => {
    it('resolves after moving a bookmark to a new parent', async () => {
        fireThreeArgCallback(chromeMock.bookmarks.move, []);

        await expect(store.move_bookmark('3', { parentId: '10' })).resolves.toBeUndefined();
        expect(chromeMock.bookmarks.move).toHaveBeenCalledWith('3', { parentId: '10' }, expect.any(Function));
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        fireThreeArgCallback(chromeMock.bookmarks.move, [], 'Move failed.');

        await expect(store.move_bookmark('3', { parentId: '10' })).rejects.toThrow('Move failed.');
    });
});

// ---------------------------------------------------------------------------
// get_tree
// ---------------------------------------------------------------------------

describe('get_tree', () => {
    it('resolves with the full bookmark tree', async () => {
        const tree = makeTree();
        fireNoArgCallback(chromeMock.bookmarks.getTree, [tree]);

        const result = await store.get_tree();

        expect(result).toEqual(tree);
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        chromeMock.runtime.lastError = { message: 'Tree unavailable.' };
        chromeMock.bookmarks.getTree.mockImplementation((cb: () => void) => cb());

        await expect(store.get_tree()).rejects.toThrow('Tree unavailable.');
    });
});

// ---------------------------------------------------------------------------
// get_colorizedBookmarks
// ---------------------------------------------------------------------------

describe('get_colorizedBookmarks', () => {
    it('returns bookmark tree with folder and bookmark colors merged', async () => {
        const bookmark = makeNode({ id: 'bm1', url: 'https://a.com', children: undefined });
        const folder = makeNode({ id: 'f1', title: 'Folder', url: undefined, children: [bookmark] });
        const tree = makeTree([folder]);

        fireCallback(chromeMock.bookmarks.getSubTree, [tree]);
        chromeMock.storage.sync.get
            .mockResolvedValueOnce({ folderColors: { f1: '#ff0000' } })
            .mockResolvedValueOnce({ bookmarkColors: { bm1: '#0000ff' } });

        const result = await store.get_colorizedBookmarks('root');

        expect((result[0].children![0] as { color?: string }).color).toBe('#ff0000');
        expect((result[0].children![0].children![0] as { color?: string }).color).toBe('#0000ff');
    });

    it('returns unmodified tree when no colors are stored', async () => {
        const tree = makeTree([makeNode({ id: 'f1' })]);
        fireCallback(chromeMock.bookmarks.getSubTree, [tree]);
        chromeMock.storage.sync.get
            .mockResolvedValueOnce({ folderColors: null })
            .mockResolvedValueOnce({ bookmarkColors: null });

        const result = await store.get_colorizedBookmarks('root');

        expect(result[0].children![0]).not.toHaveProperty('color');
    });

    it('propagates rejection when get_bookmarks fails', async () => {
        fireCallback(chromeMock.bookmarks.getSubTree, [[]], 'Subtree error.');

        await expect(store.get_colorizedBookmarks('root')).rejects.toThrow('Subtree error.');
    });
});

// ---------------------------------------------------------------------------
// localStorage / syncStorage wrappers
// ---------------------------------------------------------------------------

describe('set_localStorage', () => {
    it('calls chrome.storage.local.set with the provided object', async () => {
        await store.set_localStorage({ myKey: 'myValue' });

        expect(chromeMock.storage.local.set).toHaveBeenCalledWith({ myKey: 'myValue' });
    });
});

describe('get_localStorage', () => {
    it('resolves with the value for the given key', async () => {
        chromeMock.storage.local.get.mockResolvedValue({ rootId: 'abc123' });

        const result = await store.get_localStorage('rootId');

        expect(result).toBe('abc123');
    });

    it('resolves with undefined when key is not present', async () => {
        chromeMock.storage.local.get.mockResolvedValue({});

        const result = await store.get_localStorage('missing');

        expect(result).toBeUndefined();
    });
});

describe('get_syncStorage', () => {
    it('resolves with the value for the given key', async () => {
        chromeMock.storage.sync.get.mockResolvedValue({ sliderIndex: 3 });

        const result = await store.get_syncStorage('sliderIndex');

        expect(result).toBe(3);
    });
});

describe('delete_localStorageItem', () => {
    it('resolves when item is removed without error', async () => {
        chromeMock.storage.local.remove.mockImplementation((_keys: string[], cb: () => void) => {
            chromeMock.runtime.lastError = undefined;
            cb();
        });

        await expect(store.delete_localStorageItem('someKey')).resolves.toBeUndefined();
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        chromeMock.storage.local.remove.mockImplementation((_keys: string[], cb: () => void) => {
            chromeMock.runtime.lastError = { message: 'Remove failed.' };
            cb();
        });

        await expect(store.delete_localStorageItem('someKey')).rejects.toMatchObject({ message: 'Remove failed.' });
    });
});
