<template>
    <div class="toolbar d-flex" v-if="ready">
        <div>
            <v-btn
                class="add-bookmark-btn"
                :color="'primary'"
                size="large"
                @click="dialogAddOpen = true">Add Bookmark</v-btn>
            <BookmarksFilter
                class="ml-5"
                v-if="bookmarksStore.searchNavigation" />
        </div>
        <div>
            <v-btn
                icon="mdi-wrench"
                @click="dialogSettings = true"></v-btn>
        </div>
    </div>
    <Teleport to="body">
        <template>
            <v-row justify="center">
                <v-dialog
                    v-model="dialogAddOpen"
                    persistent
                    width="850">
                    <BookmarkForm
                        :data="editBookmarkData"
                        @close="dialogAddOpen = false"
                        @save="dialogAddOpen = false" />
                </v-dialog>
                <v-dialog
                    v-model="dialogSettings"
                    persistent
                    width="850">
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
    import BookmarksFilter from '@/components/fields/BookmarksFilter.vue';

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
            // wait with resetting until modal has finished close animation
            setTimeout(() => {
                editBookmarkData.value = null;
            }, 1000);
        }
    });

    onMounted(async () => {
        ready.value = true;
    });
</script>

<style scoped lang="scss">
    .add-bookmark-btn.v-btn.v-btn--density-default {
        height: calc(var(--v-btn-height) + 3px);
    }

    .toolbar {
        $breakpoint: 540px;

        height: 0;
        padding: 20px;
        position: fixed;
        width: $breakpoint;
        z-index: 999;

        @media (min-width: $breakpoint) {
                width: 100%;
            }

        > div {
            align-items: center;
            display: flex;
            position: relative;
            top: 20px;
        }

        > div:first-child {
            flex: 1;
        }
    }
</style>
