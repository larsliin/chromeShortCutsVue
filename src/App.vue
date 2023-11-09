<template>
    <BookmarksToolbar v-if="bookmarksStore.bookmarks" />
    <BookmarksContainer />
</template>

<script setup>
    import BookmarksToolbar from '@/components/toolbar/BookmarksToolbar.vue';
    import BookmarksContainer from '@/views/BookmarksView.vue';
    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();
</script>

<style>
    @import "./scss/colors.scss";
    @import "./scss/typography.scss";

</style>
