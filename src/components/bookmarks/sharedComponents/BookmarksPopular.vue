<template>
    <div class="popular" v-if="bookmarksStore.bookmarks && bookmarks?.length">
        <Transition>
            <div v-show="ready">
                <div class="popular-wrapper">
                    <div v-for="(item, index) in bookmarks" :key="index">
                        <BookmarkLink
                            size="smaller"
                            hideEdit
                            :draggable="false"
                            :bookmark="item"
                            @update="onImageUpdate()" />

                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
    import BookmarkLink from '@/components/bookmarks/sharedComponents/BookmarkLink.vue';
    import {
        onMounted, onUnmounted, ref, watch, nextTick,
    } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { toArray, cloneDeep } from 'lodash';
    import type { BookmarkNode, BookmarkStat } from '@/types/bookmark';
    import { EMITS, ARGS, STORAGE_KEYS } from '@/constants';
    import emitter, { type BookmarksUpdatedPayload } from '@cmp/eventBus';

    const bookmarksStore = useBookmarksStore();

    const bookmarks = ref<BookmarkNode[]>([]);
    let loadCounter = 0;
    const ready = ref(false);

    function onImageUpdate() {
        loadCounter += 1;

        if (loadCounter >= bookmarks.value.length) {
            ready.value = true;
        }
    }

    const maxLength = 5;

    async function buildBookmarks(): Promise<void> {
        bookmarks.value = [];

        if (!bookmarksStore.statistics?.length) {
            return;
        }

        const topThree = bookmarksStore.statistics.slice(0, maxLength);
        const bookmarksFlatArr = (bookmarksStore.bookmarks ?? [])
            .flatMap((obj) => obj.children ?? []);

        await nextTick();

        topThree.forEach((item: BookmarkStat) => {
            const bookmarkStatistics: string[] = toArray(item.id);

            bookmarkStatistics.forEach((item2: string) => {
                const bookmark = bookmarksFlatArr.find((e) => e?.id === item2);

                if (bookmark) {
                    bookmarks.value.push(bookmark as BookmarkNode);
                }
            });
        });
    }

    // Keeps the store and sync storage in step with a filtered statistics list.
    async function saveStatistics(statistics: BookmarkStat[]): Promise<void> {
        bookmarksStore.statistics = cloneDeep(statistics);

        await bookmarksStore.setSyncStorage({ [STORAGE_KEYS.STATISTICS]: statistics });
    }

    async function deletePopularBookmarks(folderIdArr: string[]): Promise<void> {
        await saveStatistics((bookmarksStore.statistics ?? [])
            .filter((item) => !folderIdArr.includes(item.id[0])));

        buildBookmarks();
    }

    watch(() => bookmarksStore.statistics, (newVal) => {
        if (!newVal || !newVal.length) {
            bookmarks.value = [];
        }
    });

    async function onBookmarksUpdatedHandler(payload: BookmarksUpdatedPayload): Promise<void> {
        if (payload.type === ARGS.REMOVED && bookmarksStore.statistics?.length) {
            await deletePopularBookmarks(payload.children ?? [payload.id]);
        }
    }

    // removes bookmarks from bookmark statistics that does not have a matching id in bookmarks
    function cleanupStatistics(): void {
        const liveIds = (bookmarksStore.bookmarks ?? [])
            .flatMap((obj) => obj.children ?? [])
            .map((item) => item?.id ?? '');

        const statistics = bookmarksStore.statistics ?? [];
        const filtered = statistics.filter((item) => liveIds.includes(Object.values(item.id)[0]));

        if (filtered.length !== statistics.length) {
            saveStatistics(filtered);
        }
    }

    onUnmounted(() => {
        emitter.off(EMITS.BOOKMARKS_UPDATED, onBookmarksUpdatedHandler);
    });

    onMounted(async () => {
        emitter.on(EMITS.BOOKMARKS_UPDATED, onBookmarksUpdatedHandler);

        const response = await bookmarksStore.getSyncStorage(STORAGE_KEYS.STATISTICS);

        if (response) {
            bookmarksStore.statistics = toArray(response);

            cleanupStatistics();

            buildBookmarks();
        }
    });
</script>

<style scoped lang="scss">
    .popular {
        position: fixed;
        z-index: 999;
        transition: left .35s;
        bottom: 30px;
        left: -84px;

        &-wrapper {
            background-color: rgb(var(--v-theme-surface));
            border-radius: 10px;
            box-shadow: 0px 1px 5px 0px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.25));
            padding: 4px 8px 0;

            :deep(.bookmark-link:focus-visible) {
                outline-offset: 5px;
            }
        }

        @media (min-width: 1024px) and (min-height: 500px) {
            left: 20px;
        }
    }

    .v-enter-active,
    .v-leave-active {
        transition: opacity 0.5s ease;
    }

    .v-enter-from,
    .v-leave-to {
        opacity: 0;
    }
</style>
