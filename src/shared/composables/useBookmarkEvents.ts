// Owns Chrome bookmark event handling for the extension's root folder.
// Listeners are registered in onMounted and torn down in onUnmounted.
import { onMounted, onUnmounted } from 'vue';
import type { BookmarkNode } from '@/types/bookmark';
import { useBookmarksStore } from '@stores/bookmarks';
import { useBookmarkOps } from '@cmp/useBookmarkOps';
import { useAccordionSync } from '@cmp/useAccordionSync';
import { useBookmarkLoader } from '@cmp/useBookmarkLoader';
import { FOLDER, EMITS, ARGS } from '@/constants';
import emitter from '@cmp/eventBus';

export function useBookmarkEvents() {
    const bookmarksStore = useBookmarksStore();
    const { getStoredBookmarkById, deleteLocalStoreImages } = useBookmarkOps();
    const { buildRootFolder, updateAccordionModel } = useAccordionSync();
    const { update } = useBookmarkLoader();

    function isBookmarkInScope(id: string): boolean {
        if (id === bookmarksStore.rootId) {
            return true;
        }

        const bookmarkExists = bookmarksStore.flatBookmarks.some((e) => e?.id === id);
        const folderExists = (bookmarksStore.bookmarks ?? []).some((e) => e.id === id);

        return bookmarkExists || folderExists;
    }

    async function isNewBookmarkInScope(
        bookmark: chrome.bookmarks.BookmarkTreeNode,
    ): Promise<boolean> {
        if (!bookmarksStore.rootId && bookmark.parentId !== bookmarksStore.bookmarksBarId) {
            return false;
        }

        const event = await bookmarksStore.getBookmarks(bookmarksStore.rootId as string);
        const rootChildren = event[0].children ?? [];

        return rootChildren.some((item) => {
            if (item.id.toString() === bookmark.id.toString()) {
                return true;
            }

            return !!item.children?.some(
                (child) => child.id.toString() === bookmark.id.toString(),
            );
        });
    }

    function insertCreatedNode(node: chrome.bookmarks.BookmarkTreeNode): void {
        const bm = node as BookmarkNode;
        const insertIndex = node.index ?? 0;

        if (node.parentId === bookmarksStore.rootId) {
            if (bookmarksStore.bookmarks?.length) {
                bookmarksStore.bookmarks.splice(insertIndex, 0, bm);
            } else {
                bookmarksStore.bookmarks = [bm];
            }
            return;
        }

        const parent = (bookmarksStore.bookmarks ?? []).find((e) => e.id === node.parentId);
        if (!parent) return;

        if (!parent.children) {
            parent.children = [];
        }
        parent.children.splice(insertIndex, 0, bm);
    }

    function removeBookmarkFromTree(id: string): void {
        bookmarksStore.bookmarks = (bookmarksStore.bookmarks ?? []).map((parent) => ({
            ...parent,
            children: (parent.children ?? []).filter((child) => child.id !== id),
        }));

        bookmarksStore.deleteLocalStorageItem(id);
    }

    function removeFolderFromTree(id: string): string[] {
        const folders = bookmarksStore.bookmarks ?? [];
        const index = folders.findIndex((e) => e.id === id);
        const folder = folders.find((e) => e.id === id);
        const childIds = folder ? (folder.children ?? []).map((e) => e.id) : [];

        childIds.forEach((childId) => bookmarksStore.deleteLocalStorageItem(childId));

        updateAccordionModel(index);

        bookmarksStore.bookmarks = folders.filter((e) => e.id !== id);

        return childIds;
    }

    async function removeEverything(event: string): Promise<void> {
        const cleanup = [
            bookmarksStore.deleteLocalStorageItem(FOLDER.ROOT.name),
            bookmarksStore.deleteLocalStorageItem('root'),
            bookmarksStore.deleteSyncStorageItem('accordion'),
            bookmarksStore.deleteSyncStorageItem('folderColors'),
            bookmarksStore.deleteSyncStorageItem('bookmarkColors'),
            bookmarksStore.deleteSyncStorageItem('statistics'),
            deleteLocalStoreImages(),
        ];

        try {
            await Promise.all(cleanup);

            bookmarksStore.rootId = null;
            bookmarksStore.bookmarks = [];
            bookmarksStore.accordionModel = null;

            emitter.emit(EMITS.BOOKMARKS_UPDATED, { type: 'removed', id: event });
        } catch (_error) {
            bookmarksStore.errorMessage = 'Failed to remove bookmarks. Please try again.';
        }
    }

    async function applyStoredColor(id: string): Promise<void> {
        const colorsObj = await bookmarksStore.getSyncStorage('bookmarkColors') as
            Record<string, string> | null;

        const bookmark = getStoredBookmarkById(id);
        if (!bookmark) return;

        bookmark.color = colorsObj?.[id] || '';
    }

    async function onBookmarksUpdated(event: { type: string; id: string }): Promise<void> {
        if (event.type !== 'color') return;

        await applyStoredColor(event.id);
    }

    async function persistChangedBookmark(
        id: string,
        bookmarkResponse: chrome.bookmarks.BookmarkTreeNode,
    ): Promise<void> {
        await bookmarksStore.setLocalStorage({
            [id]: {
                parentId: bookmarkResponse.parentId,
                id,
                image: bookmarksStore.editBase64Image,
                url: bookmarkResponse.url,
                title: bookmarkResponse.title,
            },
        });
    }

    function syncInMemoryNode(
        id: string,
        bookmarkResponse: chrome.bookmarks.BookmarkTreeNode,
    ): void {
        const folder = (bookmarksStore.bookmarks ?? []).find((e) => e.id === id);
        if (folder) {
            folder.title = bookmarkResponse.title;
            return;
        }

        const bm = getStoredBookmarkById(id);
        if (!bm) return;

        bm.parentId = bookmarkResponse.parentId;
        bm.url = bookmarkResponse.url;
        bm.title = bookmarkResponse.title;
    }

    async function onCreated(event: string): Promise<void> {
        if (bookmarksStore.isImporting) return;

        const bookmarkResponse = await bookmarksStore.getBookmarkById(event);

        const inScope = await isNewBookmarkInScope(bookmarkResponse);
        if (!inScope) return;

        await buildRootFolder();

        insertCreatedNode(bookmarkResponse);
        await applyStoredColor(event);

        emitter.emit(EMITS.BOOKMARKS_UPDATED, { type: ARGS.CREATED, id: event });
    }

    async function onRemoved(event: string): Promise<void> {
        if (!isBookmarkInScope(event)) return;

        // Special case: the root folder itself was deleted
        if (bookmarksStore.rootId === event) {
            await removeEverything(event);
            return;
        }

        const isLeafBookmark = !!getStoredBookmarkById(event);
        let removedChildren: string[] | undefined;

        if (isLeafBookmark) {
            removeBookmarkFromTree(event);
        } else {
            removedChildren = removeFolderFromTree(event);
        }

        emitter.emit(EMITS.BOOKMARKS_UPDATED, {
            type: 'removed',
            id: event,
            children: removedChildren,
        });
    }

    async function onChanged(event: string): Promise<void> {
        if (!isBookmarkInScope(event)) return;

        // Without a new icon image, drop any stored icon for this bookmark
        if (!bookmarksStore.editBase64Image) {
            bookmarksStore.deleteLocalStorageItem(event);
        }

        try {
            const [bookmarkResponse] = await Promise.all([
                bookmarksStore.getBookmarkById(event),
                bookmarksStore.getLocalStorage(event),
            ]);

            if (bookmarkResponse) {
                await persistChangedBookmark(event, bookmarkResponse);
                emitter.emit(EMITS.ICON_UPDATE, event);
                syncInMemoryNode(event, bookmarkResponse);
            }
        } catch (_error) {
            bookmarksStore.errorMessage = 'Failed to update bookmark. Please try again.';
        }

        await applyStoredColor(event);

        emitter.emit(EMITS.BOOKMARKS_UPDATED, { type: 'update', id: event });
    }

    async function onMoved(event: string): Promise<void> {
        if (!isBookmarkInScope(event)) return;

        await update();

        emitter.emit(EMITS.BOOKMARKS_UPDATED, { type: 'moved', id: event });
    }

    function onChangedFromBus(id: string): void {
        onChanged(id);
    }

    onMounted(() => {
        chrome.bookmarks.onCreated.addListener(onCreated);
        chrome.bookmarks.onRemoved.addListener(onRemoved);
        chrome.bookmarks.onMoved.addListener(onMoved);
        chrome.bookmarks.onChanged.addListener(onChanged);

        emitter.on(EMITS.CHANGED, onChangedFromBus);
        emitter.on(EMITS.BOOKMARKS_UPDATED, onBookmarksUpdated);
    });

    onUnmounted(() => {
        chrome.bookmarks.onCreated.removeListener(onCreated);
        chrome.bookmarks.onRemoved.removeListener(onRemoved);
        chrome.bookmarks.onMoved.removeListener(onMoved);
        chrome.bookmarks.onChanged.removeListener(onChanged);

        emitter.off(EMITS.CHANGED, onChangedFromBus);
        emitter.off(EMITS.BOOKMARKS_UPDATED, onBookmarksUpdated);
    });
}
