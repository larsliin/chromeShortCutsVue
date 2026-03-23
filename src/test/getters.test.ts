import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBookmarksStore } from '@stores/bookmarks';
import type { BookmarkNode } from '@/types/bookmark';

function makeFolder(id: string, title: string): BookmarkNode {
    return { id, title, parentId: 'root' };
}

let store: ReturnType<typeof useBookmarksStore>;

beforeEach(() => {
    setActivePinia(createPinia());
    store = useBookmarksStore();
});

describe('currentFolder getter', () => {
    it('returns null when bookmarks is null', () => {
        store.bookmarks = null;
        store.sliderIndex = 0;

        expect(store.currentFolder).toBeNull();
    });

    it('returns null when sliderIndex is null', () => {
        store.bookmarks = [makeFolder('f1', 'Folder 1')];
        store.sliderIndex = null;

        expect(store.currentFolder).toBeNull();
    });

    it('returns the folder at the current sliderIndex', () => {
        const folders = [makeFolder('f1', 'First'), makeFolder('f2', 'Second'), makeFolder('f3', 'Third')];
        store.bookmarks = folders;
        store.sliderIndex = 1;

        expect(store.currentFolder).toEqual(folders[1]);
    });

    it('returns null when sliderIndex is out of bounds', () => {
        store.bookmarks = [makeFolder('f1', 'Only Folder')];
        store.sliderIndex = 5;

        expect(store.currentFolder).toBeNull();
    });

    it('returns the first folder when sliderIndex is 0', () => {
        const folders = [makeFolder('f1', 'Alpha'), makeFolder('f2', 'Beta')];
        store.bookmarks = folders;
        store.sliderIndex = 0;

        expect(store.currentFolder).toEqual(folders[0]);
    });
});
