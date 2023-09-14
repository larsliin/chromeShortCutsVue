<template>
  <Toolbar v-if="bookmarksStore.bookmarks" />
  <Bookmarks />
</template>

<script setup>
    import Toolbar from '@/components/toolbar/Toolbar.vue'
    import Bookmarks from '@/components/bookmarks/Bookmarks.vue'
    import { useBookmarksStore } from '@stores/bookmarks';

const bookmarksStore = useBookmarksStore();
</script>

<style>
    @import "./scss/colors.scss";
    @import "./scss/typography.scss";
</style>
