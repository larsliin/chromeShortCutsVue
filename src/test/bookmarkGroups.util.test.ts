import { describe, it, expect } from 'vitest';
import { GROUPING } from '@/constants';
import type { BookmarkNode } from '@/types/bookmark';
import {
    isGroupFolder,
    isBookmarkLink,
    createGroupFolderTitle,
    getGroupPreviewItems,
    flattenBookmarkLinks,
    findNodeById,
    isGroupName,
} from '@utils/bookmarkGroups';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function node(overrides: Partial<BookmarkNode> = {}): BookmarkNode {
    return {
        id: '1',
        title: 'n',
        index: 0,
        dateAdded: 0,
        syncing: false,
        ...overrides,
    } as BookmarkNode;
}

function link(id: string, overrides: Partial<BookmarkNode> = {}): BookmarkNode {
    return node({ id, url: `https://${id}.com`, title: id, ...overrides });
}

function group(id: string, children: BookmarkNode[] = []): BookmarkNode {
    return node({
        id,
        title: `${GROUPING.FOLDER_PREFIX}${id}`,
        children,
    });
}

function folder(id: string, children: BookmarkNode[] = []): BookmarkNode {
    return node({ id, title: `Folder ${id}`, children });
}

// ---------------------------------------------------------------------------
// isGroupFolder / isBookmarkLink / isGroupName
// ---------------------------------------------------------------------------

describe('isGroupFolder', () => {
    it('returns true for a folder whose title starts with the GROUPING prefix', () => {
        expect(isGroupFolder(group('g1'))).toBe(true);
    });

    it('returns false for a regular folder', () => {
        expect(isGroupFolder(folder('f1'))).toBe(false);
    });

    it('returns false for a link even if its title starts with the prefix', () => {
        // A link must be excluded — only URL-less nodes are folders.
        const fake = link('x', { title: `${GROUPING.FOLDER_PREFIX}fake` });
        expect(isGroupFolder(fake)).toBe(false);
    });

    it('returns false for a folder whose title does not start with the prefix', () => {
        const f = node({ id: 'f', title: `prefix-${GROUPING.FOLDER_PREFIX}wrong` });
        expect(isGroupFolder(f)).toBe(false);
    });
});

describe('isBookmarkLink', () => {
    it('returns true for any node with a url', () => {
        expect(isBookmarkLink(link('a'))).toBe(true);
    });

    it('returns false for a node without a url', () => {
        expect(isBookmarkLink(folder('f'))).toBe(false);
    });

    it('returns false for a node with an empty-string url (Chrome treats it as folder)', () => {
        expect(isBookmarkLink(node({ id: 'x', url: '' }))).toBe(false);
    });
});

describe('isGroupName', () => {
    it('returns true when title starts with the GROUPING prefix', () => {
        expect(isGroupName(`${GROUPING.FOLDER_PREFIX}abc`)).toBe(true);
    });

    it('returns false otherwise', () => {
        expect(isGroupName('My Folder')).toBe(false);
        expect(isGroupName('')).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// createGroupFolderTitle
// ---------------------------------------------------------------------------

describe('createGroupFolderTitle', () => {
    it('starts with the GROUPING prefix', () => {
        expect(createGroupFolderTitle().startsWith(GROUPING.FOLDER_PREFIX)).toBe(true);
    });

    it('produces a value isGroupName recognises', () => {
        expect(isGroupName(createGroupFolderTitle())).toBe(true);
    });

    it('appends a non-empty suffix after the prefix', () => {
        const title = createGroupFolderTitle();
        const suffix = title.slice(GROUPING.FOLDER_PREFIX.length);
        expect(suffix.length).toBeGreaterThan(0);
    });
});

// ---------------------------------------------------------------------------
// getGroupPreviewItems
// ---------------------------------------------------------------------------

describe('getGroupPreviewItems', () => {
    it('returns all link children when below PREVIEW_ITEMS', () => {
        const g = group('g', [link('a'), link('b')]);
        const preview = getGroupPreviewItems(g);
        expect(preview.map((n) => n.id)).toEqual(['a', 'b']);
    });

    it('caps the preview at GROUPING.PREVIEW_ITEMS', () => {
        const children = Array.from({ length: GROUPING.PREVIEW_ITEMS + 5 }, (_, i) => link(`l${i}`));
        const preview = getGroupPreviewItems(group('g', children));
        expect(preview).toHaveLength(GROUPING.PREVIEW_ITEMS);
    });

    it('filters out non-link children (e.g. accidental nested folders)', () => {
        const g = group('g', [link('a'), folder('nested'), link('b')]);
        expect(getGroupPreviewItems(g).map((n) => n.id)).toEqual(['a', 'b']);
    });

    it('returns an empty array when children is undefined', () => {
        const g = node({ id: 'g', title: `${GROUPING.FOLDER_PREFIX}g` });
        expect(getGroupPreviewItems(g)).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// flattenBookmarkLinks
// ---------------------------------------------------------------------------

describe('flattenBookmarkLinks', () => {
    it('returns links from a flat list', () => {
        const result = flattenBookmarkLinks([link('a'), link('b')]);
        expect(result.map((n) => n.id)).toEqual(['a', 'b']);
    });

    it('descends into folders and groups to collect nested links', () => {
        const tree: BookmarkNode[] = [
            folder('f1', [
                link('a'),
                group('g1', [link('b'), link('c')]),
            ]),
            folder('f2', [link('d')]),
        ];

        expect(flattenBookmarkLinks(tree).map((n) => n.id).sort())
            .toEqual(['a', 'b', 'c', 'd']);
    });

    it('drops folders that have no children and no url (empty branches)', () => {
        const tree: BookmarkNode[] = [folder('empty', [])];
        expect(flattenBookmarkLinks(tree)).toEqual([]);
    });

    it('returns an empty array for an empty input', () => {
        expect(flattenBookmarkLinks([])).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// findNodeById
// ---------------------------------------------------------------------------

describe('findNodeById', () => {
    const tree: BookmarkNode[] = [
        folder('f1', [
            link('a'),
            group('g1', [link('b'), link('c')]),
        ]),
        folder('f2', [link('d')]),
    ];

    it('finds a top-level folder', () => {
        expect(findNodeById(tree, 'f1')?.id).toBe('f1');
    });

    it('finds a direct child link', () => {
        expect(findNodeById(tree, 'a')?.id).toBe('a');
    });

    it('finds a link nested inside a group folder', () => {
        expect(findNodeById(tree, 'b')?.id).toBe('b');
        expect(findNodeById(tree, 'c')?.id).toBe('c');
    });

    it('returns null when no node matches', () => {
        expect(findNodeById(tree, 'missing')).toBeNull();
    });

    it('returns null for an empty tree', () => {
        expect(findNodeById([], 'x')).toBeNull();
    });

    it('stops at first match (does not throw on circular-like structures)', () => {
        // Two identical IDs at different depths — first match wins.
        const dup: BookmarkNode[] = [
            folder('outer', [link('dupe', { title: 'inner' })]),
            link('dupe', { title: 'outer' }),
        ];
        expect(findNodeById(dup, 'dupe')?.title).toBe('inner');
    });
});
