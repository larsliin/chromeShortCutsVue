<template>
    <div class="folders-outer">
        <BIconStarFill class="folders-background" />
        <div class="folders-container animated flex">
            <template v-for="bookmark in bookmarksStore.bookmarks">
                <BookmarksSlide :bookmarks="bookmark.children" />
            </template>
        </div>
    </div>
</template>

<script setup>

    import BookmarksSlide from '@/components/bookmarks/BookmarksSlide.vue';
    import { BIconStarFill } from 'bootstrap-icons-vue';
    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();
</script>

<style scoped lang="scss">
.folders-outer {
    background: #f0f0f0;
    background: radial-gradient(circle at 100% 100%, #cfcfcf 0%, #fff 100%);
    display: block;
    height: 100vh;
    overflow: hidden;
    width: 100vw;
}

.folders-background {
    color: var(--yellow);
    display: block;
    font-size: 600px;
    left: 50%;
    opacity: .05;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
}

.folders-container {
    align-items: center;
    // display: none;
    height: 100%;
}

.folders-container.animated {
    transition: transform 0.5s;
}

</style>
