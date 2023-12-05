<template>
    <div class="toolbar d-flex" v-if="ready">
        <div>
            <v-btn
                class="toolbar-add-button"
                icon="mdi-star"
                @click="dialogAddOpen = true"></v-btn>
            <BookmarksFilter
                class="toolbar-filter-input"
                v-if="bookmarksStore.searchNavigation" />
        </div>
        <div>
            <v-btn
                class="toolbar-settings-button"
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
    import BookmarksFilter from '@/components/fields/Filter.vue';
    import { useUtils } from '@/shared/utils/utils';
    import BookmarkConfirmDelete
        from '@/components/forms/BookmarkConfirmDelete.vue';

    const utils = useUtils();

    const { bus } = useEventsBus();

    const dialogSettings = ref(false);

    const showClearbitError = ref(false);
    const showClearbitDomain = ref();

    function onClearbitError(event) {
        showClearbitDomain.value = event;
        showClearbitError.value = true;
    }

    const deleteConfirmId = ref('');
    const deleteConfirmTitle = ref('');
    const showConfirmDelete = ref(false);

    function onDelete(event) {
        deleteConfirmTitle.value = event.title;
        deleteConfirmId.value = event.id;
        showConfirmDelete.value = true;
    }

    const bookmarksStore = useBookmarksStore();
    const dialogAddOpen = ref(false);

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

    const folderPreSelected = ref();

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

    const ready = ref(false);

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
        justify-content: center;
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
            top: 45px;
        }

        > div:first-child {
            flex: 0 1 calc(100% - 90px);
        }

        &-add-button {
            color: var(--yellow);
        }

        &-filter-input {
            left: 20px;
            position: relative;
        }
    }

    .error-icon {
        color: rgb(var(--v-theme-error));
        font-size: 60px;
    }
</style>
