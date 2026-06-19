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
        syncing: false,
        dateAdded: Date.now(),
        children: [],
        ...overrides,
    };
}

function makeTree(children: chrome.bookmarks.BookmarkTreeNode[] = []): chrome.bookmarks.BookmarkTreeNode[] {
    return [makeNode({ id: 'root', title: 'root', children })];
}

function makeFolder(overrides: Partial<chrome.bookmarks.BookmarkTreeNode> = {}): chrome.bookmarks.BookmarkTreeNode {
    return makeNode({ url: undefined, children: [], ...overrides });
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
// getBookmarks
// ---------------------------------------------------------------------------

describe('getBookmarks', () => {
    it('resolves with the bookmark tree for a given id', async () => {
        const tree = makeTree([makeNode({ id: '2', title: 'Child' })]);
        fireCallback(chromeMock.bookmarks.getSubTree, [tree]);

        const result = await store.getBookmarks('root');

        expect(chromeMock.bookmarks.getSubTree).toHaveBeenCalledWith('root', expect.any(Function));
        expect(result).toEqual(tree);
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        fireCallback(chromeMock.bookmarks.getSubTree, [[]], 'Extension context invalidated.');

        await expect(store.getBookmarks('root')).rejects.toThrow('Extension context invalidated.');
    });
});

// ---------------------------------------------------------------------------
// getBookmarkById
// ---------------------------------------------------------------------------

describe('getBookmarkById', () => {
    it('resolves with the first matching bookmark', async () => {
        const node = makeNode({ id: '42', title: 'My Bookmark' });
        fireCallback(chromeMock.bookmarks.get, [[node]]);

        const result = await store.getBookmarkById('42');

        expect(result).toEqual(node);
    });

    it('rejects with "Bookmark not found" when the result array is empty', async () => {
        fireCallback(chromeMock.bookmarks.get, [[]]);

        await expect(store.getBookmarkById('99')).rejects.toThrow('Bookmark not found');
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        fireCallback(chromeMock.bookmarks.get, [[]], 'Invalid bookmark ID.');

        await expect(store.getBookmarkById('bad')).rejects.toThrow('Invalid bookmark ID.');
    });
});

// ---------------------------------------------------------------------------
// getFolderByTitle
// ---------------------------------------------------------------------------

describe('getFolderByTitle', () => {
    it('resolves with matching folder when title found', async () => {
        const folder = makeNode({ id: '5', title: 'My Shortcuts Tab', url: undefined });
        const tree = makeTree([folder]);
        fireCallback(chromeMock.bookmarks.getSubTree, [tree]);

        const result = await store.getFolderByTitle('root', 'My Shortcuts Tab');

        expect(result).toEqual([folder]);
    });

    it('resolves with empty array when folder title not found', async () => {
        const tree = makeTree([makeNode({ id: '5', title: 'Other Folder' })]);
        fireCallback(chromeMock.bookmarks.getSubTree, [tree]);

        const result = await store.getFolderByTitle('root', 'Missing Folder');

        expect(result).toEqual([]);
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        fireCallback(chromeMock.bookmarks.getSubTree, [[]], 'Subtree error.');

        await expect(store.getFolderByTitle('root', 'Any')).rejects.toThrow('Subtree error.');
    });
});

// ---------------------------------------------------------------------------
// createBookmark
// ---------------------------------------------------------------------------

describe('createBookmark', () => {
    it('resolves with the created bookmark', async () => {
        const created = makeNode({ id: '10', title: 'New Link', url: 'https://new.com' });
        fireCallback(chromeMock.bookmarks.create, [created]);

        const result = await store.createBookmark('5', 'New Link', 'https://new.com');

        expect(chromeMock.bookmarks.create).toHaveBeenCalledWith(
            { parentId: '5', title: 'New Link', url: 'https://new.com' },
            expect.any(Function),
        );
        expect(result).toEqual(created);
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        fireCallback(chromeMock.bookmarks.create, [makeNode()], 'Cannot create bookmark here.');

        await expect(store.createBookmark('5', 'Fail')).rejects.toThrow('Cannot create bookmark here.');
    });
});

// ---------------------------------------------------------------------------
// updateBookmark
// ---------------------------------------------------------------------------

describe('updateBookmark', () => {
    it('resolves with the updated bookmark', async () => {
        const updated = makeNode({ id: '3', title: 'Renamed' });
        fireThreeArgCallback(chromeMock.bookmarks.update, [updated]);

        const result = await store.updateBookmark('3', { title: 'Renamed' });

        expect(chromeMock.bookmarks.update).toHaveBeenCalledWith(
            '3',
            { title: 'Renamed', url: undefined },
            expect.any(Function),
        );
        expect(result.title).toBe('Renamed');
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        fireThreeArgCallback(chromeMock.bookmarks.update, [makeNode()], 'Update failed.');

        await expect(store.updateBookmark('3', { title: 'X' })).rejects.toThrow('Update failed.');
    });
});

// ---------------------------------------------------------------------------
// removeBookmark
// ---------------------------------------------------------------------------

describe('removeBookmark', () => {
    it('resolves with the removed bookmark id', async () => {
        fireCallback(chromeMock.bookmarks.remove, []);

        const result = await store.removeBookmark('7');

        expect(chromeMock.bookmarks.remove).toHaveBeenCalledWith('7', expect.any(Function));
        expect(result).toBe('7');
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        fireCallback(chromeMock.bookmarks.remove, [], 'Cannot remove.');

        await expect(store.removeBookmark('7')).rejects.toThrow('Cannot remove.');
    });
});

// ---------------------------------------------------------------------------
// removeBookmarkFolder
// ---------------------------------------------------------------------------

describe('removeBookmarkFolder', () => {
    it('resolves with the removed folder id', async () => {
        fireCallback(chromeMock.bookmarks.removeTree, []);

        const result = await store.removeBookmarkFolder('4');

        expect(chromeMock.bookmarks.removeTree).toHaveBeenCalledWith('4', expect.any(Function));
        expect(result).toBe('4');
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        fireCallback(chromeMock.bookmarks.removeTree, [], 'Cannot remove tree.');

        await expect(store.removeBookmarkFolder('4')).rejects.toThrow('Cannot remove tree.');
    });
});

// ---------------------------------------------------------------------------
// moveBookmark
// ---------------------------------------------------------------------------

describe('moveBookmark', () => {
    it('resolves after moving a bookmark to a new parent', async () => {
        fireThreeArgCallback(chromeMock.bookmarks.move, []);

        await expect(store.moveBookmark('3', { parentId: '10' })).resolves.toBeUndefined();
        expect(chromeMock.bookmarks.move).toHaveBeenCalledWith('3', { parentId: '10' }, expect.any(Function));
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        fireThreeArgCallback(chromeMock.bookmarks.move, [], 'Move failed.');

        await expect(store.moveBookmark('3', { parentId: '10' })).rejects.toThrow('Move failed.');
    });
});

// ---------------------------------------------------------------------------
// createBookmarkGroup
// ---------------------------------------------------------------------------

describe('createBookmarkGroup', () => {
    it('creates a group folder and moves both bookmarks into it', async () => {
        const dragged = makeNode({ id: 'b1', parentId: 'f1', title: 'A' });
        const target = makeNode({ id: 'b2', parentId: 'f1', title: 'B' });
        const parent = makeFolder({ id: 'f1', title: 'Parent' });
        const createdGroup = makeFolder({ id: 'g1', parentId: 'f1', title: 'Group' });

        chromeMock.bookmarks.get.mockImplementation((id: string, cb: (result: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
            if (id === 'f1') cb([parent]);
            if (id === 'b1') cb([dragged]);
            if (id === 'b2') cb([target]);
        });

        fireCallback(chromeMock.bookmarks.create, [createdGroup]);
        fireThreeArgCallback(chromeMock.bookmarks.move, []);

        const result = await store.createBookmarkGroup('f1', 'b1', 'b2');

        expect(result.id).toBe('g1');
        expect(chromeMock.bookmarks.create).toHaveBeenCalledWith(
            expect.objectContaining({
                parentId: 'f1',
                title: 'Group',
                index: target.index,
            }),
            expect.any(Function),
        );
        // The new group's id is registered in the groupIds map.
        expect(store.groupIds).toEqual({ g1: true });
        // And persisted to chrome.storage.sync.
        expect(chromeMock.storage.sync.set).toHaveBeenCalledWith({ groupIds: { g1: true } });
        expect(chromeMock.bookmarks.move).toHaveBeenCalledWith(
            'b2',
            { parentId: 'g1', index: 0 },
            expect.any(Function),
        );
        expect(chromeMock.bookmarks.move).toHaveBeenCalledWith(
            'b1',
            { parentId: 'g1', index: 1 },
            expect.any(Function),
        );
    });

    it('rejects when one of the nodes is a folder', async () => {
        const dragged = makeFolder({ id: 'b1', parentId: 'f1' });
        const target = makeNode({ id: 'b2', parentId: 'f1', title: 'B' });
        const parent = makeFolder({ id: 'f1', title: 'Parent' });

        chromeMock.bookmarks.get.mockImplementation((id: string, cb: (result: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
            if (id === 'f1') cb([parent]);
            if (id === 'b1') cb([dragged]);
            if (id === 'b2') cb([target]);
        });

        await expect(store.createBookmarkGroup('f1', 'b1', 'b2')).rejects
            .toThrow('Only bookmark links can be grouped');
    });

    it('rejects when dragged and target ids are identical', async () => {
        await expect(store.createBookmarkGroup('f1', 'b1', 'b1')).rejects
            .toThrow('Cannot group the same bookmark');
        // No Chrome lookups should happen — the guard short-circuits.
        expect(chromeMock.bookmarks.get).not.toHaveBeenCalled();
        expect(chromeMock.bookmarks.create).not.toHaveBeenCalled();
    });

    it('rejects when the two bookmarks live in different parent folders', async () => {
        const dragged = makeNode({ id: 'b1', parentId: 'f1', title: 'A' });
        const target = makeNode({ id: 'b2', parentId: 'f2', title: 'B' });
        const parent = makeFolder({ id: 'f1', title: 'Parent' });

        chromeMock.bookmarks.get.mockImplementation((id: string, cb: (r: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
            if (id === 'f1') cb([parent]);
            if (id === 'b1') cb([dragged]);
            if (id === 'b2') cb([target]);
        });

        await expect(store.createBookmarkGroup('f1', 'b1', 'b2')).rejects
            .toThrow('Bookmarks must have the same parent folder');
        expect(chromeMock.bookmarks.create).not.toHaveBeenCalled();
    });

    it('rejects when the parent itself is already a group folder (no nested groups)', async () => {
        const dragged = makeNode({ id: 'b1', parentId: 'g1', title: 'A' });
        const target = makeNode({ id: 'b2', parentId: 'g1', title: 'B' });
        const groupParent = makeFolder({
            id: 'g1',
            title: 'Group',
        });

        // Register the parent in groupIds so isGroupFolder() returns true.
        store.groupIds = { g1: true };

        chromeMock.bookmarks.get.mockImplementation((id: string, cb: (r: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
            if (id === 'g1') cb([groupParent]);
            if (id === 'b1') cb([dragged]);
            if (id === 'b2') cb([target]);
        });

        await expect(store.createBookmarkGroup('g1', 'b1', 'b2')).rejects
            .toThrow('Nested groups are not allowed');
        expect(chromeMock.bookmarks.create).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// addBookmarkToGroup
// ---------------------------------------------------------------------------

describe('addBookmarkToGroup', () => {
    beforeEach(() => {
        store.groupIds = { g1: true };
    });

    it('moves a bookmark into a group when below max capacity', async () => {
        const groupFolder = makeFolder({
            id: 'g1',
            title: 'Group',
            children: [
                makeNode({ id: 'b1', parentId: 'g1' }),
            ],
        });
        const bookmark = makeNode({ id: 'b2', parentId: 'f1' });

        chromeMock.bookmarks.get.mockImplementation((id: string, cb: (result: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
            if (id === 'g1') cb([groupFolder]);
            if (id === 'b2') cb([bookmark]);
        });

        fireThreeArgCallback(chromeMock.bookmarks.move, []);

        await expect(store.addBookmarkToGroup('g1', 'b2')).resolves.toBeUndefined();
        expect(chromeMock.bookmarks.move).toHaveBeenCalledWith(
            'b2',
            { parentId: 'g1', index: 1 },
            expect.any(Function),
        );
    });

    it('rejects when target group is already full', async () => {
        const groupChildren = Array.from({ length: 9 }, (_v, i) => makeNode({
            id: `b${i}`,
            parentId: 'g1',
        }));

        const groupFolder = makeFolder({
            id: 'g1',
            title: 'Group',
            children: groupChildren,
        });
        const bookmark = makeNode({ id: 'new', parentId: 'f1' });

        chromeMock.bookmarks.get.mockImplementation((id: string, cb: (result: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
            if (id === 'g1') cb([groupFolder]);
            if (id === 'new') cb([bookmark]);
        });

        await expect(store.addBookmarkToGroup('g1', 'new')).rejects
            .toThrow('Bookmark group is full');
    });

    it('rejects when the target is a non-group folder', async () => {
        // Not registered in groupIds, so isGroupFolder returns false.
        store.groupIds = {};
        const regularFolder = makeFolder({ id: 'f1', title: 'Regular' });
        const bookmark = makeNode({ id: 'b1', parentId: 'fx' });

        chromeMock.bookmarks.get.mockImplementation((id: string, cb: (r: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
            if (id === 'f1') cb([regularFolder]);
            if (id === 'b1') cb([bookmark]);
        });

        await expect(store.addBookmarkToGroup('f1', 'b1')).rejects
            .toThrow('Target is not a bookmark group');
        expect(chromeMock.bookmarks.move).not.toHaveBeenCalled();
    });

    it('rejects when the bookmark being added is itself a folder', async () => {
        const groupFolder = makeFolder({ id: 'g1', title: 'Group', children: [] });
        const folderBeingDragged = makeFolder({ id: 'f1', title: 'Folder', parentId: 'root' });

        chromeMock.bookmarks.get.mockImplementation((id: string, cb: (r: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
            if (id === 'g1') cb([groupFolder]);
            if (id === 'f1') cb([folderBeingDragged]);
        });

        await expect(store.addBookmarkToGroup('g1', 'f1')).rejects
            .toThrow('Only bookmark links can be grouped');
        expect(chromeMock.bookmarks.move).not.toHaveBeenCalled();
    });

    it('is a no-op when the bookmark is already inside the target group', async () => {
        const groupFolder = makeFolder({
            id: 'g1',
            title: 'Group',
            children: [makeNode({ id: 'b1', parentId: 'g1' })],
        });
        // Critical: bookmark.parentId === groupFolderId triggers the early return.
        const bookmark = makeNode({ id: 'b1', parentId: 'g1' });

        chromeMock.bookmarks.get.mockImplementation((id: string, cb: (r: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
            if (id === 'g1') cb([groupFolder]);
            if (id === 'b1') cb([bookmark]);
        });

        await expect(store.addBookmarkToGroup('g1', 'b1')).resolves.toBeUndefined();
        expect(chromeMock.bookmarks.move).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// ungroupBookmarkGroup
// ---------------------------------------------------------------------------

describe('ungroupBookmarkGroup', () => {
    beforeEach(() => {
        store.groupIds = { g1: true };
        // persistGroupIds() will call chrome.storage.sync.remove when the
        // groupIds map ends up empty; make sure the callback fires so the
        // promise resolves.
        chromeMock.storage.sync.remove.mockImplementation((_keys: string[], cb?: () => void) => {
            if (cb) cb();
        });
    });

    it('moves grouped links back to parent and removes the group folder', async () => {
        const groupedFolder = makeFolder({
            id: 'g1',
            title: 'Group',
            parentId: 'f1',
            index: 2,
            children: [
                makeNode({ id: 'b1', parentId: 'g1' }),
                makeNode({ id: 'b2', parentId: 'g1' }),
            ],
        });

        chromeMock.bookmarks.getSubTree.mockImplementation((id: string, cb: (result: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
            if (id === 'g1') cb([groupedFolder]);
        });

        fireThreeArgCallback(chromeMock.bookmarks.move, []);
        fireCallback(chromeMock.bookmarks.removeTree, []);

        await expect(store.ungroupBookmarkGroup('g1')).resolves.toBeUndefined();

        expect(chromeMock.bookmarks.move).toHaveBeenCalledWith(
            'b1',
            { parentId: 'f1', index: 2 },
            expect.any(Function),
        );
        expect(chromeMock.bookmarks.move).toHaveBeenCalledWith(
            'b2',
            { parentId: 'f1', index: 3 },
            expect.any(Function),
        );
        expect(chromeMock.bookmarks.removeTree).toHaveBeenCalledWith('g1', expect.any(Function));
        // The unregistered id is removed from the groupIds map.
        expect(store.groupIds).toEqual({});
        // And persisted (with the key deleted when the map is empty).
        expect(chromeMock.storage.sync.remove).toHaveBeenCalled();
    });

    it('is a no-op when the target id is not actually a group folder', async () => {
        store.groupIds = {};
        const regularFolder = makeFolder({ id: 'reg', title: 'Regular', parentId: 'root' });
        chromeMock.bookmarks.getSubTree.mockImplementation((id: string, cb: (r: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
            if (id === 'reg') cb([regularFolder]);
        });

        await expect(store.ungroupBookmarkGroup('reg')).resolves.toBeUndefined();
        expect(chromeMock.bookmarks.move).not.toHaveBeenCalled();
        expect(chromeMock.bookmarks.removeTree).not.toHaveBeenCalled();
    });

    it('is a no-op when the group folder has no parentId (e.g. it has been detached)', async () => {
        const orphan = makeFolder({
            id: 'g1',
            title: 'Group',
            parentId: undefined,
            children: [makeNode({ id: 'b1' })],
        });
        chromeMock.bookmarks.getSubTree.mockImplementation((id: string, cb: (r: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
            if (id === 'g1') cb([orphan]);
        });

        await expect(store.ungroupBookmarkGroup('g1')).resolves.toBeUndefined();
        expect(chromeMock.bookmarks.move).not.toHaveBeenCalled();
        expect(chromeMock.bookmarks.removeTree).not.toHaveBeenCalled();
    });

    it('only re-inserts link children, skipping any nested folder children defensively', async () => {
        const grouped = makeFolder({
            id: 'g1',
            title: 'Group',
            parentId: 'f1',
            index: 5,
            children: [
                makeNode({ id: 'b1', parentId: 'g1' }),
                // A folder child should NOT be re-inserted (groups should never
                // contain folders, but the ungroup logic must defend against it).
                makeFolder({ id: 'sub', parentId: 'g1', title: 'Sub' }),
                makeNode({ id: 'b2', parentId: 'g1' }),
            ],
        });

        chromeMock.bookmarks.getSubTree.mockImplementation((id: string, cb: (r: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
            if (id === 'g1') cb([grouped]);
        });
        fireThreeArgCallback(chromeMock.bookmarks.move, []);
        fireCallback(chromeMock.bookmarks.removeTree, []);

        await store.ungroupBookmarkGroup('g1');

        // Only b1 + b2 should be moved (folder child is skipped).
        const moveCalls = chromeMock.bookmarks.move.mock.calls.map((c) => c[0]);
        expect(moveCalls).toEqual(['b1', 'b2']);

        // Indices should be sequential starting at the group folder's original index.
        expect(chromeMock.bookmarks.move).toHaveBeenCalledWith(
            'b1',
            { parentId: 'f1', index: 5 },
            expect.any(Function),
        );
        expect(chromeMock.bookmarks.move).toHaveBeenCalledWith(
            'b2',
            { parentId: 'f1', index: 6 },
            expect.any(Function),
        );
    });
});

// ---------------------------------------------------------------------------
// renameBookmarkGroup
// ---------------------------------------------------------------------------

describe('renameBookmarkGroup', () => {
    beforeEach(() => {
        store.groupIds = { g1: true };
    });

    it('updates the Chrome folder title when the id is a registered group', async () => {
        const updated = makeFolder({ id: 'g1', title: 'My Stuff' });
        fireThreeArgCallback(chromeMock.bookmarks.update, [updated]);

        const result = await store.renameBookmarkGroup('g1', '  My Stuff  ');

        expect(result?.title).toBe('My Stuff');
        expect(chromeMock.bookmarks.update).toHaveBeenCalledWith(
            'g1',
            { title: 'My Stuff' },
            expect.any(Function),
        );
    });

    it('falls back to the default name when the input is empty', async () => {
        const updated = makeFolder({ id: 'g1', title: 'Group' });
        fireThreeArgCallback(chromeMock.bookmarks.update, [updated]);

        await store.renameBookmarkGroup('g1', '   ');

        expect(chromeMock.bookmarks.update).toHaveBeenCalledWith(
            'g1',
            { title: 'Group' },
            expect.any(Function),
        );
    });

    it('returns null and does not call Chrome when the id is not a registered group', async () => {
        store.groupIds = {};
        const result = await store.renameBookmarkGroup('not-a-group', 'Whatever');
        expect(result).toBeNull();
        expect(chromeMock.bookmarks.update).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// migrateLegacyGroupFolders
// ---------------------------------------------------------------------------

describe('migrateLegacyGroupFolders', () => {
    it('registers legacy-prefixed folders in groupIds and renames them to the default name', async () => {
        store.rootId = 'root';
        const legacy = makeFolder({
            id: 'leg1',
            title: '__mst_group__:abc',
            parentId: 'f1',
        });
        const regular = makeFolder({
            id: 'reg',
            title: 'Regular Folder',
            parentId: 'f1',
        });
        const tree = makeTree([
            { ...makeFolder({ id: 'f1', title: 'F1' }), children: [legacy, regular] },
        ]);

        fireCallback(chromeMock.bookmarks.getSubTree, [tree]);
        fireThreeArgCallback(chromeMock.bookmarks.update, [makeFolder({ id: 'leg1', title: 'Group' })]);

        await store.migrateLegacyGroupFolders();

        expect(store.groupIds).toEqual({ leg1: true });
        expect(chromeMock.bookmarks.update).toHaveBeenCalledWith(
            'leg1',
            { title: 'Group' },
            expect.any(Function),
        );
        expect(chromeMock.storage.sync.set).toHaveBeenCalledWith({ groupIds: { leg1: true } });
    });

    it('is a no-op when no legacy folders are present', async () => {
        store.rootId = 'root';
        const tree = makeTree([makeFolder({ id: 'f1', title: 'F1' })]);
        fireCallback(chromeMock.bookmarks.getSubTree, [tree]);

        await store.migrateLegacyGroupFolders();

        expect(chromeMock.bookmarks.update).not.toHaveBeenCalled();
        expect(chromeMock.storage.sync.set).not.toHaveBeenCalled();
    });

    it('does nothing when rootId is unset', async () => {
        store.rootId = null;
        await store.migrateLegacyGroupFolders();
        expect(chromeMock.bookmarks.getSubTree).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// collapseEmptyGroups
// Walks the in-memory tree and ungroups any group folder whose link children
// have all been removed (e.g. after a bookmark is dragged out via the popup).
// ---------------------------------------------------------------------------

describe('collapseEmptyGroups', () => {
    it('ungroups empty group folders and leaves populated ones alone', async () => {
        const emptyGroup = makeFolder({
            id: 'g-empty', title: 'Group', parentId: 'f1', index: 0, children: [],
        });
        const fullGroup = makeFolder({
            id: 'g-full',
            title: 'Group',
            parentId: 'f1',
            index: 1,
            children: [makeNode({ id: 'b1', parentId: 'g-full' })],
        });

        store.groupIds = { 'g-empty': true, 'g-full': true };
        store.bookmarks = [
            { ...makeFolder({ id: 'f1', title: 'F1' }), children: [emptyGroup, fullGroup] },
        ] as unknown as typeof store.bookmarks;

        chromeMock.bookmarks.getSubTree.mockImplementation((id: string, cb: (r: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
            if (id === 'g-empty') cb([emptyGroup]);
            if (id === 'g-full') cb([fullGroup]);
        });
        chromeMock.bookmarks.get.mockImplementation((id: string, cb: (r: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
            if (id === 'g-empty') cb([emptyGroup]);
        });
        fireCallback(chromeMock.bookmarks.removeTree, []);

        await store.collapseEmptyGroups();

        // Only the empty group should be removed.
        expect(chromeMock.bookmarks.removeTree).toHaveBeenCalledTimes(1);
        expect(chromeMock.bookmarks.removeTree).toHaveBeenCalledWith('g-empty', expect.any(Function));
    });

    it('also collapses groups whose only remaining children are non-link nodes', async () => {
        // Group still has a child but it has no url, so it counts as empty
        // for collapse purposes.
        const stragglerGroup = makeFolder({
            id: 'g1',
            title: 'Group',
            parentId: 'f1',
            index: 0,
            children: [makeFolder({ id: 'sub', parentId: 'g1', title: 'sub' })],
        });

        store.groupIds = { g1: true };
        store.bookmarks = [
            { ...makeFolder({ id: 'f1', title: 'F1' }), children: [stragglerGroup] },
        ] as unknown as typeof store.bookmarks;

        chromeMock.bookmarks.getSubTree.mockImplementation((id: string, cb: (r: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
            if (id === 'g1') cb([stragglerGroup]);
        });
        chromeMock.bookmarks.get.mockImplementation((id: string, cb: (r: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
            if (id === 'g1') cb([stragglerGroup]);
        });
        fireCallback(chromeMock.bookmarks.removeTree, []);

        await store.collapseEmptyGroups();

        expect(chromeMock.bookmarks.removeTree).toHaveBeenCalledWith('g1', expect.any(Function));
    });

    it('does nothing when store has no group folders at all', async () => {
        store.bookmarks = [
            { ...makeFolder({ id: 'f1', title: 'F1' }), children: [makeNode({ id: 'b1' })] },
        ] as unknown as typeof store.bookmarks;

        await store.collapseEmptyGroups();

        expect(chromeMock.bookmarks.removeTree).not.toHaveBeenCalled();
        expect(chromeMock.bookmarks.move).not.toHaveBeenCalled();
    });

    it('tolerates an empty / unset bookmarks array', async () => {
        store.bookmarks = null;
        await expect(store.collapseEmptyGroups()).resolves.toBeUndefined();
        expect(chromeMock.bookmarks.removeTree).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// getTree
// ---------------------------------------------------------------------------

describe('getTree', () => {
    it('resolves with the full bookmark tree', async () => {
        const tree = makeTree();
        fireNoArgCallback(chromeMock.bookmarks.getTree, [tree]);

        const result = await store.getTree();

        expect(result).toEqual(tree);
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        chromeMock.runtime.lastError = { message: 'Tree unavailable.' };
        chromeMock.bookmarks.getTree.mockImplementation((cb: () => void) => cb());

        await expect(store.getTree()).rejects.toThrow('Tree unavailable.');
    });
});

// ---------------------------------------------------------------------------
// getColorizedBookmarks
// ---------------------------------------------------------------------------

describe('getColorizedBookmarks', () => {
    it('returns bookmark tree with folder and bookmark colors merged', async () => {
        const bookmark = makeNode({ id: 'bm1', url: 'https://a.com', children: undefined });
        const folder = makeNode({ id: 'f1', title: 'Folder', url: undefined, children: [bookmark] });
        const tree = makeTree([folder]);

        fireCallback(chromeMock.bookmarks.getSubTree, [tree]);
        chromeMock.storage.sync.get
            .mockResolvedValueOnce({ folderColors: { f1: '#ff0000' } })
            .mockResolvedValueOnce({ bookmarkColors: { bm1: '#0000ff' } });

        const result = await store.getColorizedBookmarks('root');

        expect((result[0].children?.[0] as { color?: string }).color).toBe('#ff0000');
        expect((result[0].children?.[0].children?.[0] as { color?: string }).color).toBe('#0000ff');
    });

    it('returns unmodified tree when no colors are stored', async () => {
        const tree = makeTree([makeNode({ id: 'f1' })]);
        fireCallback(chromeMock.bookmarks.getSubTree, [tree]);
        chromeMock.storage.sync.get
            .mockResolvedValueOnce({ folderColors: null })
            .mockResolvedValueOnce({ bookmarkColors: null });

        const result = await store.getColorizedBookmarks('root');

        expect(result[0].children?.[0]).not.toHaveProperty('color');
    });

    it('propagates rejection when getBookmarks fails', async () => {
        fireCallback(chromeMock.bookmarks.getSubTree, [[]], 'Subtree error.');

        await expect(store.getColorizedBookmarks('root')).rejects.toThrow('Subtree error.');
    });
});

// ---------------------------------------------------------------------------
// localStorage / syncStorage wrappers
// ---------------------------------------------------------------------------

describe('setLocalStorage', () => {
    it('calls chrome.storage.local.set with the provided object', async () => {
        await store.setLocalStorage({ myKey: 'myValue' });

        expect(chromeMock.storage.local.set).toHaveBeenCalledWith({ myKey: 'myValue' });
    });
});

describe('getLocalStorage', () => {
    it('resolves with the value for the given key', async () => {
        chromeMock.storage.local.get.mockResolvedValue({ rootId: 'abc123' });

        const result = await store.getLocalStorage('rootId');

        expect(result).toBe('abc123');
    });

    it('resolves with undefined when key is not present', async () => {
        chromeMock.storage.local.get.mockResolvedValue({});

        const result = await store.getLocalStorage('missing');

        expect(result).toBeUndefined();
    });
});

describe('getSyncStorage', () => {
    it('resolves with the value for the given key', async () => {
        chromeMock.storage.sync.get.mockResolvedValue({ darkMode: 3 });

        const result = await store.getSyncStorage('darkMode');

        expect(result).toBe(3);
    });
});

describe('deleteLocalStorageItem', () => {
    it('resolves when item is removed without error', async () => {
        chromeMock.storage.local.remove.mockImplementation((_keys: string[], cb: () => void) => {
            chromeMock.runtime.lastError = undefined;
            cb();
        });

        await expect(store.deleteLocalStorageItem('someKey')).resolves.toBeUndefined();
    });

    it('rejects when chrome.runtime.lastError is set', async () => {
        chromeMock.storage.local.remove.mockImplementation((_keys: string[], cb: () => void) => {
            chromeMock.runtime.lastError = { message: 'Remove failed.' };
            cb();
        });

        await expect(store.deleteLocalStorageItem('someKey')).rejects.toMatchObject({ message: 'Remove failed.' });
    });
});
