<template>
    <div class="toolbar d-flex" v-if="ready">
        <div>
            <v-btn
                :color="'primary'"
                size="large"
                @click="dialogAddOpen = true">Add Bookmark</v-btn>
            <BookmarksSearch
                class="ml-5"
                v-if="bookmarksStore.searchNavigation" />
        </div>
        <v-btn
            icon="mdi-wrench"
            @click="dialogSettings = true"></v-btn>
    </div>

    <Teleport to="body">
        <template>
            <v-row justify="center">
                <v-dialog
                    v-model="dialogAddOpen"
                    persistent
                    width="450">
                    <BookmarkForm
                        :data="editBookmarkData"
                        @close="dialogAddOpen = false"
                        @save="dialogAddOpen = false" />
                </v-dialog>
                <v-dialog
                    v-model="dialogSettings"
                    persistent
                    width="450">
                    <BookmarkSettingsForm
                        @close="dialogSettings = false"
                        @save="dialogSettings = false" />
                </v-dialog>
            </v-row>
        </template>
    </Teleport>
</template>

<script setup>
    import { ref, watch, onMounted } from 'vue';
    import BookmarkForm from '@/components/forms/BookmarkForm.vue';
    import BookmarkSettingsForm from '@/components/forms/BookmarkSettingsForm.vue';
    import useEventsBus from '@cmp/eventBus';
    import { EMITS } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';
    import BookmarksSearch from '@/components/navigation/BookmarksSearch.vue';

    const bookmarksStore = useBookmarksStore();

    const { bus } = useEventsBus();

    const dialogAddOpen = ref(false);
    const dialogSettings = ref(false);
    const ready = ref(false);

    const editBookmarkData = ref();

    watch(() => bus.value.get(EMITS.EDIT), (id) => {
        const promiseArr = [
            bookmarksStore.get_bookmarkById(id[0]),
            bookmarksStore.get_localStorage(id[0]),
        ];

        Promise.all(promiseArr)
            .then((results) => {
                editBookmarkData.value = {
                    id: results[0].id,
                    image: results[1]?.image,
                    title: results[0].title,
                    url: results[0].url,
                    parentId: results[0].parentId,
                };
                dialogAddOpen.value = true;
            })
            .catch((error) => {
                console.error(error);
            });
    });

    watch(dialogAddOpen, (val) => {
        if (!val) {
            editBookmarkData.value = null;
        }
    });

    onMounted(async () => {
        ready.value = true;
    });
</script>

<style scoped lang="scss">
    .toolbar {
        $breakpoint: 540px;

        padding: 20px;
        position: fixed;
        width: 100%;
        z-index: 999;
        width: $breakpoint;

        @media (min-width: $breakpoint) {
                width: 100%;
            }

        > div:first-child {
            display: flex;
            flex: 1;
        }
    }
</style>
