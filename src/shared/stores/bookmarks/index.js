import { defineStore } from 'pinia';
import actions from './_actions';
import getters from './_getters';

// eslint-disable-next-line
export const useBookmarksStore = defineStore('bookmarksStore', {
    state: () => ({
        accordionNavigation: true,
        arrowNavigation: false,
        bookmarks: null,
        dragStart: false,
        editBase64Image: null,
        icons: null,
        isImporting: false,
        rootId: null,
        searchNavigation: false,
        sliderIndex: null,
        titleInputActive: false,
        transition: true,
        popup: false,
        enableDarkMode: false,
        bookmarkTooltip: true,
        dialogOpen: false,
    }),
    actions,
    getters,
});
