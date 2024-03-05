import { defineStore } from 'pinia';
import actions from './_actions';
import getters from './_getters';

// eslint-disable-next-line
export const useBookmarksStore = defineStore('bookmarksStore', {
    state: () => ({
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
    }),
    actions,
    getters,
});
