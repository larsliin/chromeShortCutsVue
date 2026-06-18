import { GROUPING } from '@/constants';
import type { BookmarkNode } from '@/types/bookmark';

export function isGroupFolder(bookmark: BookmarkNode | chrome.bookmarks.BookmarkTreeNode): boolean {
    return !bookmark.url && bookmark.title.startsWith(GROUPING.FOLDER_PREFIX);
}

export function isBookmarkLink(bookmark: BookmarkNode | chrome.bookmarks.BookmarkTreeNode): boolean {
    return !!bookmark.url;
}

export function createGroupFolderTitle(): string {
    return `${GROUPING.FOLDER_PREFIX}${Date.now().toString(36)}`;
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

export function isGroupName(title: string): boolean {
    return title.startsWith(GROUPING.FOLDER_PREFIX);
}
