<template>
    <v-card>
        <v-form ref="form" fast-fail @submit.prevent>
            <v-card-text>
                <v-container>
                    <v-row>
                        <v-col
                            cols="12">
                            <span class="text-h5">Settings</span>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col
                            cols="12">
                            <v-checkbox
                                label="Enable Arrov Navigation"
                                v-model="enableArrowNavigation" />
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col
                            cols="12">
                            <p
                                class="text-body-1 mb-5">
                                Import bookmarks and icons data file
                            </p>
                            <v-file-input
                                label="File input"
                                prepend-icon="mdi-download"
                                v-model="fileImport"></v-file-input>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col
                            cols="12">
                            <p
                                class="text-body-1 mb-5">
                                Export bookmarks and icons data file
                            </p>
                            <v-btn
                                color="blue-darken-1"
                                variant="tonal"
                                prepend-icon="mdi-upload"
                                @click="onClickExport()">
                                Export
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    color="blue-darken-1"
                    variant="text"
                    @click="$emit(EMITS.CLOSE)">
                    Close
                </v-btn>
                <v-btn
                    color="blue-darken-1"
                    variant="text"
                    @click="onClickSave()">
                    Save
                </v-btn>
            </v-card-actions>
        </v-form>
    </v-card>
</template>

<script setup>
    import { ref, onMounted } from 'vue';
    import { EMITS } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { useUtils } from '@/shared/utils/utils';

    const utils = useUtils();

    const emits = defineEmits([EMITS.CLOSE, EMITS.SAVE]);

    const bookmarksStore = useBookmarksStore();

    const form = ref();
    const enableArrowNavigation = ref();
    const fileImport = ref();

    function onClickExport() {
        const jsonString = JSON.stringify(bookmarksStore.bookmarks);

        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([jsonString], { type: 'application/json' }));
        a.download = 'bookmarks-exported-v2.json';
        a.click();
    }

    async function updateBookmarksStore() {
        const bookmarksResponse = await bookmarksStore.get_bookmarks(bookmarksStore.rootId);
        bookmarksStore.bookmarks = bookmarksResponse[0].children;
    }

    async function onImportIconsReaderLoad(event) {
        bookmarksStore.isImporting = true;

        await utils.deleteLocalStoreImages();
        await utils.deleteAllBookmarks();

        const importBookmarks = JSON.parse(event.target.result);

        const bookmarksRootResponse = await bookmarksStore.get_bookmarkById(bookmarksStore.rootId);

        const map = {};

        const foldersPromiseArr = [];
        // first create folders for bookmarks
        importBookmarks.forEach((folder) => {
            foldersPromiseArr.push(bookmarksStore
                .create_bookmark(bookmarksRootResponse.id, folder.title));
        });

        Promise.all(foldersPromiseArr)
            .then((p) => {
                // put all bookmarks children in a flat array for easier iteration
                const bookmarksFlatArr = importBookmarks.flatMap((obj) => obj.children);

                // map old parent folder id to new folder id create in the step before
                p.forEach((f, i) => {
                    map[importBookmarks[i].id] = f.id;
                });

                const bookmarkssPromiseArr = [];
                // then create bookmarks ad add to folders created before
                bookmarksFlatArr.forEach((bookmark) => {
                    bookmarkssPromiseArr.push(bookmarksStore
                        .create_bookmark(map[bookmark.parentId], bookmark.title, bookmark.url));
                });

                Promise.all(bookmarkssPromiseArr)
                    .then(() => {
                        updateBookmarksStore();

                        bookmarksStore.isImporting = false;
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            })
            .catch((error) => {
                console.error(error);
            });
    }

    function onClickSave() {
        // import
        if (fileImport.value) {
            const reader = new FileReader();
            reader.onload = onImportIconsReaderLoad;
            reader.readAsText(fileImport.value[0]);
        }

        // arrow navigation
        bookmarksStore.arrowNavigation = enableArrowNavigation.value;

        if (!enableArrowNavigation.value) {
            bookmarksStore.set_localStorage({ arrowNavigation: false });
        } else {
            bookmarksStore.delete_localStorageItem('arrowNavigation');
        }

        emits(EMITS.SAVE);
    }

    onMounted(async () => {
        enableArrowNavigation.value = bookmarksStore.arrowNavigation;
    });
</script>
