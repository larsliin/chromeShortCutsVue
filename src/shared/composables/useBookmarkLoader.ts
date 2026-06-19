import { watch } from 'vue';
import type { BookmarkNode } from '@/types/bookmark';
import { useBookmarksStore } from '@stores/bookmarks';
import { useBookmarkOps } from '@cmp/useBookmarkOps';
import { FOLDER } from '@/constants';

export function useBookmarkLoader() {
    const bookmarksStore = useBookmarksStore();
    const { getBookmarksAsFlatArr } = useBookmarkOps();

    let pendingRefresh = false;

    async function performUpdate(): Promise<void> {
        const rootId = await bookmarksStore.getLocalStorage(FOLDER.ROOT.name);
        const tree = await bookmarksStore.getColorizedBookmarks(rootId as string);

        const rootChildren = tree[0].children ?? [];
        bookmarksStore.bookmarks = rootChildren as BookmarkNode[];
    }

    // Skip refreshes while a drag is in progress — swapping bookmarksStore.bookmarks
    // mid-drag swaps vuedraggable's source array and causes visual glitches. Flag a
    // pending refresh so the final Chrome state is captured once the drag ends.
    async function update(): Promise<void> {
        if (bookmarksStore.dragStart) {
            pendingRefresh = true;
            return;
        }

        await performUpdate();
    }

    watch(
        () => bookmarksStore.dragStart,
        async (dragging) => {
            if (!dragging && pendingRefresh) {
                pendingRefresh = false;
                await performUpdate();
            }
        },
    );

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
