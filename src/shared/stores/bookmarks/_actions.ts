import type { BookmarkNode } from '@/types/bookmark';
import { GROUPING } from '@/constants';
import * as chromeApi from '@cmp/chromeApi';
import {
    createGroupFolderTitle,
    isBookmarkLink,
    isGroupFolder,
} from '@utils/bookmarkGroups';

function applyBookmarkColors(
    nodes: BookmarkNode[],
    bookmarkColors: Record<string, string>,
): void {
    nodes.forEach((node) => {
        if (bookmarkColors[node.id]) {
            node.color = bookmarkColors[node.id];
        }

        if (node.children?.length) {
            applyBookmarkColors(node.children, bookmarkColors);
        }
    });
}

export default {
    async getBookmarks(id: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
        return chromeApi.getBookmarkSubTree(id);
    },

    async getColorizedBookmarks(id: string): Promise<BookmarkNode[]> {
        const [tree, folderColors, bookmarkColors]: [
            chrome.bookmarks.BookmarkTreeNode[],
            Record<string, string> | null,
            Record<string, string> | null,
        ] = await Promise.all([
            chromeApi.getBookmarkSubTree(id),
            chromeApi.getSyncStorage('folderColors') as Promise<Record<string, string> | null>,
            chromeApi.getSyncStorage('bookmarkColors') as Promise<Record<string, string> | null>,
        ]);

        const result = [...tree] as BookmarkNode[];

        if (folderColors) {
            Object.entries(folderColors).forEach(([folderId, color]) => {
                const folder = (result[0].children ?? [])
                    .find((e) => e.id === folderId) as BookmarkNode | undefined;
                if (folder) {
                    folder.color = color;
                }
            });
        }

        if (bookmarkColors) {
            applyBookmarkColors((result[0].children ?? []) as BookmarkNode[], bookmarkColors);
        }

        return result;
    },

    async getBookmarkById(id: string): Promise<chrome.bookmarks.BookmarkTreeNode> {
        return chromeApi.getBookmarkById(id);
    },

    async getBookmarkByIdOrNull(id: string): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
        return chromeApi.getBookmarkByIdOrNull(id);
    },

    searchFolder(
        nodes: chrome.bookmarks.BookmarkTreeNode[],
        folderName: string,
    ): chrome.bookmarks.BookmarkTreeNode | false {
        return chromeApi.searchFolder(nodes, folderName);
    },

    async getFolderByTitle(
        parentFolderId: string,
        title: string,
    ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
        const result = await chromeApi.getBookmarkSubTree(parentFolderId);
        const nodes = result[0].children ?? [];
        const folder = chromeApi.searchFolder(nodes, title);
        return folder ? [folder] : [];
    },

    async createBookmark(
        parentId: string,
        title: string,
        url?: string,
        index?: number,
    ): Promise<chrome.bookmarks.BookmarkTreeNode> {
        return chromeApi.createBookmark(parentId, title, url, index);
    },

    async updateBookmark(
        id: string,
        data: { title?: string; url?: string },
    ): Promise<chrome.bookmarks.BookmarkTreeNode> {
        return chromeApi.updateBookmark(id, data);
    },

    async moveBookmark(
        id: string,
        targetId: { parentId?: string; index?: number },
    ): Promise<void> {
        return chromeApi.moveBookmark(id, targetId);
    },

    async reorderBookmark(id: string, index: number): Promise<void> {
        return chromeApi.moveBookmark(id, { index });
    },

    async createBookmarkGroup(
        parentId: string,
        draggedBookmarkId: string,
        targetBookmarkId: string,
    ): Promise<chrome.bookmarks.BookmarkTreeNode> {
        if (draggedBookmarkId === targetBookmarkId) {
            throw new Error('Cannot group the same bookmark');
        }

        const [parentNode, draggedNode, targetNode] = await Promise.all([
            chromeApi.getBookmarkById(parentId),
            chromeApi.getBookmarkById(draggedBookmarkId),
            chromeApi.getBookmarkById(targetBookmarkId),
        ]);

        if (!isBookmarkLink(draggedNode) || !isBookmarkLink(targetNode)) {
            throw new Error('Only bookmark links can be grouped');
        }

        if (draggedNode.parentId !== parentId || targetNode.parentId !== parentId) {
            throw new Error('Bookmarks must have the same parent folder');
        }

        if (isGroupFolder(parentNode as BookmarkNode)) {
            throw new Error('Nested groups are not allowed');
        }

        const groupFolder = await chromeApi.createBookmark(
            parentId,
            createGroupFolderTitle(),
            undefined,
            targetNode.index,
        );

        await chromeApi.moveBookmark(targetBookmarkId, { parentId: groupFolder.id, index: 0 });
        await chromeApi.moveBookmark(draggedBookmarkId, { parentId: groupFolder.id, index: 1 });

        return groupFolder;
    },

    async addBookmarkToGroup(groupFolderId: string, bookmarkId: string): Promise<void> {
        const [groupFolder, bookmark] = await Promise.all([
            chromeApi.getBookmarkById(groupFolderId),
            chromeApi.getBookmarkById(bookmarkId),
        ]);

        if (!isGroupFolder(groupFolder as BookmarkNode)) {
            throw new Error('Target is not a bookmark group');
        }

        if (!isBookmarkLink(bookmark)) {
            throw new Error('Only bookmark links can be grouped');
        }

        if (bookmark.parentId === groupFolderId) {
            return;
        }

        if (groupFolder.children && groupFolder.children.length >= GROUPING.MAX_ITEMS) {
            throw new Error('Bookmark group is full');
        }

        await chromeApi.moveBookmark(bookmarkId, {
            parentId: groupFolderId,
            index: groupFolder.children?.length ?? 0,
        });
    },

    async ungroupBookmarkGroup(groupFolderId: string): Promise<void> {
        const groupFolder = await chromeApi.getBookmarkById(groupFolderId);

        if (!isGroupFolder(groupFolder as BookmarkNode)) {
            return;
        }

        const { parentId } = groupFolder;

        if (!parentId) {
            return;
        }

        // Re-insert each child sequentially at the group folder's original
        // index plus the child's offset. Chrome's move(index) inserts BEFORE the
        // target index, so sequential inserts at (origIndex + 0), (origIndex + 1),
        // ... lay the children out in order at the position the group folder
        // occupied. parentId is asserted above to be defined.
        const groupChildren = (groupFolder.children ?? []).filter((child) => !!child.url);

        await groupChildren.reduce<Promise<void>>((chain, child, index) => chain
            .then(() => chromeApi.moveBookmark(child.id, {
                parentId,
                index: (groupFolder.index ?? 0) + index,
            })), Promise.resolve());

        await chromeApi.removeBookmarkTree(groupFolderId);
    },

    async collapseEmptyGroups(): Promise<void> {
        const groupChildren = (this.bookmarks ?? [])
            .flatMap((folder) => folder.children ?? [])
            .filter((child) => isGroupFolder(child));

        const groupStates = await Promise.all(groupChildren.map(async (groupChild) => {
            const subTree = await chromeApi.getBookmarkSubTree(groupChild.id);
            const groupFromApi = subTree?.[0];
            const linksInsideGroup = (groupFromApi?.children ?? []).filter((item) => !!item.url);

            return {
                groupId: groupChild.id,
                shouldUngroup: linksInsideGroup.length === 0,
            };
        }));

        await Promise.all(groupStates
            .filter((groupState) => groupState.shouldUngroup)
            .map((groupState) => this.ungroupBookmarkGroup(groupState.groupId)));
    },

    async removeBookmark(id: string): Promise<string> {
        return chromeApi.removeBookmark(id);
    },

    async removeBookmarkFolder(id: string): Promise<string> {
        return chromeApi.removeBookmarkTree(id);
    },

    async getTree(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
        return chromeApi.getBookmarkTree();
    },

    async setLocalStorage(storageObj: Record<string, unknown>): Promise<void> {
        return chromeApi.setLocalStorage(storageObj);
    },

    async getLocalStorage(id: string): Promise<unknown> {
        return chromeApi.getLocalStorage(id);
    },

    async setSyncStorage(storageObj: Record<string, unknown>): Promise<void> {
        return chromeApi.setSyncStorage(storageObj);
    },

    async getSyncStorage(id: string): Promise<unknown> {
        return chromeApi.getSyncStorage(id);
    },

    async getLocalStorageAll(): Promise<Record<string, unknown>> {
        return chromeApi.getAllLocalStorage();
    },

    async deleteLocalStorageItem(id: string): Promise<void> {
        return chromeApi.deleteLocalStorageItem(id);
    },

    async deleteSyncStorageItem(id: string): Promise<void> {
        return chromeApi.deleteSyncStorageItem(id);
    },

    async toBase64(file: File): Promise<string | ArrayBuffer | null> {
        return chromeApi.toBase64(file);
    },

    setBookmarksBarId(this: { bookmarksBarId: string | null }, id: string): void {
        this.bookmarksBarId = id;
    },
};
