<template>
    <div class="popular" v-if="bookmarksStore.bookmarks && bookmarks">
        <Transition>
            <div v-show="ready">
                <div class="popular-wrapper">
                    <div v-for="(item, index) in bookmarks" :key="index">
                        <BookmarkLink
                            :tabIndex="``"
                            size="smaller"
                            hideEdit
                            :bookmark="item"
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

    async function buildBookmarks() {
        if (!bookmarksStore.statistics?.length) {
            return;
        }

        const topThree = bookmarksStore.statistics.slice(0, 3);
        const bookmarksFlatArr = bookmarksStore.bookmarks.flatMap((obj) => obj.children);

        bookmarks.value = [];

        await nextTick();

        topThree.forEach((item) => {
            const arr = toArray(item.id);

            arr.forEach((item2) => {
                const bookmark = bookmarksFlatArr.find((e) => e.id === item2);

                if (bookmark) {
                    bookmarks.value.push(bookmark);
                }
            });
        });
    }

    watch(() => bus.value.get(EMITS.BOOKMARKS_UPDATED), async (type) => {
        if (type[0].type === 'removed'
            && bookmarksStore.statistics
            && bookmarksStore.statistics.length) {
            const index = bookmarksStore.statistics
                .findIndex((item) => Object.values(item.id).includes(type[0].id));

            const arr = JSON.parse(JSON.stringify(bookmarksStore.statistics));

            arr.splice(index, 1);

            await bookmarksStore.set_syncStorage({ statistics: arr });

            bookmarksStore.statistics = cloneDeep(arr);

            buildBookmarks();
        }
    });

    onMounted(async () => {
        const response = await bookmarksStore.get_syncStorage('statistics');

        if (response) {
            bookmarksStore.statistics = toArray(response);

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

        @media (min-width: 1024px) {
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
