<template>
    <div class="folders-outer">
        <div class="folders-container d-flex"
            :class="{' animated': !bookmarksStore.transitionDisabled}"
            :style="{ transform: sliderPosition }">
            <template
                v-for="(bookmark, index) in bookmarksStore.bookmarks"
                :key="bookmark.id">
                <BookmarksGroup
                    :slideindex="index"
                    :folder="bookmark"
                    :bookmarks="bookmark.children" />
            </template>
        </div>
    </div>
</template>

<script setup>
    import { computed, onMounted } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { useUtils } from '@/shared/utils/utils';
    import BookmarksGroup from '@/components/bookmarks/sharedComponents/BookmarksGroup.vue';

    const utils = useUtils();

    const bookmarksStore = useBookmarksStore();

    const sliderPosition = computed(() => `translateX(${bookmarksStore.sliderIndex * -100}%)`);

    function onKeydown(event) {
        if (bookmarksStore.titleInputActive) {
            return;
        }

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
    display: block;
     height: 100vh;
}

.folders-container {
    align-items: center;
    height: 100%;
}

.folders-container.animated {
    transition: transform 0.5s;
}

</style>
