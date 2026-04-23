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
    import { FOLDER, ICON_SIZE } from '@/constants';
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
        const tree = await bookmarksStore.getTree();

        const bookmarksBar = (tree[0].children ?? []).find((node) => {
            const n = node as chrome.bookmarks.BookmarkTreeNode & { folderType?: string };
            return n.folderType === FOLDER.ROOT.parentFolderType;
        });

        if (!bookmarksBar) {
            return;
        }

        bookmarksStore.setBookmarksBarId(bookmarksBar.id);

        const [
            _rootFolder,
            darkMode,
            systemDarkMode,
            iconSize,
        ] = await Promise.all([
            bookmarksStore.getFolderByTitle(
                bookmarksStore.bookmarksBarId as string,
                FOLDER.ROOT.label,
            ),
            bookmarksStore.getSyncStorage('darkMode'),
            bookmarksStore.getSyncStorage('systemDarkMode'),
            bookmarksStore.getSyncStorage('iconSize'),
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
