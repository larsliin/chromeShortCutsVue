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
                            @update="onImageUpdate($event)" />

                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
    import BookmarkLink from '@/components/bookmarks/sharedComponents/BookmarkLink.vue';
    import {
        onMounted, ref, watch, nextTick,
    } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { toArray, cloneDeep } from 'lodash';
    import { EMITS } from '@/constants';
    import useEventsBus from '@cmp/eventBus';

    const { bus } = useEventsBus();

    const bookmarksStore = useBookmarksStore();

    const bookmarks = ref([]);
    let loadCounter = 0;
    const ready = ref(false);

    function onImageUpdate() {
        loadCounter += 1;

        if (loadCounter >= bookmarks.value.length) {
            ready.value = true;
        }
    }

    const maxLength = 5;

    async function buildBookmarks() {
        bookmarks.value = [];

        if (!bookmarksStore.statistics?.length) {
            return;
        }

        const topThree = bookmarksStore.statistics.slice(0, maxLength);
        const bookmarksFlatArr = bookmarksStore.bookmarks.flatMap((obj) => obj.children);

        await nextTick();

        topThree.forEach((item) => {
            const bookmarkStatistics = toArray(item.id);

            bookmarkStatistics.forEach((item2) => {
                const bookmark = bookmarksFlatArr.find((e) => e.id === item2);

                if (bookmark) {
                    bookmarks.value.push(bookmark);
                }
            });
        });
    }

    async function deletePopularBookmarks(folderIdArr) {
        const bookmarkStatistics = JSON.parse(JSON.stringify(bookmarksStore.statistics));

        const filteredArray = bookmarkStatistics
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

    watch(() => bus.value.get(EMITS.BOOKMARKS_UPDATED), async (type) => {
        // eslint-disable-next-line max-len
        if (type[0].type === 'removed' && bookmarksStore.statistics && bookmarksStore.statistics.length) {
            if (type[0].children) {
                deletePopularBookmarks(type[0].children);
            } else {
                deletePopularBookmarks([type[0].id]);
            }
        }
    });

    // removes bookmarks from bookmark statistics that does not have a matching id in bookmarks
    function cleanup() {
        const bookmarksFlatArr = bookmarksStore.bookmarks.flatMap((obj) => obj.children);

        const uniqueIdsArr = bookmarksFlatArr.map((item) => item.id);

        // Filter bookmarksStore.statistics array based on the condition
        const indexArray = bookmarksStore.statistics.reduce((result, item, index) => {
            const arr1Id = Object.values(item.id)[0];

            if (!uniqueIdsArr.includes(arr1Id)) {
                result.push(index);
            }

            return result;
        }, []);

        if (indexArray.length) {
            const filteredArray = bookmarksStore.statistics
                .filter((item, index) => !indexArray.includes(index));

            bookmarksStore.statistics = cloneDeep(filteredArray);

            bookmarksStore.set_syncStorage({ statistics: filteredArray });
        }
    }

    onMounted(async () => {
        const response = await bookmarksStore.get_syncStorage('statistics');

        if (response) {
            bookmarksStore.statistics = toArray(response);

            cleanup();

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
