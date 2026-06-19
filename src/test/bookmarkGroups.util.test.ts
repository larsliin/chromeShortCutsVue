import { describe, it, expect } from 'vitest';
import { GROUPING } from '@/constants';
import type { BookmarkNode } from '@/types/bookmark';
import {
    isGroupFolder,
    isBookmarkLink,
    defaultGroupName,
    hasLegacyGroupPrefix,
    getGroupPreviewItems,
    flattenBookmarkLinks,
    findNodeById,
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

// Group folders are now identified by ID through a groupIds lookup, not by
// title prefix. Test helper creates the folder and exposes a matching map.
function group(id: string, children: BookmarkNode[] = []): BookmarkNode {
    return node({
        id,
        title: 'Group',
        children,
    });
}

function groupIdsFor(...ids: string[]): Record<string, true> {
    return ids.reduce<Record<string, true>>((acc, id) => {
        acc[id] = true;
        return acc;
    }, {});
}

function folder(id: string, children: BookmarkNode[] = []): BookmarkNode {
    return node({ id, title: `Folder ${id}`, children });
}

// ---------------------------------------------------------------------------
// isGroupFolder / isBookmarkLink / hasLegacyGroupPrefix
// ---------------------------------------------------------------------------

describe('isGroupFolder', () => {
    it('returns true for a folder whose id is registered in groupIds', () => {
        expect(isGroupFolder(group('g1'), groupIdsFor('g1'))).toBe(true);
    });

    it('returns false for a folder whose id is not in groupIds', () => {
        expect(isGroupFolder(folder('f1'), groupIdsFor('g1'))).toBe(false);
    });

    it('returns false for a link even if its id is in groupIds', () => {
        // A link must be excluded — only URL-less nodes are folders.
        const fake = link('x');
        expect(isGroupFolder(fake, groupIdsFor('x'))).toBe(false);
    });

    it('returns false when groupIds is null or undefined', () => {
        expect(isGroupFolder(group('g1'), null)).toBe(false);
        expect(isGroupFolder(group('g1'), undefined)).toBe(false);
    });

    it('returns false for an empty groupIds map', () => {
        expect(isGroupFolder(group('g1'), {})).toBe(false);
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

describe('hasLegacyGroupPrefix', () => {
    it('returns true when title starts with the legacy prefix', () => {
        expect(hasLegacyGroupPrefix(`${GROUPING.LEGACY_FOLDER_PREFIX}abc`)).toBe(true);
    });

    it('returns false otherwise', () => {
        expect(hasLegacyGroupPrefix('My Folder')).toBe(false);
        expect(hasLegacyGroupPrefix('')).toBe(false);
        expect(hasLegacyGroupPrefix(null)).toBe(false);
        expect(hasLegacyGroupPrefix(undefined)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// defaultGroupName
// ---------------------------------------------------------------------------

describe('defaultGroupName', () => {
    it('returns the GROUPING.DEFAULT_NAME constant', () => {
        expect(defaultGroupName()).toBe(GROUPING.DEFAULT_NAME);
    });

    it('returns a non-empty string', () => {
        expect(defaultGroupName().length).toBeGreaterThan(0);
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
        const g = node({ id: 'g', title: 'Group' });
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
