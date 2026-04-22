// Bookmark CRUD helpers that orchestrate store actions.
// All functions depend on the bookmarks store.
import { useBookmarksStore } from '@stores/bookmarks';
import type { BookmarkNode } from '@/types/bookmark';

export function useBookmarkOps() {
    const bookmarksStore = useBookmarksStore();

    async function deleteLocalStoreImages(): Promise<void> {
        const localStorageItems = await bookmarksStore.getLocalStorageAll() as Record<string, { image?: string; id: string }>;
        const imageItems = Object.values(localStorageItems).filter((e) => e.image);

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

        return response.flatMap(
            (item) => item.children?.flatMap((child) => (child.children ?? [])) ?? [],
        ) as BookmarkNode[];
    }

    async function deleteAllBookmarks(): Promise<void> {
        if (!bookmarksStore.rootId) {
            return;
        }

        const response = await bookmarksStore.getBookmarks(bookmarksStore.rootId);
        const folders = response.flatMap((item) => item.children?.flatMap((child) => child) ?? []);

        await Promise.all(folders.map((item) => bookmarksStore.removeBookmarkFolder(item.id)));

        bookmarksStore.bookmarks = [];
    }

    function getStoredBookmarkById(id: string): BookmarkNode | null {
        if (!bookmarksStore.bookmarks) {
            return null;
        }

        return bookmarksStore.bookmarks.reduce<BookmarkNode | null>((result, folder) => {
            const child = folder.children?.find((bookmark) => bookmark.id === id);
            return child || result;
        }, null);
    }

    return {
        deleteLocalStoreImages,
        deleteBookmarkFolder,
        getBookmarksAsFlatArr,
        deleteAllBookmarks,
        getStoredBookmarkById,
    };
}
