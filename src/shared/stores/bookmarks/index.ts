import { defineStore } from 'pinia';
import type { BookmarkNode, BookmarkStat } from '@/types/bookmark';
import { ICON_SIZE } from '@/constants';
import actions from './_actions';
import getters from './_getters';

export interface BookmarksState {
    // --- Bookmark data ---
    bookmarks: BookmarkNode[] | null;
    rootId: string | null;
    bookmarksBarId: string | null;
    statistics: BookmarkStat[] | null;
    icons: Record<string, string> | null;
    groupIds: Record<string, true>;

    // --- UI state ---
    accordionModel: number[] | null;
    bookmarkSearch: string | null;
    dragStart: boolean;
    groupMode: boolean;
    editBase64Image: string | null;
    errorMessage: string | null;
    isImporting: boolean;
    popup: boolean;

    // --- Appearance ---
    transitionDisabled: boolean;
    iconSize: string;

    // --- Dark mode settings ---
    enableDarkMode: boolean;
    enablePreferDarkMode: boolean;
    enableSystemDarkMode: boolean;
}

// eslint-disable-next-line
export const useBookmarksStore = defineStore('bookmarksStore', {
    state: (): BookmarksState => ({
        // --- Bookmark data ---
        bookmarks: null,
        rootId: null,
        bookmarksBarId: null,
        statistics: null,
        icons: null,
        groupIds: {},

        // --- UI state ---
        accordionModel: null,
        bookmarkSearch: null,
        dragStart: false,
        groupMode: false,
        editBase64Image: null,
        errorMessage: null,
        isImporting: false,
        popup: false,

        // --- Appearance ---
        transitionDisabled: false,
        iconSize: ICON_SIZE.MEDIUM,

        // --- Dark mode settings ---
        enableDarkMode: false,
        enablePreferDarkMode: false,
        enableSystemDarkMode: false,
    }),
    actions,
    getters,
});
