<template>
    <div class="popular" v-if="bookmarksStore.bookmarks">
        <div v-for="(item, index) in bookmarks" :key="index">
            <BookmarkLink
                :tabIndex="``"
                size="smaller"
                hideEdit
                :bookmark="item" />
        </div>
    </div>
</template>

<script setup>
    import BookmarkLink from '@/components/bookmarks/sharedComponents/BookmarkLink.vue';
    import { onMounted, ref } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { toArray } from 'lodash';

    const bookmarksStore = useBookmarksStore();

    const bookmarks = ref([]);

    onMounted(() => {
        const topThree = bookmarksStore.statistics.slice(0, 3);
        const bookmarksFlatArr = bookmarksStore.bookmarks.flatMap((obj) => obj.children);

        topThree.forEach((item) => {
            const arr = toArray(item.id);

            arr.forEach((item2) => {
                const bookmark = bookmarksFlatArr.find((e) => e.id === item2);

                if (bookmark) {
                    bookmarks.value.push(bookmark);
                }
            });
        });
    });
</script>

<style scoped lang="scss">
    .popular {
        background-color: rgb(var(--v-theme-surface));
        border-radius: 10px;
        bottom: 20px;
        box-shadow: 0px 1px 5px 0px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.25));
        left: -84px;
        padding: 6px 10px 0;
        position: fixed;
        z-index: 999;
        transition: left .35s;

        @media (min-width: 1024px) {
            left: 20px;
        }
    }
</style>
