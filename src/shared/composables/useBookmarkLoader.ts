// Initial loading and refresh of the bookmarks tree, plus cleanup of
// orphaned local-storage entries.
import type { BookmarkNode } from '@/types/bookmark';
import { useBookmarksStore } from '@stores/bookmarks';
import { useBookmarkOps } from '@cmp/useBookmarkOps';
import { FOLDER } from '@/constants';

export function useBookmarkLoader() {
    const bookmarksStore = useBookmarksStore();
    const { getBookmarksAsFlatArr } = useBookmarkOps();

    async function update(): Promise<void> {
        try {
            const rootId = await bookmarksStore.getLocalStorage(FOLDER.ROOT.name);
            const tree = await bookmarksStore.getColorizedBookmarks(rootId as string);

            const rootChildren = tree[0].children ?? [];
            bookmarksStore.bookmarks = rootChildren as BookmarkNode[];
        } finally {
            bookmarksStore.dragStart = false;
        }
    }

    // Remove local-storage entries whose IDs no longer exist in Chrome bookmarks
    async function runCleanup(): Promise<void> {
        const localItems = await bookmarksStore.getLocalStorageAll() as Record<
            string,
            { parentId?: string; id: string }
        >;

        const flatBookmarks = await getBookmarksAsFlatArr();
        if (!flatBookmarks) return;

        const liveIds = new Set(flatBookmarks.map((bookmark) => bookmark.id));

        const orphans = Object.values(localItems).filter(
            (item) => item.parentId && !liveIds.has(item.id),
        );

        orphans.forEach((orphan) => {
            bookmarksStore.deleteLocalStorageItem(orphan.id);
        });
    }

    async function getBookmarks(): Promise<void> {
        const rootId = await bookmarksStore.getLocalStorage(FOLDER.ROOT.name);

        bookmarksStore.rootId = rootId as string | null;

        try {
            const tree = await bookmarksStore.getColorizedBookmarks(rootId as string);
            const rootChildren = tree[0]?.children ?? [];

            bookmarksStore.bookmarks = rootChildren as BookmarkNode[];

            await runCleanup();
        } catch (_error) {
            bookmarksStore.bookmarks = [];
        }
    }

    return { getBookmarks, update };
}
