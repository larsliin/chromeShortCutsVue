<template>
    <BookmarksToolbar v-if="bookmarksStore.bookmarks" />
    <BookmarksContainer />
    <ErrorAlert />
</template>

<script setup lang="ts">
    import BookmarksToolbar from '@/components/toolbar/BookmarksToolbar.vue';
    import BookmarksContainer from '@/views/BookmarksView.vue';
    import ErrorAlert from '@/components/shared/ErrorAlert.vue';
    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();
</script>

<style lang="scss">
    @use "./scss/index.scss";

</style>
