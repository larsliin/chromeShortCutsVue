import { defineStore } from 'pinia';
import actions from './_actions';
import getters from './_getters';

export const useBookmarksStore = defineStore('bookmarksStore', {
    state: () => ({
        bookmarks: null,
    }),
    actions,
    getters,
});
