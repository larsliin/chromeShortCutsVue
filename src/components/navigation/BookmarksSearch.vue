<template>
    <div class="wrapper">
        <v-combobox
            :items="bookmarks"
            label="Search"
            single-line
            clearable
            density="compact"
            variant="solo"
            :disabled="!bookmarksStore.bookmarks
                || bookmarksStore.bookmarks.length === 0"
            v-model="bookmarkSearch"
            @update:modelValue="onUpdate($event)">
        </v-combobox>
    </div>
</template>

<script setup>
    import { ref, onMounted, watch } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { useUtils } from '@/shared/utils/utils';

    const utils = useUtils();

    const bookmarksStore = useBookmarksStore();

    const bookmarkSearch = ref();
    const bookmarks = ref();

    function onUpdate(event) {
        if (event && event.title) {
            window.location.href = event.value;
        }
    }

    async function load() {
        const bookmarksFlapMap = await utils.getBookmarksAsFlatArr();
        if (bookmarksFlapMap) {
            bookmarks.value = bookmarksFlapMap.map((e) => ({ title: e.title, value: e.url }));
        } else {
            bookmarks.value = undefined;
        }
    }

    watch(() => bookmarksStore.bookmarks, async () => {
        load();
    });

    onMounted(() => {
        load();
    });

</script>

<style scoped lang="scss">
.wrapper {
    // bottom: 0;
    // left: 20px;
    // position: absolute;
    width: 220px;
    //z-index: 999;
}
</style>
