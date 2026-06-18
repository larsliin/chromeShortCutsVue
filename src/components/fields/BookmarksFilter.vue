<template>
    <div class="wrapper">
        <v-text-field
            clearable
            density="compact"
            hide-details="auto"
            label="Filter"
            v-model="bookmarksStore.bookmarkSearch"
            variant="solo"
            :append-inner-icon="mdiMagnify"
            :disabled="!isEnabled"
            @click:clear="onClear()"
            @update:modelValue="onUpdate($event)" />
    </div>
</template>

<script setup lang="ts">
    import { cloneDeep } from 'lodash';
    import type { BookmarkNode } from '@/types/bookmark';
    import { EMITS } from '@/constants';
    import { mdiMagnify } from '@mdi/js';
    import {
        ref, onMounted, onUnmounted, nextTick,
    } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import emitter from '@cmp/eventBus';

    const bookmarksStore = useBookmarksStore();

    let clonedBookmarks: BookmarkNode[] = [];

    async function onClear(): Promise<void> {
        bookmarksStore.bookmarks = cloneDeep(clonedBookmarks);
    }

    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    let transitionTimer: ReturnType<typeof setTimeout> | null = null;

    async function runFilter(event = ''): Promise<void> {
        const bookmarks: BookmarkNode[] = cloneDeep(clonedBookmarks);

        if (event) {
            const searchTerm = event.toLowerCase();

            const filteredData = bookmarks.map((item) => {
                if (item.children) {
                    const leafChildren = item.children.filter((child) => !child.children);
                    const folderTitleMatches = item.title.toLowerCase().includes(searchTerm);

                    // eslint-disable-next-line no-param-reassign
                    item.children = folderTitleMatches
                        ? leafChildren
                        : leafChildren.filter((child) => child.title.toLowerCase()
                            .includes(searchTerm));

                    return folderTitleMatches || item.children.length > 0 ? item : null;
                }
                return null;
            }).filter((x): x is BookmarkNode => x !== null);

            bookmarksStore.bookmarks = filteredData;
        } else {
            bookmarksStore.bookmarks = bookmarks;
        }

        emitter.emit(EMITS.FILTER_UPDATED, event ? event.toLowerCase() : '');

        if (transitionTimer) {
            clearTimeout(transitionTimer);
        }

        transitionTimer = setTimeout(() => {
            bookmarksStore.transitionDisabled = false;
            transitionTimer = null;
        }, 500);
    }

    // Filter the data
    function onUpdate(event = ''): void {
        bookmarksStore.transitionDisabled = true;

        if (throttleTimer) {
            clearTimeout(throttleTimer);
        }

        // Restore immediately when cleared to prevent BookmarkAddLarge flash
        if (!event) {
            runFilter('');
            return;
        }

        throttleTimer = setTimeout(() => {
            throttleTimer = null;
            runFilter(event);
        }, 150);
    }

    const isEnabled = ref(false);

    async function getBookmarks() {
        try {
            const bookmarksResponse = await bookmarksStore
                .getColorizedBookmarks(bookmarksStore.rootId as string);

            clonedBookmarks = bookmarksResponse[0]?.children
                ? bookmarksResponse[0].children : [];

            isEnabled.value = !!clonedBookmarks.length;
        } catch (_error) {
            clonedBookmarks = [];
        }
    }

    async function onBookmarksUpdatedHandler(): Promise<void> {
        if (!bookmarksStore.rootId) {
            return;
        }

        await nextTick();

        getBookmarks();
    }

    onUnmounted(() => {
        emitter.off(EMITS.BOOKMARKS_UPDATED, onBookmarksUpdatedHandler);
    });

    onMounted(() => {
        emitter.on(EMITS.BOOKMARKS_UPDATED, onBookmarksUpdatedHandler);

        getBookmarks();
    });

</script>

<style scoped lang="scss">
    .wrapper {
        width: 220px;
    }
</style>
