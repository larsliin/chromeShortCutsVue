import type { BookmarkNode } from '@/types/bookmark';
import type { BookmarksState } from './index';

export default {
    currentFolder: (state: BookmarksState): BookmarkNode | null => {
        if (state.sliderIndex === null || !state.bookmarks) {
            return null;
        }
        return state.bookmarks[state.sliderIndex] ?? null;
    },
};
