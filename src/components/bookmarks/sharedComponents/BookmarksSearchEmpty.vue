<template>
    <Transition>
        <div class="search-empty" v-if="isVisible">
            <v-alert
                class="search-empty-alert"
                border="start"
                variant="tonal">
                <template #prepend>
                    <v-icon
                        class="search-empty-icon"
                        size="34"
                        :icon="mdiFileSearchOutline" />
                </template>

                <p class="search-empty-title">
                    No matches found
                </p>

                <p class="search-empty-message">
                    No results for
                    <strong class="search-empty-query">"{{ bookmarksStore.bookmarkSearch }}"</strong>
                </p>
            </v-alert>
        </div>
    </Transition>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import { mdiFileSearchOutline } from '@mdi/js';
    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();

    const isVisible = computed(
        () => !!bookmarksStore.bookmarkSearch && !bookmarksStore.hasBookmarks,
    );
</script>

<style scoped lang="scss">
    .search-empty {
        left: 50%;
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 10;
    }

    .search-empty-alert {
        color: rgb(var(--v-theme-on-surface));
        min-width: 240px;
        text-align: left;
    }

    .search-empty-icon {
        color: rgba(var(--v-theme-on-surface), 0.68);
        margin-top: 2px;
    }

    .search-empty-title {
        font-size: 14px;
        font-weight: 600;
        margin: 0;
        text-align: center;
    }

    .search-empty-message {
        color: rgba(var(--v-theme-on-surface), 0.74);
        font-size: 14px;
        margin: 0;
        text-align: center;
    }

    .search-empty-query {
        color: inherit;
        font-weight: 700;
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
