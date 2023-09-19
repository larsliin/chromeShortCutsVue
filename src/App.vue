<template>
    <BookmarksToolbar v-if="bookmarksStore.bookmarks" />
    <BookmarksContainer />
</template>

<script setup>
    import BookmarksToolbar from '@/components/toolbar/BookmarksToolbar.vue';
    import BookmarksContainer from '@/components/bookmarks/BookmarksContainer.vue';
    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();
</script>

<style>
    @import "./scss/global.scss";
    @import "./scss/colors.scss";
    @import "./scss/typography.scss";

</style>
