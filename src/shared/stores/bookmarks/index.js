import { defineStore } from 'pinia';
import actions from './_actions';
import getters from './_getters';

// eslint-disable-next-line
export const useBookmarksStore = defineStore('bookmarksStore', {
    state: () => ({
        bookmarks: null,
        sliderIndex: 0,
        icons: null,
        editBase64Image: null,
    }),
    actions,
    getters,
});
