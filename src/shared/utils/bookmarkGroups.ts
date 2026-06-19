import { GROUPING } from '@/constants';
import type { BookmarkNode } from '@/types/bookmark';

// A node is a bookmark group when it has no URL (is a folder) AND its ID is
// registered in the groupIds map (loaded from chrome.storage.sync). Identity
// is now by folder ID — group folders can carry any user-chosen title.
export function isGroupFolder(
    bookmark: BookmarkNode | chrome.bookmarks.BookmarkTreeNode,
    groupIds: Record<string, true> | null | undefined,
): boolean {
    return !bookmark.url && !!groupIds && groupIds[bookmark.id] === true;
}

export function isBookmarkLink(bookmark: BookmarkNode | chrome.bookmarks.BookmarkTreeNode): boolean {
    return !!bookmark.url;
}

export function defaultGroupName(): string {
    return GROUPING.DEFAULT_NAME;
}

export function getGroupPreviewItems(groupFolder: BookmarkNode): BookmarkNode[] {
    return (groupFolder.children ?? [])
        .filter((child) => !!child.url)
        .slice(0, GROUPING.PREVIEW_ITEMS);
}

export function flattenBookmarkLinks(nodes: BookmarkNode[]): BookmarkNode[] {
    return nodes.flatMap((node) => {
        if (!node.children?.length) {
            return node.url ? [node] : [];
        }

        return flattenBookmarkLinks(node.children);
    });
}

export function findNodeById(nodes: BookmarkNode[], id: string): BookmarkNode | null {
    return nodes.reduce<BookmarkNode | null>((found, node) => {
        if (found) {
            return found;
        }

        if (node.id === id) {
            return node;
        }

        if (!node.children?.length) {
            return null;
        }

        return findNodeById(node.children, id);
    }, null);
}

// Legacy helper retained only for import-time fallback and migration. New
// runtime code must use isGroupFolder(node, groupIds) instead.
export function hasLegacyGroupPrefix(title: string | undefined | null): boolean {
    return !!title && title.startsWith(GROUPING.LEGACY_FOLDER_PREFIX);
}
