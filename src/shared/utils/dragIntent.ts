import { GROUPING } from '@/constants';
import type { BookmarkNode } from '@/types/bookmark';
import {
    findNodeById,
    isBookmarkLink,
    isGroupFolder,
} from '@utils/bookmarkGroups';

export interface DropIntent {
    type: 'create' | 'add-to-group';
    targetId: string;
}

interface ComputeDropIntentArgs {
    draggedId: string;
    targetId: string;
    items: BookmarkNode[];
    parentFolder: BookmarkNode;
    storeBookmarks: BookmarkNode[];
    groupMode: boolean;
}

// Pure derivation of a drag-and-drop intent. Returns the intent that the
// current drag (dragged → target) should trigger, or null when the gesture
// should fall through to a regular reorder / move. Behaviour mirrors
// BookmarksGroup.vue::onDragMove + computeDropIntentFor 1:1.
export function computeDropIntent({
    draggedId,
    targetId,
    items,
    parentFolder,
    storeBookmarks,
    groupMode,
}: ComputeDropIntentArgs): DropIntent | null {
    if (!groupMode) {
        return null;
    }

    if (!draggedId || !targetId || draggedId === targetId) {
        return null;
    }

    const dragged = items.find((item) => item.id === draggedId);
    const related = items.find((item) => item.id === targetId);

    if (!dragged || !related) {
        return null;
    }

    const canCreateGroup = isBookmarkLink(dragged)
        && isBookmarkLink(related)
        && dragged.parentId === parentFolder.id
        && related.parentId === parentFolder.id
        && !isGroupFolder(parentFolder);

    if (canCreateGroup) {
        return { type: 'create', targetId: related.id };
    }

    const canAddToGroup = isBookmarkLink(dragged) && isGroupFolder(related);

    if (canAddToGroup) {
        const groupedNode = findNodeById(storeBookmarks, related.id);
        const groupedCount = groupedNode?.children?.filter((item) => !!item.url).length ?? 0;

        if (groupedCount >= GROUPING.MAX_ITEMS) {
            return null;
        }

        return { type: 'add-to-group', targetId: related.id };
    }

    return null;
}
