<template>
    <div class="folders-outer">
        <BIconStarFill class="folders-background" />
        <div class="folders-container d-flex"
            :class="{' animated': bookmarksStore.transition}"
            :style="{ transform: sliderPosition }">
            <template
                v-for="(bookmark, index) in bookmarksStore.bookmarks"
                :key="bookmark.id">
                <BookmarksSlide
                    :slideindex="index"
                    :bookmarks="bookmark.children" />
            </template>
        </div>
    </div>
</template>

<script setup>
    import { computed, onMounted } from 'vue';
    import BookmarksSlide from '@/components/bookmarks/BookmarksSlide.vue';
    import { BIconStarFill } from 'bootstrap-icons-vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { useUtils } from '@/shared/utils/utils';

    const utils = useUtils();

    const bookmarksStore = useBookmarksStore();

    const sliderPosition = computed(() => `translateX(${bookmarksStore.sliderIndex * -100}%)`);

    function onKeydown(event) {
        if (event.keyCode === 39) {
            utils.setSliderIndex(Math.min(
                bookmarksStore.sliderIndex + 1,
                bookmarksStore.bookmarks.length - 1,
            ), true);
        }

        if (event.keyCode === 37) {
            utils.setSliderIndex(Math.max(bookmarksStore.sliderIndex - 1, 0), true);
        }
    }

    onMounted(() => {
        document.addEventListener('keydown', onKeydown);
        document.hasFocus();
    });
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
    height: 100%;
}

.folders-container.animated {
    transition: transform 0.5s;
}

</style>
