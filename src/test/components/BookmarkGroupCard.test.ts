import { describe, it, expect, afterEach } from 'vitest';
import { nextTick } from 'vue';
import BookmarkGroupCard from '@/components/bookmarks/sharedComponents/BookmarkGroupCard.vue';
import { useBookmarksStore } from '@stores/bookmarks';
import { mountWithPlugins } from '../test-utils';

function mountGroup(children: chrome.bookmarks.BookmarkTreeNode[] = []) {
    return mountWithPlugins(BookmarkGroupCard, {
        props: { bookmark: { id: 'group-1', title: 'Group', children } },
    });
}

async function openMenu(children: chrome.bookmarks.BookmarkTreeNode[] = []) {
    const wrapper = mountGroup(children);
    await wrapper.find('.bookmark-edit .button').trigger('click');
    await nextTick();
}

describe('BookmarkGroupCard - group actions', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });
    it('offers empty groups for deletion instead of ungrouping', async () => {
        await openMenu();
        expect(document.body.textContent).toContain('Delete empty group');
        expect(document.body.textContent).not.toContain('Ungroup');
    });

    it('preserves ungrouping for non-empty groups', async () => {
        await openMenu([{ id: 'bookmark-1', title: 'Bookmark', url: 'https://example.com' }]);
        expect(document.body.textContent).toContain('Ungroup');
        expect(document.body.textContent).not.toContain('Delete empty group');
    });

    it('deletes an empty group when its action is selected', async () => {
        await openMenu();
        const store = useBookmarksStore();
        const actionButtons = document.body.querySelectorAll<HTMLButtonElement>('.item-button');
        actionButtons[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await nextTick();
        expect(store.removeBookmarkFolder).toHaveBeenCalledWith('group-1');
    });

    it('offers a delete-all action for non-empty groups', async () => {
        await openMenu([{ id: 'bookmark-1', title: 'Bookmark', url: 'https://example.com' }]);
        expect(document.body.textContent).toContain('Delete Group');
    });

    it('does not offer a delete-all action for empty groups', async () => {
        await openMenu();
        expect(document.body.textContent).not.toContain('Delete Group');
    });

    it('deletes the group and its bookmarks after confirming', async () => {
        await openMenu([{ id: 'bookmark-1', title: 'Bookmark', url: 'https://example.com' }]);
        const store = useBookmarksStore();
        const actionButtons = document.body.querySelectorAll<HTMLButtonElement>('.item-button');
        actionButtons[2]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await nextTick();

        const confirmButton = Array.from(
            document.body.querySelectorAll<HTMLButtonElement>('button'),
        ).find((btn) => btn.textContent?.trim() === 'Delete');
        confirmButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await nextTick();

        expect(store.deleteBookmarkGroup).toHaveBeenCalledWith('group-1');
    });
});
