import type { BookmarkNode } from '@/types/bookmark';
import type { BookmarksState } from './index';

export default {
    // All bookmark children across all folders as a flat array
    flatBookmarks: (state: BookmarksState): BookmarkNode[] => (state.bookmarks ?? [])
        .flatMap((folder) => (folder.children ?? []) as BookmarkNode[]),

    // True when at least one bookmark folder exists
    hasBookmarks: (state: BookmarksState): boolean => (state.bookmarks?.length ?? 0) > 0,

    // True when all accordion panels are collapsed
    isAccordionEmpty: (state: BookmarksState): boolean => (state.accordionModel?.length ?? 0) === 0,

    // True when all accordion panels are expanded
    isAccordionFull: (state: BookmarksState): boolean => (state.bookmarks?.length ?? 0) > 0
        && (state.accordionModel?.length ?? 0) === (state.bookmarks?.length ?? 0),

    // Total number of bookmarks across all folders
    bookmarksCount: (state: BookmarksState): number => (state.bookmarks ?? [])
        .reduce((total, folder) => total + (folder.children?.length ?? 0), 0),
};
