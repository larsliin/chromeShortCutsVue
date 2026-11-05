// Bookmark CRUD helpers that orchestrate store actions.
// All functions depend on the bookmarks store.
import { useBookmarksStore } from '@stores/bookmarks';
import type { BookmarkNode } from '@/types/bookmark';
import { findNodeById, flattenBookmarkLinks } from '@utils/bookmarkGroups';

export interface StoredBookmarkItem {
    id: string;
    image?: string;
    [key: string]: unknown;
}

export function useBookmarkOps() {
    const bookmarksStore = useBookmarksStore();

    // Local storage entries that carry an icon image.
    async function getStoredImageItems(): Promise<StoredBookmarkItem[]> {
        const items = ((await bookmarksStore.getLocalStorageAll()) || {}) as
            Record<string, StoredBookmarkItem>;

        return Object.values(items).filter((item) => !!item?.image);
    }

    async function deleteLocalStoreImages(): Promise<void> {
        const imageItems = await getStoredImageItems();

        await Promise.all(imageItems.map((item) => bookmarksStore.deleteLocalStorageItem(item.id)));
    }

    async function deleteBookmarkFolder(bookmark: BookmarkNode): Promise<void> {
        const folder = bookmarksStore.bookmarks?.find((e) => e.id === bookmark.id);
        const childIds = folder?.children?.map((e) => e.id) ?? [];

        await Promise.all(childIds.map((id) => bookmarksStore.deleteLocalStorageItem(id)));

        await bookmarksStore.removeBookmarkFolder(bookmark.id);
    }

    async function getBookmarksAsFlatArr(): Promise<BookmarkNode[] | null> {
        if (!bookmarksStore.rootId) {
            return null;
        }

        const response = await bookmarksStore.getBookmarks(bookmarksStore.rootId);

        if (!response) {
            return null;
        }

        return flattenBookmarkLinks(response.flatMap(
            (item) => item.children?.flatMap((child) => (child.children ?? [])) ?? [],
        ) as BookmarkNode[]);
    }

    async function deleteAllBookmarks(): Promise<void> {
        if (!bookmarksStore.rootId) {
            return;
        }

        const response = await bookmarksStore.getBookmarks(bookmarksStore.rootId);
        const folders = response.flatMap((item) => item.children ?? []);

        await Promise.all(folders.map((item) => bookmarksStore.removeBookmarkFolder(item.id)));

        bookmarksStore.bookmarks = [];
    }

    function getStoredBookmarkById(id: string): BookmarkNode | null {
        if (!bookmarksStore.bookmarks) {
            return null;
        }

        return findNodeById(bookmarksStore.bookmarks as BookmarkNode[], id);
    }

    return {
        getStoredImageItems,
        deleteLocalStoreImages,
        deleteBookmarkFolder,
        getBookmarksAsFlatArr,
        deleteAllBookmarks,
        getStoredBookmarkById,
    };
}
