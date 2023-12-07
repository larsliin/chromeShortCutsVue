<template>
    <div class="wrapper">
        <v-text-field
            hide-details="auto"
            label="Filter"
            :append-inner-icon="mdiMagnify"
            clearable
            density="compact"
            variant="solo"
            :disabled="!isEnabled"
            v-model="bookmarkSearch"
            @update:modelValue="onUpdate($event)"
            @click:clear="onClear($event)">
        </v-text-field>
    </div>
</template>

<script setup>
    import { mdiMagnify } from '@mdi/js';
    import {
        ref, onMounted, watch, nextTick,
    } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import useEventsBus from '@cmp/eventBus';
    import { EMITS } from '@/constants';
    import { useUtils } from '@/shared/utils/utils';

    const utils = useUtils();

    const { bus, emit } = useEventsBus();

    const bookmarksStore = useBookmarksStore();

    const bookmarkSearch = ref();

    async function onClear() {
        const bookmarksResponse = await bookmarksStore.get_bookmarks(bookmarksStore.rootId);

        bookmarksStore.bookmarks = bookmarksResponse[0].children;
    }

    let throttleTimer = null;

    // Filter the data
    async function onUpdate(event = '') {
        bookmarksStore.transition = false;

        const bookmarksResponse = await bookmarksStore.get_bookmarks(bookmarksStore.rootId);
        let currentFolder = bookmarksStore.bookmarks[bookmarksStore.sliderIndex];

        if (!currentFolder) {
            [currentFolder] = bookmarksResponse;
        }
        const currentFolderId = currentFolder.id;

        let sliderIndex = 0;

        if (event) {
            // if filter string has a value
            const filteredData = bookmarksResponse[0].children.map((item) => {
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
            // if filter string is empty
            bookmarksStore.bookmarks = bookmarksResponse[0].children;

            sliderIndex = Math.max(bookmarksStore.bookmarks
                .findIndex((e) => e.id === currentFolderId), 0);
        }

        utils.setSliderIndex(sliderIndex, true);

        emit(EMITS.FILTER_UPDATED, event ? event.toLowerCase() : '');

        if (throttleTimer) {
            clearTimeout(throttleTimer);
            throttleTimer = null;
        }

        throttleTimer = setTimeout(() => {
            bookmarksStore.transition = true;
        }, 100);
    }

    const isEnabled = ref(false);

    watch(() => bus.value.get(EMITS.BOOKMARKS_UPDATED), async (action) => {
        if (!bookmarksStore.rootId) {
            return;
        }

        await nextTick();

        const response = await bookmarksStore.get_bookmarks(bookmarksStore.rootId);

        isEnabled.value = !!response[0].children.length;

        if (action[0] === 'moved') {
            bookmarkSearch.value = '';
        }
    });

    onMounted(async () => {
        const response = await bookmarksStore.get_bookmarks(bookmarksStore.rootId);

        isEnabled.value = !!response[0].children.length;
    });

</script>

<style scoped lang="scss">
    .wrapper {
        width: 220px;
    }
</style>
