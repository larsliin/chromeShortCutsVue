<template>
    <div class="toolbar d-flex" v-if="ready">
        <div>
            <v-btn
                class="toolbar-add-button"
                :icon="mdiStar"
                @click="dialogAddOpen = true" />
            <BookmarksFilter
                class="toolbar-filter-input" />
        </div>
        <div>
            <v-btn
                class="toolbar-group-button"
                :icon="mdiFolderMultiple"
                :title="bookmarksStore.groupMode ? 'Disable group mode' : 'Enable group mode'"
                @click="onToggleGroupMode()" />
            <v-btn
                class="toolbar-settings-button"
                :icon="mdiWrench"
                @click="dialogSettings = true" />
        </div>
    </div>
    <Teleport to="body"
        v-if="dialogAddOpen || dialogSettings">
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
    <Teleport to="body"
        v-if="showClearbitError">
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
                                    :icon="mdiAlertCircleOutline" />
                            </div>
                            <p class="text-center text-body-1 mt-3 mb-3">
                                The icon generator service could not recognize the provided domain
                            </p>
                            <p class="text-body-1 mt-3 mb-3 text-center">
                                <template v-if="showClearbitDomain">
                                    {{ getDomainFromUrl(showClearbitDomain) }}
                                </template>
                            </p>
                            <p class="text-center text-body-1 mt-3">
                                Please upload an icon manually by clicking the Browse button
                            </p>
                        </v-card-text>
                        <v-spacer class="mt-2 mb-2" />
                        <v-divider />
                        <v-card-actions>
                            <v-spacer class="mt-2 mb-2" />
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
    <Teleport to="body"
        v-if="showConfirmDelete">
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
                        :typeFolder="deleteConfirmIsFolder"
                        @cancel="showConfirmDelete = false"
                        @confirm="onDeleteConfirm($event)" />
                </v-dialog>
            </v-row>
        </template>
    </Teleport>
</template>

<script setup lang="ts">
    import {
        mdiStar,
        mdiWrench,
        mdiAlertCircleOutline,
        mdiFolderMultiple,
    } from '@mdi/js';
    import {
        ref, watch, onMounted, onUnmounted,
    } from 'vue';
    import BookmarkCreateForm from '@/components/forms/BookmarkCreateForm.vue';
    import BookmarkSettingsForm from '@/components/forms/BookmarkSettingsForm.vue';
    import emitter from '@cmp/eventBus';
    import { EMITS, TIMEOUTS } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { getDomainFromUrl } from '@utils/urlUtils';
    import BookmarkConfirmDelete
        from '@/components/forms/BookmarkConfirmDelete.vue';
    import BookmarksFilter from '@/components/fields/BookmarksFilter.vue';

    const dialogSettings = ref(false);

    const showClearbitError = ref(false);
    const showClearbitDomain = ref();

    function onClearbitError(event: string): void {
        showClearbitDomain.value = event;
        showClearbitError.value = true;
    }

    const deleteConfirmId = ref('');
    const deleteConfirmTitle = ref('');
    const deleteConfirmIsFolder = ref(false);
    const showConfirmDelete = ref(false);
    const bookmarksStore = useBookmarksStore();

    async function onDelete(event: { title: string; id: string }): Promise<void> {
        deleteConfirmTitle.value = event.title;
        deleteConfirmId.value = event.id;

        const bookmark = await bookmarksStore.getBookmarkById(event.id);
        deleteConfirmIsFolder.value = !bookmark?.url;

        showConfirmDelete.value = true;
    }

    const dialogAddOpen = ref(false);

    async function onDeleteConfirm(id: string): Promise<void> {
        deleteConfirmTitle.value = '';
        deleteConfirmId.value = '';
        showConfirmDelete.value = false;
        dialogAddOpen.value = false;

        const bookmarkResponse = await bookmarksStore.getBookmarkById(id);
        const bookmark = bookmarkResponse;

        if (bookmark && bookmark.url) {
            bookmarksStore.removeBookmark(bookmark.id);
            bookmarksStore.deleteLocalStorageItem(bookmark.id);
        } else {
            bookmarksStore.removeBookmarkFolder(bookmark.id);
        }
    }

    const editBookmarkData = ref();

    async function onEditHandler(id: string): Promise<void> {
        const [bookmark, localData] = await Promise.all([
            bookmarksStore.getBookmarkById(id),
            bookmarksStore.getLocalStorage(id),
        ]);

        editBookmarkData.value = {
            id: bookmark.id,
            image: (localData as { image?: string } | undefined)?.image,
            title: bookmark.title,
            url: bookmark.url,
            parentId: bookmark.parentId,
        };
        dialogAddOpen.value = true;
    }

    const folderPreSelected = ref();

    function onBookmarkAddHandler(folderId: string): void {
        folderPreSelected.value = folderId;

        dialogAddOpen.value = true;
    }

    function onClickBackgroundHandler(): void {
        dialogAddOpen.value = true;
    }

    function onToggleGroupMode(): void {
        bookmarksStore.groupMode = !bookmarksStore.groupMode;
    }

    watch(dialogAddOpen, (val) => {
        if (!val) {
            // wait with resetting until modal has finished close animation
            setTimeout(() => {
                editBookmarkData.value = null;
                folderPreSelected.value = null;
            }, TIMEOUTS.DIALOG_CLOSE_MS);
        }
    });

    const ready = ref(false);

    onUnmounted(() => {
        emitter.off(EMITS.EDIT, onEditHandler);
        emitter.off(EMITS.BOOKMARK_ADD, onBookmarkAddHandler);
        emitter.off(EMITS.CLICK_BACKGROUND, onClickBackgroundHandler);
    });

    onMounted(async () => {
        emitter.on(EMITS.EDIT, onEditHandler);
        emitter.on(EMITS.BOOKMARK_ADD, onBookmarkAddHandler);
        emitter.on(EMITS.CLICK_BACKGROUND, onClickBackgroundHandler);

        ready.value = true;
    });
</script>

<style scoped lang="scss">
    .add-bookmark-btn.v-btn.v-btn--density-default {
        height: calc(var(--v-btn-height) + 3px);
    }

    .toolbar {
        $breakpoint: 540px;

        box-sizing: border-box;
        height: 0;
        justify-content: center;
        position: fixed;
        width: $breakpoint;
        padding-inline: 20px;
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

        > div:last-child {
            gap: 6px;
        }

        > div:first-child {
            flex: 0 1 calc(100% - 90px);
        }

        &-add-button {
            color: var(--yellow);
        }

        &-group-button {
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
