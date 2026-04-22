<template>
    <div class="bookmarks-container"
        v-if="bookmarksStore.bookmarks">
        <BookmarksBackground />
        <BookmarkAddLarge />
        <BookmarksSearchEmpty />
        <BookmarksAccordion />
        <BookmarksPopular />
    </div>
</template>

<script setup lang="ts">
    import { FOLDER, EMITS, ARGS, ICON_SIZE } from '@/constants';
    import { onMounted, onUnmounted } from 'vue';
    import type { BookmarkNode } from '@/types/bookmark';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { useDarkMode } from '@cmp/useDarkMode';
    import { useBookmarkOps } from '@cmp/useBookmarkOps';
    import { useAccordionSync } from '@cmp/useAccordionSync';
    import BookmarkAddLarge from '@/components/bookmarks/sharedComponents/BookmarkAddLarge.vue';
    import BookmarksSearchEmpty
        from '@/components/bookmarks/sharedComponents/BookmarksSearchEmpty.vue';
    import BookmarksAccordion from '@/components/bookmarks/accordion/BookmarksAccordion.vue';
    import BookmarksBackground
        from '@/components/bookmarks/sharedComponents/BookmarksBackground.vue';
    import BookmarksPopular from '@/components/bookmarks/sharedComponents/BookmarksPopular.vue';
    import emitter from '@cmp/eventBus';

    const { applyDarkMode, syncSystemTheme } = useDarkMode();

    const { getBookmarksAsFlatArr, getStoredBookmarkById, deleteLocalStoreImages } = useBookmarkOps();
    const { buildRootFolder, updateAccordionModel } = useAccordionSync();

    const bookmarksStore = useBookmarksStore();

    function isBookmarkInScope(id: string): boolean {
        if (id === bookmarksStore.rootId) {
            return true;
        }
        const bookmarkExists = bookmarksStore.flatBookmarks.some((e) => e?.id === id);
        const folderExists = (bookmarksStore.bookmarks ?? []).some((e) => e.id === id);

        return bookmarkExists || folderExists;
    }

    async function update() {
        if (bookmarksStore.dragStart) {
            bookmarksStore.dragStart = false;
            return;
        }

        const getRootResponse = await bookmarksStore.getLocalStorage(FOLDER.ROOT.name);

        const bookmarks = await bookmarksStore.getBookmarks(getRootResponse as string);

        const rawChildren = bookmarks[0].children ?? [];
        bookmarksStore.bookmarks = rawChildren as BookmarkNode[];
    }

    function setChromeEventListeners(): void {
        chrome.bookmarks.onCreated.addListener(onCreated);
        chrome.bookmarks.onRemoved.addListener(onRemoved);
        chrome.bookmarks.onMoved.addListener(onMoved);
        chrome.bookmarks.onChanged.addListener(onChanged);
    }

    // clean up local storage bookmarks, that are not in Chrome bookmarks
    async function runCleanup(): Promise<void> {
        const localStorageItems = await bookmarksStore.getLocalStorageAll() as Record<string, { parentId?: string; id: string }>;
        const bookmarksFlatResponse = await getBookmarksAsFlatArr();

        if (!bookmarksFlatResponse) return;
        const bookmarkIds = bookmarksFlatResponse.map((bookmark) => bookmark.id);

        const filteredItems = Object.values(localStorageItems).filter((item) => item.parentId && !bookmarkIds.includes(item.id));

        filteredItems.forEach((element) => {
            bookmarksStore.deleteLocalStorageItem(element.id);
        });
    }

    async function getBookmarks() {
        const rootResponse = await bookmarksStore.getLocalStorage(FOLDER.ROOT.name);

        bookmarksStore.rootId = rootResponse as string | null;

        try {
            const bookmarksResponse = await bookmarksStore.getColorizedBookmarks(rootResponse as string);

            const children = bookmarksResponse[0]?.children ?? [];
            bookmarksStore.bookmarks = children as BookmarkNode[];

            await runCleanup();
        } catch (_error) {
            bookmarksStore.bookmarks = [];
        }

        setChromeEventListeners();
    }

    async function isNewBookmarkInScope(bookmark: chrome.bookmarks.BookmarkTreeNode): Promise<boolean> {
        if (!bookmarksStore.rootId && bookmark.parentId !== bookmarksStore.bookmarksBarId) {
            return false;
        }

        const event = await bookmarksStore.getBookmarks(bookmarksStore.rootId as string);
        return (event[0].children ?? []).some((item) => item.id.toString() === bookmark.id.toString()
            || (item.children && item.children.some((child) => child.id.toString() === bookmark.id.toString())));
    }

    async function onCreated(event: string): Promise<void> {
        const bookmarkResponse = await bookmarksStore.getBookmarkById(event);

        if (bookmarksStore.isImporting) {
            return;
        }

        const scope = await isNewBookmarkInScope(bookmarkResponse);
        // ensure that bookmark is ours in ROOT folder
        if (!scope) {
            return;
        }

        await buildRootFolder();

        const folder = (bookmarksStore.bookmarks ?? []).find((e) => e.id === bookmarkResponse.parentId);

        if (bookmarkResponse.parentId === bookmarksStore.rootId) {
            if (bookmarksStore.bookmarks?.length) {
                // if folder bookmark is a folder in root directory
                const bm = bookmarkResponse as BookmarkNode;
                bookmarksStore.bookmarks.splice(bookmarkResponse.index ?? 0, 0, bm);
            } else {
                bookmarksStore.bookmarks = [bookmarkResponse as BookmarkNode];
            }
        } else if (folder) {
            // if bookmark event is bookmark and not folder
            if (!folder.children) {
                // create bookmarks children object if folder is empty
                folder.children = [];
            }
            const bmNode = bookmarkResponse as BookmarkNode;
            folder.children.splice(bookmarkResponse.index ?? 0, 0, bmNode);
        }

        // Apply bookmark color from sync storage
        const colorsObj = await bookmarksStore.getSyncStorage('bookmarkColors') as Record<string, string> | null;
        if (colorsObj && colorsObj[event]) {
            const bookmark = getStoredBookmarkById(event);
            if (bookmark) {
                bookmark.color = colorsObj[event];
            }
        }

        emitter.emit(EMITS.BOOKMARKS_UPDATED, { type: ARGS.CREATED, id: event });
    }

    async function onRemoved(event: string): Promise<void> {
        if (!isBookmarkInScope(event)) {
            return;
        }

        const bookmark = getStoredBookmarkById(event);
        let children;

        // if root folder is deleted then simply delete everything
        if (bookmarksStore.rootId === event) {
            const promiseArr = [
                bookmarksStore.deleteLocalStorageItem(FOLDER.ROOT.name),
                bookmarksStore.deleteLocalStorageItem('root'),
                bookmarksStore.deleteSyncStorageItem('accordion'),
                bookmarksStore.deleteSyncStorageItem('folderColors'),
                bookmarksStore.deleteSyncStorageItem('bookmarkColors'),
                bookmarksStore.deleteSyncStorageItem('statistics'),
                deleteLocalStoreImages(),
            ];

            try {
                await Promise.all(promiseArr);

                bookmarksStore.rootId = null;
                bookmarksStore.bookmarks = [];
                bookmarksStore.accordionModel = null;

                emitter.emit(EMITS.BOOKMARKS_UPDATED, { type: 'removed', id: event });
            } catch (_error) {
                bookmarksStore.errorMessage = 'Failed to remove bookmarks. Please try again.';
            }
        } else {
            if (bookmark) { // if is type bookmark
                // Filter away child object with the specified ID
                bookmarksStore.bookmarks = (bookmarksStore.bookmarks ?? []).map((parent) => ({
                    ...parent,
                    children: (parent.children ?? []).filter((child) => child.id !== event),
                }));

                // delete image in local storage
                bookmarksStore.deleteLocalStorageItem(event);
            } else { // if is type folder
                const index = (bookmarksStore.bookmarks ?? []).findIndex((e) => e.id === event);
                const folder = (bookmarksStore.bookmarks ?? []).find((e) => e.id === event);

                children = folder ? (folder.children ?? []).map((e) => e.id) : [];

                children.forEach((element) => {
                    bookmarksStore.deleteLocalStorageItem(element);
                });
                updateAccordionModel(index);

                bookmarksStore.bookmarks = (bookmarksStore.bookmarks ?? []).filter((e) => e.id !== event);
            }

            emitter.emit(EMITS.BOOKMARKS_UPDATED, { type: 'removed', id: event, children });
        }
    }

    async function onChanged(event: string): Promise<void> {
        // ensure that bookmark is ours in ROOT folder
        if (!isBookmarkInScope(event)) {
            return;
        }

        // if bookmark does not have an image icon
        // then delete applied icon image from bookmark
        if (!bookmarksStore.editBase64Image) {
            bookmarksStore.deleteLocalStorageItem(event);
        }

        try {
            const [bookmarkResponse] = await Promise.all([
                bookmarksStore.getBookmarkById(event),
                bookmarksStore.getLocalStorage(event),
            ]);

            if (bookmarkResponse) {
                await bookmarksStore.setLocalStorage({
                    [event]: {
                        parentId: bookmarkResponse.parentId,
                        id: event,
                        image: bookmarksStore.editBase64Image,
                        url: bookmarkResponse.url,
                        title: bookmarkResponse.title,
                    },
                });

                emitter.emit(EMITS.ICON_UPDATE, event);

                // update UI titles
                // find folder with id
                const folder = (bookmarksStore.bookmarks ?? []).find((e) => e.id === event);

                if (folder) {
                    // if is a folder
                    folder.title = bookmarkResponse.title;
                } else {
                    const bookmark = getStoredBookmarkById(event);
                    // if not a folder then this is a bookmark
                    // update bookmark title/url/parent id
                    if (bookmark) {
                        bookmark.parentId = bookmarkResponse.parentId;
                        bookmark.url = bookmarkResponse.url;
                        bookmark.title = bookmarkResponse.title;
                    }
                }
            }
        } catch (_error) {
            bookmarksStore.errorMessage = 'Failed to update bookmark. Please try again.';
        }

        // Apply bookmark color from sync storage
        const colorsObj = await bookmarksStore.getSyncStorage('bookmarkColors') as Record<string, string> | null;
        if (colorsObj && colorsObj[event]) {
            const bm = getStoredBookmarkById(event);
            if (bm) {
                bm.color = colorsObj[event];
            }
        }

        emitter.emit(EMITS.BOOKMARKS_UPDATED, { type: 'update', id: event });
    }

    async function onMoved(event: string): Promise<void> {
        // ensure that bookmark is ours in ROOT folder
        if (!isBookmarkInScope(event)) {
            return;
        }

        await update();

        emitter.emit(EMITS.BOOKMARKS_UPDATED, { type: 'moved', id: event });
    }

    async function init(): Promise<void> {
        const tree = await bookmarksStore.getTree();
        const bookmarksBar = (tree[0].children ?? []).find((node) => {
            const n = node as chrome.bookmarks.BookmarkTreeNode & { folderType?: string };
            return n.folderType === FOLDER.ROOT.parentFolderType;
        });

        if (!bookmarksBar) {
            return;
        }

        bookmarksStore.setBookmarksBarId(bookmarksBar.id);

        // load all settings
        const promiseArr = [
            bookmarksStore.getFolderByTitle(
                bookmarksStore.bookmarksBarId as string,
                FOLDER.ROOT.label,
            ),
            bookmarksStore.getSyncStorage('darkMode'),
            bookmarksStore.getSyncStorage('systemDarkMode'),
            bookmarksStore.getSyncStorage('iconSize'),
            buildRootFolder(),
        ];
        const [
            _rootFolder, darkMode, systemDarkMode, iconSize, _buildRoot,
        ] = await Promise.all(promiseArr);
        getBookmarks();

        bookmarksStore.iconSize = (iconSize as string) || ICON_SIZE.MEDIUM;

        applyDarkMode(darkMode, systemDarkMode);
    }

    onUnmounted(() => {
        chrome.bookmarks.onCreated.removeListener(onCreated);
        chrome.bookmarks.onRemoved.removeListener(onRemoved);
        chrome.bookmarks.onMoved.removeListener(onMoved);
        chrome.bookmarks.onChanged.removeListener(onChanged);
        emitter.off(EMITS.CHANGED, onChangedHandler);
    });

    function onChangedHandler(id: string): void {
        onChanged(id);
    }

    onMounted(() => {
        emitter.on(EMITS.CHANGED, onChangedHandler);

        syncSystemTheme();

        init();
    });

</script>

<style scoped lang="scss">
    .bookmarks-container {
        $breakpoint: 540px;

        position: relative;
        width: $breakpoint;

        @media (min-width: $breakpoint) {
            width: 100%;
        }
    }

</style>
