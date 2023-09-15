<template>
    <div class="toolbar flex">
        <div>
            <v-btn
                :color="'primary'"
                @click="dialog = true">Add Bookmark</v-btn>
        </div>
        <v-btn icon="mdi-wrench" size="small"></v-btn>
    </div>

    <Teleport to="body">
        <template>
            <v-row justify="center">
                <v-dialog
                    v-model="dialog"
                    persistent
                    width="450">
                    <BookmarkForm
                        :data="editBookmarkData"
                        @close="dialog = false"
                        @save="onSave()" />
                </v-dialog>
            </v-row>
        </template>
    </Teleport>
</template>

<script setup>
    import { ref, watch } from 'vue';
    import BookmarkForm from '@/components/forms/BookmarkForm.vue';
    import useEventsBus from '@cmp/eventBus';
    import { EMITS } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();

    const { bus } = useEventsBus();

    const dialog = ref(false);
    const editBookmarkData = ref();

    function onSave() {
        dialog.value = false;
    }

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
                dialog.value = true;
            })
            .catch((error) => {
                console.error(error);
            });
    });
</script>

<style scoped lang="scss">
.toolbar {
    padding: 20px;
    position: fixed;
    width: 100%;
    z-index: 999;

    > div:first-child {
        flex: 1;
    }
}
</style>
