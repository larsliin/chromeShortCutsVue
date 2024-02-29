import { defineStore } from 'pinia';
import actions from './_actions';
import getters from './_getters';

// eslint-disable-next-line
export const useBookmarksStore = defineStore('bookmarksStore', {
    state: () => ({
        accordionModel: null,
        accordionNavigation: true,
        bookmarks: null,
        dialogOpen: false,
        dragStart: false,
        editBase64Image: null,
        icons: null,
        isImporting: false,
        popup: false,
        rootElem: null,
        rootId: null,
        sliderIndex: null,
        titleInputActive: false,
        transition: true,
        enablePreferDarkMode: false,
        enableSystemDarkMode: false,
        enableDarkMode: false,
        transitionDisabled: false,
        folderColors: false,
        statistics: null,
    }),
    actions,
    getters,
});
