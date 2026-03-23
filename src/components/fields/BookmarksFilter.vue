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
        ref, onMounted, watch, nextTick,
    } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { useUtils } from '@/shared/composables/utils';
    import useEventsBus from '@cmp/eventBus';

    const utils = useUtils();

    const { bus, emit } = useEventsBus();

    const bookmarksStore = useBookmarksStore();

    let clonedBookmarks: BookmarkNode[] = [];

    async function onClear(): Promise<void> {
        bookmarksStore.bookmarks = cloneDeep(clonedBookmarks);
    }

    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    let transitionTimer: ReturnType<typeof setTimeout> | null = null;

    async function runFilter(event = ''): Promise<void> {
        const bookmarks: BookmarkNode[] = cloneDeep(clonedBookmarks);
        let currentFolder = bookmarksStore.bookmarks?.[bookmarksStore.sliderIndex ?? 0];

        if (!currentFolder) {
            [currentFolder] = bookmarks;
        }

        const currentFolderId = currentFolder.id;

        let sliderIndex = 0;

        if (event) {
            // if filter string has a value then filter bookmarks
            const filteredData = bookmarks.map((item) => {
                if (item.children) {
                    // eslint-disable-next-line no-param-reassign
                    item.children = item.children
                        .filter((child) => child.title.toLowerCase()
                            .includes(event.toLowerCase()) && !child.children);
                    return item.children.length > 0 ? item : null;
                }
                return null;
            }).filter((x): x is BookmarkNode => x !== null);

            bookmarksStore.bookmarks = filteredData;

            sliderIndex = Math.max((bookmarksStore.bookmarks ?? [])
                .findIndex((e) => e.id === currentFolderId), 0);
        } else {
            bookmarksStore.bookmarks = bookmarks;

            sliderIndex = Math.max((bookmarksStore.bookmarks ?? [])
                .findIndex((e) => e.id === currentFolderId), 0);
        }

        utils.setSliderIndex(sliderIndex, true);

        emit(EMITS.FILTER_UPDATED, event ? event.toLowerCase() : '');

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
        throttleTimer = setTimeout(() => {
            throttleTimer = null;
            runFilter(event);
        }, 150);
    }

    const isEnabled = ref(false);

    async function getBookmarks() {
        try {
            const bookmarksResponse = await bookmarksStore
                .get_colorizedBookmarks(bookmarksStore.rootId as string);

            clonedBookmarks = bookmarksResponse[0]?.children
                ? bookmarksResponse[0].children : [];

            isEnabled.value = !!clonedBookmarks.length;
        } catch (error) {
            clonedBookmarks = [];
        }
    }

    watch(() => bus.value.get(EMITS.BOOKMARKS_UPDATED), async () => {
        if (!bookmarksStore.rootId) {
            return;
        }

        await nextTick();

        getBookmarks();
    });

    onMounted(() => {
        getBookmarks();
    });

</script>

<style scoped lang="scss">
    .wrapper {
        width: 220px;
    }
</style>
