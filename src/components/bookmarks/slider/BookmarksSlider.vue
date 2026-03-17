<template>
    <div class="folders-outer">
        <div class="folders-container d-flex"
            :class="{ ' animated': !bookmarksStore.transitionDisabled }"
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

<script setup lang="ts">
    import { computed, onMounted, onUnmounted } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { useUtils } from '@/shared/composables/utils';
    import BookmarksGroup from '@/components/bookmarks/sharedComponents/BookmarksGroup.vue';

    const utils = useUtils();

    const bookmarksStore = useBookmarksStore();

    const sliderPosition = computed(() => `translateX(${(bookmarksStore.sliderIndex ?? 0) * -100}%)`);

    function onKeydown(event: KeyboardEvent): void {
        if (bookmarksStore.titleInputActive) {
            return;
        }

        const idx = bookmarksStore.sliderIndex ?? 0;
        const len = bookmarksStore.bookmarks?.length ?? 0;

        if (event.keyCode === 39) {
            utils.setSliderIndex(Math.min(idx + 1, len - 1), true);
        }

        if (event.keyCode === 37) {
            utils.setSliderIndex(Math.max(idx - 1, 0), true);
        }
    }

    onMounted(() => {
        document.addEventListener('keydown', onKeydown);
    });

    onUnmounted(() => {
        document.removeEventListener('keydown', onKeydown);
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
