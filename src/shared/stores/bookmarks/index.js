import { defineStore } from 'pinia';
import actions from './_actions';
import getters from './_getters';

export const useBookmarksStore = defineStore('bookmarksStore', {
    state: () => ({
        bookmarks: null,
        sliderIndex: 0,
        icons: null,
    }),
    actions,
    getters,
});
