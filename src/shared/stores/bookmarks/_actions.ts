import type { BookmarkNode } from '@/types/bookmark';
import * as chromeApi from '@cmp/chromeApi';

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
            const flatBookmarks = (result[0].children ?? [])
                .flatMap((obj) => (obj as BookmarkNode).children ?? []) as BookmarkNode[];
            Object.entries(bookmarkColors).forEach(([bookmarkId, color]) => {
                const bookmark = flatBookmarks.find((e) => e.id === bookmarkId);
                if (bookmark) {
                    bookmark.color = color;
                }
            });
        }

        return result;
    },

    async getBookmarkById(id: string): Promise<chrome.bookmarks.BookmarkTreeNode> {
        return chromeApi.getBookmarkById(id);
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
    ): Promise<chrome.bookmarks.BookmarkTreeNode> {
        return chromeApi.createBookmark(parentId, title, url);
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
