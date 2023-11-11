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
                    width="800">
                    <BookmarkCreateForm
                        :data="editBookmarkData"
                        :folderPreSelected="folderPreSelected"
                        @clearbitError="onClearbitError($event)"
                        @close="dialogAddOpen = false"
                        @delete="onDelete($event)"
                        @save="dialogAddOpen = false" />
                </v-dialog>
                <v-dialog
                    v-model="dialogSettings"
                    persistent
                    width="800">
                    <BookmarkSettingsForm
                        @close="dialogSettings = false"
                        @save="dialogSettings = false" />
                </v-dialog>
            </v-row>
        </template>
    </Teleport>
    <Teleport to="body">
        <template>
            <v-row justify="center">
                <v-dialog
                    v-model="showClearbitError"
                    persistent
                    width="450">
                    <v-card>
                        <v-card-text>
                            <div class="text-center">
                                <!-- https://pictogrammers.com/library/mdi/ -->
                                <v-icon
                                    class="error-icon"
                                    size="large"
                                    icon="mdi-alert-circle-outline"></v-icon>
                            </div>
                            <p class="text-center text-body-1 mt-3 mb-3">
                                The icon generator service could not recognize the provided domain
                            </p>
                            <p class="text-body-1 mt-3 mb-3 text-center">
                                <template v-if="showClearbitDomain">
                                    {{ utils.getDomainFromUrl(showClearbitDomain) }}
                                </template>
                            </p>
                            <p class="text-center text-body-1 mt-3">
                                Please upload an icon manually by clicking the Browse button
                            </p>
                        </v-card-text>
                        <v-spacer class="mt-2 mb-2" />
                        <v-divider></v-divider>
                        <v-card-actions>
                            <v-spacer  class="mt-2 mb-2" />
                            <v-btn
                                variant="text"
                                @click="showClearbitError = false; showClearbitDomain = undefined">
                                Close
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>
            </v-row>
        </template>
    </Teleport>
    <Teleport to="body">
        <template>
            <v-row justify="center">
                <v-dialog
                    v-if="deleteConfirmId && showConfirmDelete"
                    v-model="showConfirmDelete"
                    persistent
                    width="450">
                    <BookmarkConfirmDelete
                        :title="deleteConfirmTitle"
                        :id="deleteConfirmId"
                        @cancel="showConfirmDelete = false"
                        @confirm="onDeleteConfirm($event)" />
                </v-dialog>
            </v-row>
        </template>
    </Teleport>
</template>

<script setup>
    import {
        ref, watch, onMounted,
    } from 'vue';
    import BookmarkCreateForm from '@/components/forms/BookmarkCreateForm.vue';
    import BookmarkSettingsForm from '@/components/forms/BookmarkSettingsForm.vue';
    import useEventsBus from '@cmp/eventBus';
    import { EMITS } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';
    import BookmarksFilter from '@/components/fields/BookmarksFilter.vue';
    import { useUtils } from '@/shared/utils/utils';
    import BookmarkConfirmDelete
        from '@/components/forms/BookmarkConfirmDelete.vue';

    const utils = useUtils();

    const bookmarksStore = useBookmarksStore();

    const { bus } = useEventsBus();

    const showConfirmDelete = ref(false);
    const dialogAddOpen = ref(false);
    const dialogSettings = ref(false);
    const ready = ref(false);
    const folderPreSelected = ref();
    const deleteConfirmTitle = ref('');
    const deleteConfirmId = ref('');

    const showClearbitError = ref(false);
    const showClearbitDomain = ref();

    const editBookmarkData = ref();

    function onClearbitError(event) {
        showClearbitDomain.value = event;
        showClearbitError.value = true;
    }

    function onDelete(event) {
        console.log(event);

        deleteConfirmTitle.value = event.title;
        deleteConfirmId.value = event.id;
        showConfirmDelete.value = true;
    }

    async function onDeleteConfirm(id) {
        deleteConfirmTitle.value = null;
        deleteConfirmId.value = null;
        showConfirmDelete.value = false;
        dialogAddOpen.value = false;

        const bookmarkResponse = await bookmarksStore.get_bookmarkById(id);
        const bookmark = bookmarkResponse;

        if (bookmark && bookmark.url) {
            bookmarksStore.remove_bookmark(bookmark.id);
            bookmarksStore.delete_localStorageItem(bookmark.id);
        } else {
            bookmarksStore.remove_bookmarkFolder(bookmark.id);
        }
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
                dialogAddOpen.value = true;
            })
            .catch((error) => {
                console.error(error);
            });
    });

    watch(() => bus.value.get(EMITS.BOOKMARK_ADD), (folderId) => {
        // eslint-disable-next-line prefer-destructuring
        folderPreSelected.value = folderId[0];

        dialogAddOpen.value = true;
    });

    watch(() => bus.value.get(EMITS.CLICK_BACKGROUND), () => {
        dialogAddOpen.value = true;
    });

    watch(dialogAddOpen, (val) => {
        if (!val) {
            // wait with resetting until modal has finished close animation
            setTimeout(() => {
                editBookmarkData.value = null;
                folderPreSelected.value = null;
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

    .error-icon {
        color: rgb(var(--v-theme-error));
        font-size: 60px;
    }
</style>
