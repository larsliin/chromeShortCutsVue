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
                            cols="6">
                            <v-row>
                                <v-col
                                    cols="12">
                                    <p
                                        class="text-body-1 mb-5">
                                        Import bookmarks data file
                                    </p>
                                    <v-file-input
                                        @click:clear="clearFileInput()"
                                        :disabled="iconsFileImport"
                                        label="Bookmarks Data File"
                                        prepend-icon="mdi-download"
                                        v-model="bookmarksFileImport"></v-file-input>
                                </v-col>
                            </v-row>
                            <v-row>
                                <v-col
                                    cols="12">
                                    <p
                                        class="text-body-1 mb-2">
                                        Export bookmarks data file
                                    </p>
                                    <v-btn
                                        color="blue-darken-1"
                                        variant="tonal"
                                        prepend-icon="mdi-upload"
                                        @click="onClickExportBookmarks()">
                                        Export Bookmarks
                                    </v-btn>
                                </v-col>
                            </v-row>
                            <v-row>
                                <v-col
                                    cols="12">
                                    <p
                                        class="text-body-1 mb-2">
                                        Import icons data file
                                    </p>
                                    <v-file-input
                                        @click:clear="clearFileInput()"
                                        :disabled="bookmarksFileImport"
                                        label="Icons Data File input"
                                        prepend-icon="mdi-download"
                                        v-model="iconsFileImport"></v-file-input>
                                </v-col>
                            </v-row>
                            <v-row>
                                <v-col
                                    cols="12">
                                    <p
                                        class="text-body-1 mb-5">
                                        Export icons data file
                                    </p>
                                    <v-btn
                                        color="blue-darken-1"
                                        variant="tonal"
                                        prepend-icon="mdi-upload"
                                        @click="onClickExportIcons()">
                                        Export Icons
                                    </v-btn>
                                </v-col>
                            </v-row>
                        </v-col>
                        <v-col
                            cols="6">
                            <v-row>
                                <v-col
                                    cols="12">
                                    <v-switch
                                        label="Dark Mode"
                                        color="info"
                                        hide-details="auto"
                                        v-model="enableDarkMode"></v-switch>
                                    <v-switch
                                        label="Use accordion navigation"
                                        color="info"
                                        hide-details="auto"
                                        v-model="enableAccordionNavigation"></v-switch>
                                    <v-switch
                                        label="Enable Arrov Navigation"
                                        color="info"
                                        hide-details="auto"
                                        :disabled="enableAccordionNavigation"
                                        v-model="enableArrowNavigation"></v-switch>
                                    <v-switch
                                        label="Enable Filtering"
                                        color="info"
                                        hide-details="auto"
                                        v-model="enableSearchNavigation"></v-switch>
                                </v-col>
                            </v-row>
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
    <v-dialog
        v-model="errorDialog"
        width="auto">
        <v-card>
            <v-card-title>
                <h3 class="text-h5 mt-4 ml-2 mr-2">
                    Import Error
                </h3>
            </v-card-title>
            <v-card-text>
                <p class="text-body-1">
                    The selected import file is malformed.<br />
                    Please export a new version and try again.
                </p>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    class="float-right"
                    color="primary"
                    variant="text"
                    @click="errorDialog = false">
                    Close
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
    import { ref, onMounted, watch } from 'vue';
    import { EMITS } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';
    import useEventsBus from '@cmp/eventBus';
    import { useUtils } from '@/shared/utils/utils';
    import { useTheme } from 'vuetify';

    const theme = useTheme();

    const utils = useUtils();

    const { emit } = useEventsBus();

    const emits = defineEmits([EMITS.CLOSE, EMITS.SAVE]);

    const bookmarksStore = useBookmarksStore();

    const form = ref();
    const enableArrowNavigation = ref();
    const enableDarkMode = ref();
    const enableAccordionNavigation = ref();
    const enableSearchNavigation = ref();

    const bookmarksFileImport = ref();
    const isBookmarksFileValid = ref(false);
    const errorDialog = ref(false);

    const iconsFileImport = ref();
    const isIconsFileValid = ref();

    function clearFileInput() {
        iconsFileImport.value = null;
        bookmarksFileImport.value = null;
    }

    async function onClickExportIcons() {
        const localStorageItems = await bookmarksStore.get_localStorageAll(null);
        const localStorageItemsImageArr = Object.values(localStorageItems).filter((e) => e.image);

        const jsonString = JSON.stringify(localStorageItemsImageArr);

        const a = document.createElement('a');

        a.href = URL.createObjectURL(new Blob([jsonString], { type: 'application/json' }));
        a.download = 'bookmark-icons-exported.json';
        a.click();
    }

    async function onClickExportBookmarks() {
        const exportBookmarks = bookmarksStore.bookmarks;

        // fetch all images from local storage
        const localStorageItems = await bookmarksStore.get_localStorageAll(null);
        const localStorageItemsImageArr = Object.values(localStorageItems).filter((e) => e.image);

        // add images to each bookmark in exported bookmarks to
        localStorageItemsImageArr.forEach((localitem) => {
            const bookmark = exportBookmarks
                .map((outerItem) => outerItem.children.find((child) => child.id === localitem.id))
                .filter((childItem) => childItem !== undefined)[0];

            if (bookmark) {
                bookmark.image = localitem.image;
            }
        });

        // run exporter
        const jsonString = JSON.stringify(exportBookmarks);

        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([jsonString], { type: 'application/json' }));
        a.download = 'bookmarks-exported.json';
        a.click();
    }

    // update global store bookmarks obj with the latest imported bookmarks
    async function updateBookmarksStore() {
        const bookmarksResponse = await bookmarksStore.get_bookmarks(bookmarksStore.rootId);

        bookmarksStore.bookmarks = bookmarksResponse[0].children;

        emit(EMITS.BOOKMARKS_UPDATED, 'import');
    }

    // save imported images
    async function saveImages(results, images) {
        const promiseArr = [];
        results.forEach((item, index) => {
            if (images[index]) {
                promiseArr.push(bookmarksStore.set_localStorage({
                    [item.id]: {
                        id: item.id,
                        parentId: item.parentId,
                        image: images[index],
                        url: item.url,
                        title: item.title,
                    },
                }));
            }
        });

        Promise.all(promiseArr)
            .then(() => {
                // when all images are saved then update bookmarks
                updateBookmarksStore();

                bookmarksStore.isImporting = false;
            })
            .catch((error) => {
                console.error(error);
            });
    }

    // import bookmarks
    async function onBookmarksImportReaderLoad(event) {
        bookmarksStore.isImporting = true;

        const importBookmarks = JSON.parse(event.target.result);

        await utils.deleteLocalStoreImages();
        await utils.deleteAllBookmarks();
        await utils.buildRootFolder();

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

                const imagesArr = [];

                const bookmarkssPromiseArr = [];
                // then create bookmarks ad add to folders created before
                bookmarksFlatArr.forEach((bookmark) => {
                    bookmarkssPromiseArr.push(bookmarksStore
                        .create_bookmark(map[bookmark.parentId], bookmark.title, bookmark.url));

                    imagesArr.push(bookmark.image);
                });

                Promise.all(bookmarkssPromiseArr)
                    .then((results) => {
                        saveImages(results, imagesArr);
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            })
            .catch((error) => {
                console.error(error);
            });
    }

    // import bookmarks
    async function onIconsImportReaderLoad(event) {
        bookmarksStore.isImporting = true;

        const importIcons = JSON.parse(event.target.result);

        const bookmarksFlatResponse = await utils.getBookmarksAsFlatArr();

        const promiseAllArr = [];

        importIcons.forEach((item) => {
            const bookmarkId = bookmarksFlatResponse
                .find((e) => item.url === e.url);

            promiseAllArr.push(bookmarksStore.set_localStorage({
                [bookmarkId.id]: {
                    id: bookmarkId.id,
                    parentId: item.parentId,
                    image: item.image,
                    url: item.url,
                    title: item.title,
                },
            }));
        });

        Promise.all(promiseAllArr)
            .then(() => {
                emit(EMITS.IMAGES_IMPORT);
            })
            .catch((error) => {
                console.error(error);
            });
    }

    function onClickSave() {
        // import
        if (bookmarksFileImport.value && isBookmarksFileValid.value) {
            const reader = new FileReader();
            reader.onload = onBookmarksImportReaderLoad;
            reader.readAsText(bookmarksFileImport.value[0]);
        }

        if (iconsFileImport.value) {
            const reader = new FileReader();
            reader.onload = onIconsImportReaderLoad;
            reader.readAsText(iconsFileImport.value[0]);
        }

        bookmarksStore.enableDarkMode = enableDarkMode.value;

        if (enableDarkMode.value) {
            bookmarksStore.set_syncStorage({ darkMode: true });
        } else {
            bookmarksStore.delete_syncStorageItem('darkMode');
        }
        theme.global.name.value = enableDarkMode.value ? 'dark' : 'light';

        bookmarksStore.accordionNavigation = enableAccordionNavigation.value;

        if (enableAccordionNavigation.value) {
            bookmarksStore.delete_syncStorageItem('accordionNavigation');
            bookmarksStore.set_syncStorage({ accordion: [bookmarksStore.sliderIndex] });
        } else {
            bookmarksStore.set_syncStorage({ accordionNavigation: 'disabled' });
            bookmarksStore.delete_syncStorageItem('accordion');

            bookmarksStore.sliderIndex = 0;
            bookmarksStore.set_syncStorage({ sliderIndex: 0 });
        }

        // arrow navigation
        bookmarksStore.arrowNavigation = enableArrowNavigation.value;

        if (enableArrowNavigation.value) {
            bookmarksStore.delete_syncStorageItem('arrowNavigation');
        } else {
            bookmarksStore.set_syncStorage({ arrowNavigation: 'disabled' });
        }

        bookmarksStore.searchNavigation = enableSearchNavigation.value;

        if (enableSearchNavigation.value) {
            bookmarksStore.delete_syncStorageItem('searchNavigation');
        } else {
            bookmarksStore.set_syncStorage({ searchNavigation: 'disabled' });
        }

        emits(EMITS.SAVE);
    }

    function isImportBookmarksFileValid(obj) {
        const arr = [
            obj.some((e) => e.title),
            obj.some((e) => e.children),
            obj.some((e) => e.id),
            obj.some((e) => e.parentId),
        ];

        if (obj.children) {
            const bookmarksFlatArray = obj.flatMap((e) => e.children);

            if (bookmarksFlatArray.length) {
                arr.push(bookmarksFlatArray.some((e) => e.url));
                arr.push(bookmarksFlatArray.some((e) => e.title));
                arr.push(bookmarksFlatArray.some((e) => e.parentId));
                arr.push(bookmarksFlatArray.some((e) => e.id));
            }
        }

        return !arr.includes(false);
    }

    function isImportIconsFileValid(obj) {
        const arr = [
            obj.some((e) => e.id),
            obj.some((e) => e.image),
            obj.some((e) => e.parentId),
            obj.some((e) => e.title),
            obj.some((e) => e.url),
        ];

        return !arr.includes(false);
    }

    watch(bookmarksFileImport, (newVal) => {
        if (newVal) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const importBookmarks = JSON.parse(e.target.result);

                isBookmarksFileValid.value = isImportBookmarksFileValid(importBookmarks);

                if (!isBookmarksFileValid.value) {
                    errorDialog.value = true;
                }
            };
            reader.readAsText(bookmarksFileImport.value[0]);
        }
    });

    watch(iconsFileImport, (newVal) => {
        if (newVal) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const importIcons = JSON.parse(e.target.result);

                isIconsFileValid.value = isImportIconsFileValid(importIcons);

                if (!isIconsFileValid.value) {
                    errorDialog.value = true;
                }
            };
            reader.readAsText(iconsFileImport.value[0]);
        }
    });

    onMounted(async () => {
        enableArrowNavigation.value = bookmarksStore.arrowNavigation;
        enableSearchNavigation.value = bookmarksStore.searchNavigation;
        enableAccordionNavigation.value = bookmarksStore.accordionNavigation;
        enableDarkMode.value = bookmarksStore.enableDarkMode;
    });
</script>
