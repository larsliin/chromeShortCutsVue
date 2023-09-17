import { defineStore } from 'pinia';
import actions from './_actions';
import getters from './_getters';

// eslint-disable-next-line
export const useBookmarksStore = defineStore('bookmarksStore', {
    state: () => ({
        bookmarks: null,
        sliderIndex: 0,
        icons: null,
        dragStart: false,
        editBase64Image: null,
        rootId: null,
        arrowNavigation: true,
    }),
    actions,
    getters,
});
