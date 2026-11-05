// Shared click-open logic used by bookmark UI components.
// It records stats, persists them, and opens the bookmark.
import { useBookmarksStore } from '@stores/bookmarks';
import { STORAGE_KEYS } from '@/constants';
import type { BookmarkNode, BookmarkStat } from '@/types/bookmark';

export function useOpenBookmark() {
    const bookmarksStore = useBookmarksStore();

    function recordClick(bookmark: BookmarkNode): void {
        if (!bookmarksStore.statistics) {
            bookmarksStore.statistics = [];
        }

        const stats = bookmarksStore.statistics as BookmarkStat[];

        const existing = stats.find((entry) => entry.url === bookmark.url);
        const existingIndex = stats.findIndex(
            (entry) => Object.values(entry.id).includes(bookmark.id),
        );

        const index = existingIndex === -1 ? stats.length : existingIndex;
        const clicks = existing?.clicks !== undefined
            ? parseInt(String(existing.clicks), 10) + 1
            : 1;

        const idArr = existing
            ? [...new Set([...Object.values(existing.id), bookmark.id])]
            : [bookmark.id];

        stats[index] = {
            clicks,
            id: idArr,
            title: bookmark.title,
            timestamp: Date.now(),
            url: bookmark.url as string,
        };

        const sorted = stats.sort((a, b) => {
            if (b.clicks !== a.clicks) {
                return b.clicks - a.clicks;
            }
            return b.timestamp - a.timestamp;
        });

        bookmarksStore.setSyncStorage({ [STORAGE_KEYS.STATISTICS]: sorted });
    }

    function open(bookmark: BookmarkNode, event: MouseEvent | KeyboardEvent): void {
        event.preventDefault();

        if (!bookmark.url) {
            return;
        }

        recordClick(bookmark);

        if (event.ctrlKey || event.metaKey) {
            window.open(bookmark.url, '_blank');
            return;
        }

        window.location.href = bookmark.url;
    }

    return { open, recordClick };
}
