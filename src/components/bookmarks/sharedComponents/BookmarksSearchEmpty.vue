<template>
    <Transition>
        <div class="search-empty" v-if="isVisible">
            <p class="search-empty-message">
                No results for
                <strong>{{ bookmarksStore.bookmarkSearch }}</strong>
            </p>
        </div>
    </Transition>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();

    const isVisible = computed(
        () => !!bookmarksStore.bookmarkSearch
            && (bookmarksStore.bookmarks?.length ?? 0) === 0,
    );
</script>

<style scoped lang="scss">
    .search-empty {
        left: 50%;
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        white-space: nowrap;
        z-index: 10;
    }

    .search-empty-message {
        font-size: 14px;
        margin: 0;
        opacity: 0.6;
        text-align: center;
    }

    .v-enter-active,
    .v-leave-active {
        transition: opacity 0.2s ease;
    }

    .v-enter-from,
    .v-leave-to {
        opacity: 0;
    }
</style>