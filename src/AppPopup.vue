<template>
    <BookmarkCreateForm
        style="width: 750px;"
        v-if="editBookmarkData"
        :data="editBookmarkData"
        @save="onBookmarkSave()" />
</template>

<script setup lang="ts">
    import { ref, onMounted } from 'vue';
    import BookmarkCreateForm from '@/components/forms/BookmarkCreateForm.vue';
    import { FOLDER } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { useTheme } from 'vuetify';
    import { useUtils } from '@/shared/composables/utils';
    import type { BookmarkNode } from '@/types/bookmark';

    const theme = useTheme();

    const utils = useUtils();

    const bookmarksStore = useBookmarksStore();

    const editBookmarkData = ref();

    bookmarksStore.popup = true;

    function onBookmarkSave() {
        window.close();
    }

    function onGetTab(tabs: chrome.tabs.Tab[]): void {
        const currentTab = tabs[0];

        editBookmarkData.value = {
            title: currentTab.title,
            url: currentTab.url,
        };
    }

    async function getBookmarks(): Promise<void> {
        const rootFolderResponse = await bookmarksStore
            .get_folderByTitle(bookmarksStore.bookmarksBarId as string, FOLDER.ROOT.label);

        if (!rootFolderResponse.length) {
            return;
        }

        bookmarksStore.rootId = rootFolderResponse[0].id;

        const bookmarks = await bookmarksStore.get_bookmarks(bookmarksStore.rootId as string);

        const bmChildren = bookmarks?.[0]?.children ?? [];
        bookmarksStore.bookmarks = bmChildren as BookmarkNode[];
    }

    onMounted(async () => {
        // Fetch initial data in parallel for better performance
        const [
            tree,
            slideIndexResponse,
            preferDarkModeResponse,
            systemDarkModeResponse,
        ] = await Promise.all([
            bookmarksStore.get_tree(),
            bookmarksStore.get_syncStorage('sliderIndex'),
            bookmarksStore.get_syncStorage('darkMode'),
            bookmarksStore.get_syncStorage('systemDarkMode'),
        ]);

        // Locate and set up the bookmarks bar
        const bookmarksBar = (tree[0].children ?? []).find((node) => {
            const n = node as chrome.bookmarks.BookmarkTreeNode & { folderType?: string };
            return n.folderType === FOLDER.ROOT.parentFolderType;
        });

        if (!bookmarksBar) {
            return;
        }

        bookmarksStore.setBookmarksBarId(bookmarksBar.id);

        // Configure slider index from saved settings
        bookmarksStore.sliderIndex = typeof slideIndexResponse === 'number' ? slideIndexResponse : 0;

        // Configure dark mode theme
        bookmarksStore.enablePreferDarkMode = !!preferDarkModeResponse;
        bookmarksStore.enableSystemDarkMode = !!systemDarkModeResponse;

        // Determine active dark mode setting based on priority: system > preference > light
        if (bookmarksStore.enableSystemDarkMode) {
            bookmarksStore.enableDarkMode = window
                .matchMedia('(prefers-color-scheme: dark)').matches;
        } else if (bookmarksStore.enablePreferDarkMode) {
            bookmarksStore.enableDarkMode = true;
        } else {
            bookmarksStore.enableDarkMode = false;
        }

        // Apply theme to Vuetify
        theme.global.name.value = bookmarksStore.enableDarkMode ? 'dark' : 'light';

        // Initialize bookmarks data structure
        await utils.buildRootFolder();
        await getBookmarks();

        // Get current tab information for the form
        // eslint-disable-next-line no-undef
        chrome.tabs.query({ active: true, currentWindow: true }, onGetTab);
    });
</script>

<style>
    @import "./scss/typography.scss";
</style>
