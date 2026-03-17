<template>
    <div class="popular" v-if="bookmarksStore.bookmarks && bookmarks?.length">
        <Transition>
            <div v-show="ready">
                <div class="popular-wrapper">
                    <div v-for="(item, index) in bookmarks" :key="index">
                        <BookmarkLink
                            size="smaller"
                            hideEdit
                            :tabIndex="``"
                            :draggable="false"
                            :bookmark="item"
                            :fadeInIcon="false"
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
        onMounted, ref, watch, nextTick,
    } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { toArray, cloneDeep } from 'lodash';
    import type { BookmarkNode, BookmarkStat } from '@/types/bookmark';
    import { EMITS } from '@/constants';
    import useEventsBus from '@cmp/eventBus';

    const { bus } = useEventsBus();

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

    async function deletePopularBookmarks(folderIdArr: string[]): Promise<void> {
        const bookmarkStatistics = JSON.parse(JSON.stringify(bookmarksStore.statistics));

        const filteredArray = (bookmarkStatistics as BookmarkStat[])
            .filter((item) => !folderIdArr.includes(item.id[0]));

        bookmarksStore.statistics = cloneDeep(filteredArray);

        await bookmarksStore.set_syncStorage({ statistics: filteredArray });

        buildBookmarks();
    }

    watch(() => bookmarksStore.statistics, (newVal) => {
        if (!newVal || !newVal.length) {
            bookmarks.value = [];
        }
    });

    watch(() => bus.value.get(EMITS.BOOKMARKS_UPDATED), async (type: { type: string; id: string; children?: string[] }[]) => {
        if (type?.[0]?.type === 'removed' && bookmarksStore.statistics?.length) {
            if (type[0].children) {
                await deletePopularBookmarks(type[0].children);
            } else {
                await deletePopularBookmarks([type[0].id]);
            }
        }
    });

    // removes bookmarks from bookmark statistics that does not have a matching id in bookmarks
    function cleanupStatistics(): void {
        const bookmarksFlatArr = (bookmarksStore.bookmarks ?? [])
            .flatMap((obj) => obj.children ?? []);

        const uniqueIdsArr = bookmarksFlatArr.map((item) => item?.id ?? '');

        const indexArray = (bookmarksStore.statistics ?? [])
            .reduce<number[]>((result, item, index) => {
                const arr1Id = Object.values(item.id)[0];
                if (!uniqueIdsArr.includes(arr1Id)) {
                    result.push(index);
                }
                return result;
            }, []);

        if (indexArray.length) {
            const filteredArray = (bookmarksStore.statistics ?? [])
                .filter((_item, index) => !indexArray.includes(index));

            bookmarksStore.statistics = cloneDeep(filteredArray);

            bookmarksStore.set_syncStorage({ statistics: filteredArray });
        }
    }

    onMounted(async () => {
        const response = await bookmarksStore.get_syncStorage('statistics');

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
