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
            @click:clear="onClear($event)"
            @update:modelValue="onUpdate($event)">
        </v-text-field>
    </div>
</template>

<script setup>
    import { cloneDeep } from 'lodash';
    import { EMITS } from '@/constants';
    import { mdiMagnify } from '@mdi/js';
    import {
        ref, onMounted, watch, nextTick,
    } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { useUtils } from '@/shared/utils/utils';
    import useEventsBus from '@cmp/eventBus';

    const utils = useUtils();

    const { bus, emit } = useEventsBus();

    const bookmarksStore = useBookmarksStore();

    let clonedBookmarks;

    async function onClear() {
        bookmarksStore.bookmarks = cloneDeep(clonedBookmarks);
    }

    let throttleTimer = null;
    let transitionTimer = null;

    async function runFilter(event = '') {
        const bookmarks = cloneDeep(clonedBookmarks);
        let currentFolder = bookmarksStore.bookmarks[bookmarksStore.sliderIndex];

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
            }).filter(Boolean);

            bookmarksStore.bookmarks = filteredData;

            sliderIndex = Math.max(bookmarksStore.bookmarks
                .findIndex((e) => e.id === currentFolderId), 0);
        } else {
            // if filter string is empty then reset bookmarks
            bookmarksStore.bookmarks = bookmarks;

            sliderIndex = Math.max(bookmarksStore.bookmarks
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
    function onUpdate(event = '') {
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
                .get_coloredBookmarks(bookmarksStore.rootId);

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
