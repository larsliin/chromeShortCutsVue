<template>
    <BookmarkCreateForm
        style="width: 750px;"
        v-if="editBookmarkData"
        :data="editBookmarkData"
        @save="onBookmarkSave()"/>
</template>

<script setup>
    import { ref, onMounted } from 'vue';
    import BookmarkCreateForm from '@/components/forms/BookmarkCreateForm.vue';
    import { FOLDER } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { useUtils } from '@/shared/utils/utils';
    import { useTheme } from 'vuetify';

    const theme = useTheme();

    const utils = useUtils();

    const bookmarksStore = useBookmarksStore();

    const editBookmarkData = ref();

    bookmarksStore.popup = true;

    function onBookmarkSave() {
        window.close();
    }

    function onGetTab(tabs) {
        const currentTab = tabs[0];

        editBookmarkData.value = {
            title: currentTab.title,
            url: currentTab.url,
        };
    }

    async function getBookmarks() {
        const rootFolderResponse = await bookmarksStore
            .get_folderByTitle(FOLDER.ROOT.parentId, FOLDER.ROOT.label);

        bookmarksStore.rootId = rootFolderResponse[0].id;

        const bookmarks = await bookmarksStore.get_bookmarks(bookmarksStore.rootId);

        bookmarksStore.bookmarks = bookmarks ? bookmarks[0].children : [];
    }

    onMounted(async () => {
        const slideIndexResponse = await bookmarksStore.get_syncStorage('sliderIndex');

        if (typeof slideIndexResponse === 'number') {
            bookmarksStore.sliderIndex = slideIndexResponse;
        } else {
            bookmarksStore.sliderIndex = 0;
        }

        const darkModeResponse = await bookmarksStore.get_syncStorage('darkMode');
        bookmarksStore.enableDarkMode = !!darkModeResponse;

        theme.global.name.value = bookmarksStore.enableDarkMode ? 'dark' : 'light';

        await utils.buildRootFolder();

        await getBookmarks();

        // eslint-disable-next-line no-undef
        chrome.tabs.query({ active: true, currentWindow: true }, onGetTab);
    });
</script>

<style>
    @import "./scss/typography.scss";
</style>
