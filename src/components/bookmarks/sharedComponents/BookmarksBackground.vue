<template>
    <div class="background" :class="{ dark: bookmarksStore.enableDarkMode }"></div>
</template>

<script setup>
    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();
</script>

<style scoped lang="scss">
    .background {
        background: #f0f0f0;
        background: radial-gradient(circle at 100% 100%, var(--blue-lighter) 0%, #fff 100%);
        height: 100vh;
        position: fixed;
        width: 100vw;

        &.dark {
            background: radial-gradient(circle at 100% 100%,
            var(--darkmode-100) 0%,
            var(--darkmode-200) 100%);
        }
    }

</style>
