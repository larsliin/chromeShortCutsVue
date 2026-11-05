<template>
    <div class="popup-wrapper">
        <BookmarkCreateForm
            v-if="editBookmarkData"
            :data="editBookmarkData"
            @save="onBookmarkSave()" />
        <ErrorAlert />
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted } from 'vue';
    import BookmarkCreateForm from '@/components/forms/BookmarkCreateForm.vue';
    import ErrorAlert from '@/components/shared/ErrorAlert.vue';
    import { FOLDER, STORAGE_KEYS } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { useAccordionSync } from '@cmp/useAccordionSync';
    import { useDarkMode } from '@cmp/useDarkMode';
    import type { BookmarkNode } from '@/types/bookmark';

    const { buildRootFolder } = useAccordionSync();
    const { applyDarkMode } = useDarkMode();

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
            .getFolderByTitle(bookmarksStore.bookmarksBarId as string, FOLDER.ROOT.label);

        if (!rootFolderResponse.length) {
            return;
        }

        bookmarksStore.rootId = rootFolderResponse[0].id;

        const bookmarks = await bookmarksStore.getBookmarks(bookmarksStore.rootId as string);

        const bmChildren = bookmarks?.[0]?.children ?? [];
        bookmarksStore.bookmarks = bmChildren as BookmarkNode[];
    }

    onMounted(async () => {
        if (!await bookmarksStore.loadBookmarksBarId()) {
            return;
        }

        const [darkMode, systemDarkMode] = await Promise.all([
            bookmarksStore.getSyncStorage(STORAGE_KEYS.DARK_MODE),
            bookmarksStore.getSyncStorage(STORAGE_KEYS.SYSTEM_DARK_MODE),
        ]);

        applyDarkMode(darkMode, systemDarkMode);

        // Initialize bookmarks data structure
        await buildRootFolder();
        await getBookmarks();

        // Get current tab information for the form
        // eslint-disable-next-line no-undef
        chrome.tabs.query({ active: true, currentWindow: true }, onGetTab);
    });
</script>

<style lang="scss">
    @use "./scss/typography.scss";

    .popup-wrapper {
        min-width: 650px;
    }
</style>
