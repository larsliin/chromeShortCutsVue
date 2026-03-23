import { defineStore } from 'pinia';
import type { BookmarkNode, BookmarkStat } from '@/types/bookmark';
import actions from './_actions';
import getters from './_getters';

export interface BookmarksState {
    accordionModel: number[] | null;
    accordionNavigation: boolean;
    bookmarks: BookmarkNode[] | null;
    bookmarkSearch: string | null;
    dialogOpen: boolean;
    dragStart: boolean;
    editBase64Image: string | null;
    enableDarkMode: boolean;
    enablePreferDarkMode: boolean;
    enableSystemDarkMode: boolean;
    folderColors: boolean;
    icons: Record<string, string> | null;
    isImporting: boolean;
    popup: boolean;
    rootElem: HTMLElement | null;
    rootId: string | null;
    sliderIndex: number | null;
    statistics: BookmarkStat[] | null;
    titleInputActive: boolean;
    transition: boolean;
    transitionDisabled: boolean;
    bookmarksBarId: string | null;
}

// eslint-disable-next-line
export const useBookmarksStore = defineStore('bookmarksStore', {
    state: (): BookmarksState => ({
        accordionModel: null,
        accordionNavigation: true,
        bookmarks: null,
        bookmarkSearch: null,
        dialogOpen: false,
        dragStart: false,
        editBase64Image: null,
        enableDarkMode: false,
        enablePreferDarkMode: false,
        enableSystemDarkMode: false,
        folderColors: false,
        icons: null,
        isImporting: false,
        popup: false,
        rootElem: null,
        rootId: null,
        sliderIndex: null,
        statistics: null,
        titleInputActive: false,
        transition: true,
        transitionDisabled: false,
        bookmarksBarId: null,
    }),
    actions,
    getters,
});
