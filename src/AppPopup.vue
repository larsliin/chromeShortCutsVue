<template>
    <BookmarkForm
        :data="editBookmarkData" />
</template>

<script setup>
    import { ref } from 'vue';
    import BookmarkForm from '@/components/forms/BookmarkForm.vue';
    import { useBookmarksStore } from '@stores/bookmarks';

    // eslint-disable-next-line no-unused-vars
    const bookmarksStore = useBookmarksStore();

    const editBookmarkData = ref();
</script>

<style>
    @import "./scss/global.scss";
    @import "./scss/typography.scss";
</style>
