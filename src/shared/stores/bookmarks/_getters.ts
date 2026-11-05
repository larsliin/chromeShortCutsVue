import type { BookmarksState } from './index';

export default {
    // True when at least one bookmark folder exists
    hasBookmarks: (state: BookmarksState): boolean => (state.bookmarks?.length ?? 0) > 0,

    // True when all accordion panels are collapsed
    isAccordionEmpty: (state: BookmarksState): boolean => (state.accordionModel?.length ?? 0) === 0,

    // True when all accordion panels are expanded
    isAccordionFull: (state: BookmarksState): boolean => (state.bookmarks?.length ?? 0) > 0
        && (state.accordionModel?.length ?? 0) === (state.bookmarks?.length ?? 0),
};
