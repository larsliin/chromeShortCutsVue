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
    import { onMounted } from 'vue';
    import { ICON_SIZE, STORAGE_KEYS } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { useDarkMode } from '@cmp/useDarkMode';
    import { useAccordionSync } from '@cmp/useAccordionSync';
    import { useBookmarkLoader } from '@cmp/useBookmarkLoader';
    import { useBookmarkEvents } from '@cmp/useBookmarkEvents';
    import BookmarkAddLarge from '@/components/bookmarks/sharedComponents/BookmarkAddLarge.vue';
    import BookmarksSearchEmpty
        from '@/components/bookmarks/sharedComponents/BookmarksSearchEmpty.vue';
    import BookmarksAccordion from '@/components/bookmarks/accordion/BookmarksAccordion.vue';
    import BookmarksBackground
        from '@/components/bookmarks/sharedComponents/BookmarksBackground.vue';
    import BookmarksPopular from '@/components/bookmarks/sharedComponents/BookmarksPopular.vue';

    const bookmarksStore = useBookmarksStore();

    const { applyDarkMode, syncSystemTheme } = useDarkMode();
    const { buildRootFolder } = useAccordionSync();
    const { getBookmarks } = useBookmarkLoader();

    useBookmarkEvents();

    async function init(): Promise<void> {
        if (!await bookmarksStore.loadBookmarksBarId()) {
            return;
        }

        const [
            darkMode,
            systemDarkMode,
            iconSize,
        ] = await Promise.all([
            bookmarksStore.getSyncStorage(STORAGE_KEYS.DARK_MODE),
            bookmarksStore.getSyncStorage(STORAGE_KEYS.SYSTEM_DARK_MODE),
            bookmarksStore.getSyncStorage(STORAGE_KEYS.ICON_SIZE),
            buildRootFolder(),
        ]);

        getBookmarks();

        bookmarksStore.iconSize = (iconSize as string) || ICON_SIZE.MEDIUM;

        applyDarkMode(darkMode, systemDarkMode);
    }

    onMounted(() => {
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
