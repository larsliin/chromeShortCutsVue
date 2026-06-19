import { describe, it, expect } from 'vitest';
import { GROUPING } from '@/constants';
import type { BookmarkNode } from '@/types/bookmark';
import { computeDropIntent } from '@utils/dragIntent';

// ---------------------------------------------------------------------------
// Drag-intent fixtures
// We model a parent "Work" folder with two link siblings (b1, b2) and a
// group folder (g1) that owns two grouped links (gi1, gi2).
// ---------------------------------------------------------------------------

function makeLink(id: string, parentId: string): BookmarkNode {
    return {
        id,
        parentId,
        title: id,
        url: `https://${id}.com`,
        index: 0,
        dateAdded: 0,
        syncing: false,
    } as BookmarkNode;
}

function makeFolder(id: string, parentId: string, title = `Folder ${id}`, children: BookmarkNode[] = []): BookmarkNode {
    return {
        id,
        parentId,
        title,
        index: 0,
        dateAdded: 0,
        syncing: false,
        children,
    } as BookmarkNode;
}

function makeGroup(id: string, parentId: string, children: BookmarkNode[] = []): BookmarkNode {
    return makeFolder(id, parentId, `${GROUPING.FOLDER_PREFIX}${id}`, children);
}

function buildScene(opts: {
    parentIsGroup?: boolean;
    groupChildCount?: number;
} = {}) {
    const parentId = 'work';
    const parent = opts.parentIsGroup
        ? makeGroup('work', 'root')
        : makeFolder(parentId, 'root', 'Work');

    const b1 = makeLink('b1', parentId);
    const b2 = makeLink('b2', parentId);

    const groupChildren = Array.from(
        { length: opts.groupChildCount ?? 2 },
        (_v, i) => makeLink(`gi${i + 1}`, 'g1'),
    );
    const g1 = makeGroup('g1', parentId, groupChildren);

    const items: BookmarkNode[] = [b1, b2, g1];

    // The store tree mirrors the parent folder + its children so that
    // computeDropIntent can look up live group state via findNodeById.
    const storeBookmarks: BookmarkNode[] = [
        { ...parent, children: items } as BookmarkNode,
    ];

    return {
        parent, b1, b2, g1, items, storeBookmarks,
    };
}

const baseArgs = (
    overrides: Partial<Parameters<typeof computeDropIntent>[0]> & {
        scene?: ReturnType<typeof buildScene>;
    } = {},
) => {
    const scene = overrides.scene ?? buildScene();
    return {
        draggedId: scene.b1.id,
        targetId: scene.b2.id,
        items: scene.items,
        parentFolder: scene.parent,
        storeBookmarks: scene.storeBookmarks,
        groupMode: true,
        ...overrides,
    };
};

// ---------------------------------------------------------------------------
// Create-group intent
// ---------------------------------------------------------------------------

describe('computeDropIntent — create group', () => {
    it('produces a create-intent when a link is dragged onto another link in the same parent', () => {
        const scene = buildScene();
        const intent = computeDropIntent(baseArgs({ scene }));
        expect(intent).toEqual({ type: 'create', targetId: scene.b2.id });
    });

    it('does not create a group when the dragged item is itself a group folder', () => {
        const scene = buildScene();
        const intent = computeDropIntent(baseArgs({ scene, draggedId: scene.g1.id }));
        // dragging a group → bookmark must not trigger a create intent
        expect(intent).toBeNull();
    });

    it('does not create a group when the parent folder is itself a group (no nested groups)', () => {
        const scene = buildScene({ parentIsGroup: true });
        const intent = computeDropIntent(baseArgs({ scene }));
        expect(intent).toBeNull();
    });

    it('does not create a group when sibling parentIds do not match the parent folder id', () => {
        const scene = buildScene();
        // Mutate one sibling so its parentId no longer matches.
        scene.b2.parentId = 'other-folder';
        const intent = computeDropIntent(baseArgs({ scene }));
        expect(intent).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Add-to-group intent
// ---------------------------------------------------------------------------

describe('computeDropIntent — add to group', () => {
    it('produces an add-to-group intent when a link is dragged onto a group folder', () => {
        const scene = buildScene();
        const intent = computeDropIntent(baseArgs({
            scene,
            draggedId: scene.b1.id,
            targetId: scene.g1.id,
        }));
        expect(intent).toEqual({ type: 'add-to-group', targetId: scene.g1.id });
    });

    it('returns null when the target group is already at MAX_ITEMS capacity', () => {
        const scene = buildScene({ groupChildCount: GROUPING.MAX_ITEMS });
        const intent = computeDropIntent(baseArgs({
            scene,
            draggedId: scene.b1.id,
            targetId: scene.g1.id,
        }));
        expect(intent).toBeNull();
    });

    it('counts only link children towards the MAX_ITEMS cap, ignoring stray folders', () => {
        const scene = buildScene({ groupChildCount: GROUPING.MAX_ITEMS - 1 });
        // Inject a non-link child — should not count towards capacity.
        scene.g1.children?.push(makeFolder('strange', scene.g1.id, 'Stray Folder'));
        const intent = computeDropIntent(baseArgs({
            scene,
            draggedId: scene.b1.id,
            targetId: scene.g1.id,
        }));
        expect(intent).toEqual({ type: 'add-to-group', targetId: scene.g1.id });
    });
});

// ---------------------------------------------------------------------------
// Guard clauses
// ---------------------------------------------------------------------------

describe('computeDropIntent — guards', () => {
    it('returns null when group mode is disabled', () => {
        const scene = buildScene();
        const intent = computeDropIntent(baseArgs({ scene, groupMode: false }));
        expect(intent).toBeNull();
    });

    it('returns null when dragged and target ids are identical', () => {
        const scene = buildScene();
        const intent = computeDropIntent(baseArgs({
            scene,
            draggedId: scene.b1.id,
            targetId: scene.b1.id,
        }));
        expect(intent).toBeNull();
    });

    it('returns null when either id is missing from the visible items', () => {
        const scene = buildScene();
        const intent = computeDropIntent(baseArgs({
            scene,
            targetId: 'ghost',
        }));
        expect(intent).toBeNull();
    });

    it('returns null when an empty draggedId is supplied', () => {
        const scene = buildScene();
        const intent = computeDropIntent(baseArgs({ scene, draggedId: '' }));
        expect(intent).toBeNull();
    });
});
