import { GROUPING } from '@/constants';
import type { BookmarkNode } from '@/types/bookmark';

// A bookmark group is a folder whose ID is registered in groupIds.
// Group identity is now by folder ID, not title.
export function isGroupFolder(
    bookmark: BookmarkNode | chrome.bookmarks.BookmarkTreeNode,
    groupIds: Record<string, true> | null | undefined,
): boolean {
    return !bookmark.url && !!groupIds && groupIds[bookmark.id] === true;
}

export function isBookmarkLink(bookmark: BookmarkNode | chrome.bookmarks.BookmarkTreeNode): boolean {
    return !!bookmark.url;
}

// Empty or whitespace-only names fall back to the default group name.
export function getGroupDisplayName(title: string | undefined | null): string {
    const trimmed = (title ?? '').trim();
    return trimmed.length ? trimmed : GROUPING.DEFAULT_NAME;
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

// Recursively removes a node by id from the tree.
// Subtrees without the target keep their original object identity.
export function removeNodeById(nodes: BookmarkNode[], id: string): BookmarkNode[] {
    return nodes
        .filter((node) => node.id !== id)
        .map((node) => {
            if (!node.children?.length) {
                return node;
            }
            const newChildren = removeNodeById(node.children, id);
            if (newChildren.length === node.children.length) {
                return node;
            }
            return { ...node, children: newChildren };
        });
}

// Legacy helper retained only for import-time fallback and migration. New
// runtime code must use isGroupFolder(node, groupIds) instead.
export function hasLegacyGroupPrefix(title: string | undefined | null): boolean {
    return !!title && title.startsWith(GROUPING.LEGACY_FOLDER_PREFIX);
}

// Treat an imported folder as a group when the export marked it as such.
// Falls back to the legacy title prefix for older exports.
export function isImportedGroupFolder(
    node: { isGroup?: boolean; title?: string; url?: string },
): boolean {
    if (node.url) {
        return false;
    }
    return node.isGroup === true || hasLegacyGroupPrefix(node.title);
}
