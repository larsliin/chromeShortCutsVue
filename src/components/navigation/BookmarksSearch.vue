<template>
    <div class="wrapper">
        <v-text-field
            label="Filter"
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
    import { ref, onMounted, watch } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import useEventsBus from '@cmp/eventBus';
    import { EMITS } from '@/constants';

    const { bus } = useEventsBus();

    const bookmarksStore = useBookmarksStore();

    const bookmarkSearch = ref();

    async function onClear() {
        const bookmarksResponse = await bookmarksStore.get_bookmarks(bookmarksStore.rootId);

        bookmarksStore.bookmarks = bookmarksResponse[0].children;
    }

    // Filter the data
    async function onUpdate(event = '') {
        const bookmarksResponse = await bookmarksStore.get_bookmarks(bookmarksStore.rootId);

        bookmarksStore.sliderIndex = 0;

        if (!event) {
            bookmarksStore.bookmarks = bookmarksResponse[0].children;

            return;
        }

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
    }

    const isEnabled = ref(false);

    watch(() => bus.value.get(EMITS.BOOKMARKS_UPDATED), async (action) => {
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
