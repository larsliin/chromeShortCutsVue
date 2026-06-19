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
    dialogOpen: boolean;
    dragStart: boolean;
    groupMode: boolean;
    editBase64Image: string | null;
    errorMessage: string | null;
    isImporting: boolean;
    titleInputActive: boolean;
    popup: boolean;
    rootElem: HTMLElement | null;

    // --- Appearance ---
    transition: boolean;
    transitionDisabled: boolean;
    folderColors: boolean;
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
        dialogOpen: false,
        dragStart: false,
        groupMode: false,
        editBase64Image: null,
        errorMessage: null,
        isImporting: false,
        titleInputActive: false,
        popup: false,
        rootElem: null,

        // --- Appearance ---
        transition: true,
        transitionDisabled: false,
        folderColors: false,
        iconSize: ICON_SIZE.MEDIUM,

        // --- Dark mode settings ---
        enableDarkMode: false,
        enablePreferDarkMode: false,
        enableSystemDarkMode: false,
    }),
    actions,
    getters,
});
