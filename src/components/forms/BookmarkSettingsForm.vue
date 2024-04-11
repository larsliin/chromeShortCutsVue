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
                                        Import bookmarks data file <ToolTip
                                            :tooltip="`Select bookmarks JSON
                                            data file to import bookmarks.<br />This
                                            will overwrite existing bookmarks`" />
                                    </p>
                                    <v-file-input
                                        @click:clear="clearFileInput()"
                                        :disabled="!!iconsFileImport"
                                        label="Bookmarks Data File"
                                        :prepend-icon="mdiDownload"
                                        v-model="bookmarksFileImport" />
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
                                        :prepend-icon="mdiUpload"
                                        :disabled="!bookmarksStore.bookmarks?.length"
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
                                        Import icons <ToolTip
                                            :tooltip="`Select icons JSON data file to import
                                            bookmark icons. This is useful<br />for importing
                                            icons on other devices that share the same<br />
                                            Google account, as icons are not synced across
                                            devices.<br />This will overwrite existing bookmark
                                            icons and colors!`" />
                                    </p>
                                    <v-file-input
                                        @click:clear="clearFileInput()"
                                        :disabled="!!bookmarksFileImport
                                            || !bookmarksStore.bookmarks?.length"
                                        label="Icons Data File input"
                                        :prepend-icon="mdiDownload"
                                        v-model="iconsFileImport" />
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
                                        :prepend-icon="mdiUpload"
                                        :disabled="!bookmarksStore.bookmarks?.length"
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
                                    <p>Dark mode color theme</p>
                                    <div class="switch-container">
                                        <v-switch
                                            label="Use OS Dark Mode Setting"
                                            color="info"
                                            hide-details="auto"
                                            v-model="enableSystemDarkMode" />
                                        <ToolTip
                                            tooltip="Use OS system Dark Mode setting.<br />
                                            If enabled this setting will override Prefer
                                            Dark Mode setting" />
                                    </div>
                                    <div class="switch-container">
                                        <v-switch
                                            label="Prefer Dark Mode"
                                            color="info"
                                            hide-details="auto"
                                            :disabled="enableSystemDarkMode"
                                            v-model="enablePreferDarkMode" />
                                        <ToolTip
                                            tooltip="Switch to Dark Mode theme" />
                                    </div>
                                    <p class="mt-5">Layout</p>
                                    <div class="switch-container">
                                        <v-switch
                                            label="Use accordion layout"
                                            color="info"
                                            hide-details="auto"
                                            v-model="enableAccordionNavigation" />
                                        <ToolTip
                                            tooltip="Toggle between Slider or Accordion layout" />
                                    </div>
                                </v-col>
                            </v-row>
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn
                    color="blue-darken-1"
                    variant="text"
                    @click="$emit(EMITS.CLOSE)">
                    Close
                </v-btn>
                <v-btn
                    color="blue-darken-1"
                    variant="tonal"
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
                <v-spacer />
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
    import { mdiDownload, mdiUpload } from '@mdi/js';
    import {
        ref, onMounted, watch, onUnmounted,
    } from 'vue';
    import { EMITS } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';
    import useEventsBus from '@cmp/eventBus';
    import { useUtils } from '@/shared/composables/utils';
    import { useTheme } from 'vuetify';
    import ToolTip from '@/components/fields/ToolTip.vue';

    const theme = useTheme();

    const utils = useUtils();

    const { emit } = useEventsBus();

    const emits = defineEmits([EMITS.CLOSE, EMITS.SAVE]);

    const bookmarksStore = useBookmarksStore();

    const form = ref();
    const enablePreferDarkMode = ref();
    const enableSystemDarkMode = ref();
    const enableAccordionNavigation = ref();

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

        const folderColorsResponse = await bookmarksStore.get_syncStorage('folderColors');
        const bookmarkColorsResponse = await bookmarksStore.get_syncStorage('bookmarkColors');

        let foldersWithColors = [];
        if (folderColorsResponse) {
            foldersWithColors = Object.entries(folderColorsResponse).map((e) => ({
                id: e[0],
                color: e[1],
                title: bookmarksStore.bookmarks.find((a) => a.id === e[0]).title,
            }));
        }

        let bookmarksWithColors = [];
        if (bookmarkColorsResponse) {
            bookmarksWithColors = localStorageItemsImageArr.map((obj) => ({
                ...obj,
                color: bookmarkColorsResponse[obj.id] || obj.color || null,
            }));
        }

        const exportArr = {
            folders: foldersWithColors,
            bookmarks: bookmarksWithColors,
            type: 'icons',
        };

        const jsonString = JSON.stringify(exportArr);

        const a = document.createElement('a');

        a.href = URL.createObjectURL(new Blob([jsonString], { type: 'application/json' }));
        a.download = 'bookmark-icons-exported.json';
        a.click();
    }

    async function onClickExportBookmarks() {
        const exportBookmarks = Array.from(bookmarksStore.bookmarks);

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
        const result = { bookmarks: exportBookmarks, type: 'bookmarks' };
        const jsonString = JSON.stringify(result);

        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([jsonString], { type: 'application/json' }));
        a.download = 'bookmarks-exported.json';
        a.click();
    }

    const colorsFoldersMap = {};
    const colorsBookmarksMap = {};

    // update global store bookmarks obj with the latest imported bookmarks
    async function updateBookmarksStore() {
        const bookmarksResponse = await bookmarksStore.get_bookmarks(bookmarksStore.rootId);

        bookmarksStore.bookmarks = bookmarksResponse[0].children;

        // inject imported colors into new bookmarks object
        Object.entries(colorsFoldersMap).forEach((item) => {
            const bookmarkFolder = bookmarksStore.bookmarks.find((e) => e.id === item[0]);
            if (bookmarkFolder) {
                const [, bookmarkFolderColor] = item;
                bookmarkFolder.color = bookmarkFolderColor;
            }
        });

        // save imported colors
        if (colorsFoldersMap && Object.keys(colorsFoldersMap).length) {
            bookmarksStore.set_syncStorage({ folderColors: colorsFoldersMap });
        }

        //
        // inject imported colors into new bookmarks object
        Object.entries(colorsBookmarksMap).forEach((item) => {
            const bookmarksFlatArr = bookmarksStore.bookmarks.flatMap((obj) => obj.children);
            const bookmark = bookmarksFlatArr.find((e) => e.id === item[0]);
            if (bookmark) {
                const [, bookmarkColor] = item;
                bookmark.color = bookmarkColor;
            }
        });

        // save imported colors
        if (colorsBookmarksMap && Object.keys(colorsBookmarksMap).length) {
            bookmarksStore.set_syncStorage({ bookmarkColors: colorsBookmarksMap });
        }

        emit(EMITS.BOOKMARKS_UPDATED, { type: 'import', id: '' });
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

    function onImportedFoldersCreated(promise, bookmarks) {
        const foldersMap = {};

        // put all bookmarks children in a flat array for easier iteration
        const bookmarksFlatArr = bookmarks.flatMap((obj) => obj.children);

        // map old parent folder id to new folder id created in the step before
        promise.forEach((f, i) => {
            foldersMap[bookmarks[i].id] = f.id;

            if (bookmarks[i].color) {
                colorsFoldersMap[f.id] = bookmarks[i].color;
            }
        });

        const imagesArr = [];

        const bookmarksPromiseArr = [];

        const bookmarksMap = {};

        // then create bookmarks and add to folders created before
        bookmarksFlatArr.forEach((bookmark) => {
            bookmarksPromiseArr.push(bookmarksStore
                .create_bookmark(foldersMap[bookmark.parentId], bookmark.title, bookmark.url));

            imagesArr.push(bookmark.image);
        });

        Promise.all(bookmarksPromiseArr)
            .then((result) => {
                result.forEach((f, i) => {
                    // map old bookmark id to new bookmark id created in the step before
                    bookmarksMap[bookmarksFlatArr[i].id] = f.id;

                    if (bookmarksFlatArr[i].color) {
                        colorsBookmarksMap[f.id] = bookmarksFlatArr[i].color;
                    }
                });
                bookmarksStore.accordionModel = [0];
                bookmarksStore.set_syncStorage({
                    accordion: [...bookmarksStore.accordionModel],
                });

                saveImages(result, imagesArr);
            })
            .catch((error) => {
                console.error(error);
            });
    }

    // import bookmarks
    async function onBookmarksImportReaderLoad(event) {
        bookmarksStore.isImporting = true;

        await utils.deleteLocalStoreImages();
        await utils.deleteAllBookmarks();
        await utils.buildRootFolder();

        await bookmarksStore.delete_syncStorageItem('folderColors');
        await bookmarksStore.delete_syncStorageItem('statistics');

        bookmarksStore.statistics = [];

        emit(EMITS.BOOKMARKS_IMPORT);

        const bookmarksRootResponse = await bookmarksStore.get_bookmarkById(bookmarksStore.rootId);

        const foldersPromiseArr = [];
        const importObj = JSON.parse(event.target.result);

        // first create folders for bookmarks
        importObj.bookmarks.forEach((folder) => {
            foldersPromiseArr.push(bookmarksStore
                .create_bookmark(bookmarksRootResponse.id, folder.title));
        });

        Promise.all(foldersPromiseArr)
            .then((result) => {
                onImportedFoldersCreated(result, importObj.bookmarks);
            })
            .catch((error) => {
                console.error(error);
            });
    }

    // import bookmarks
    async function onIconsImportReaderLoad(event) {
        bookmarksStore.isImporting = true;

        bookmarksStore.delete_syncStorageItem('bookmarkColors');
        bookmarksStore.delete_syncStorageItem('folderColors');

        const importIcons = JSON.parse(event.target.result);
        const bookmarksFlatResponse = await utils.getBookmarksAsFlatArr();

        const promiseAllArr = [];

        const colorArr = {};

        // bookmarks icon and color
        importIcons.bookmarks.forEach((item) => {
            const bookmarks = bookmarksFlatResponse
                .filter((e) => item.url === e.url);

            bookmarks.forEach((bookmark) => {
                if (bookmark) {
                    if (item.color) {
                        colorArr[bookmark.id] = item.color;
                    }

                    promiseAllArr.push(bookmarksStore.set_localStorage({
                        [bookmark.id]: {
                            id: bookmark.id,
                            parentId: item.parentId,
                            image: item.image,
                            url: item.url,
                            title: item.title,
                        },
                    }));
                }
            });
        });

        // save bookmarks colors to local storage
        bookmarksStore.set_syncStorage({ bookmarkColors: colorArr });

        // folders color
        const folderColorArr = {};

        importIcons.folders.forEach((item) => {
            const bookmark = bookmarksStore.bookmarks
                .find((e) => item.title === e.title);

            if (bookmark) {
                if (item.color) {
                    folderColorArr[bookmark.id] = item.color;
                }
            }
        });

        // save folders colors to local storage
        bookmarksStore.set_syncStorage({ folderColors: folderColorArr });

        // when all colors and images have been updated and loaded then emit event
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

        // enableSystemDarkMode
        bookmarksStore.enableSystemDarkMode = enableSystemDarkMode.value;

        if (enableSystemDarkMode.value) {
            bookmarksStore.set_syncStorage({ systemDarkMode: true });

            bookmarksStore.enableDarkMode = window
                .matchMedia('(prefers-color-scheme: dark)').matches;
        } else {
            bookmarksStore.delete_syncStorageItem('systemDarkMode');

            bookmarksStore.enableDarkMode = false;
        }

        // enablePreferDarkMode
        if (!enableSystemDarkMode.value) {
            bookmarksStore.enablePreferDarkMode = enablePreferDarkMode.value;
            bookmarksStore.enableDarkMode = bookmarksStore.enablePreferDarkMode;

            if (enablePreferDarkMode.value) {
                bookmarksStore.set_syncStorage({ darkMode: true });
            } else {
                bookmarksStore.delete_syncStorageItem('darkMode');
            }
        }
        theme.global.name.value = bookmarksStore.enableDarkMode ? 'dark' : 'light';

        // enableAccordionNavigation
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

        emits(EMITS.SAVE);
    }

    function isImportBookmarksFileValid(args) {
        if (args.type !== 'bookmarks' || !Array.isArray(args.bookmarks)) {
            return false;
        }

        const arr = [
            args.bookmarks.some((e) => e.title),
            args.bookmarks.some((e) => e.children),
            args.bookmarks.some((e) => e.id),
            args.bookmarks.some((e) => e.parentId),
        ];

        if (args.bookmarks.children) {
            const bookmarksFlatArray = args.bookmarks.flatMap((e) => e.children);

            if (bookmarksFlatArray.length) {
                arr.push(bookmarksFlatArray.some((e) => e.url));
                arr.push(bookmarksFlatArray.some((e) => e.title));
                arr.push(bookmarksFlatArray.some((e) => e.parentId));
                arr.push(bookmarksFlatArray.some((e) => e.id));
            }
        }

        return !arr.includes(false);
    }

    function isImportIconsFileValid(args) {
        return args.type === 'icons' && args.bookmarks && args.folders;
    }

    watch(bookmarksFileImport, (newVal) => {
        if (newVal) {
            if (!Object.keys(newVal).length) {
                bookmarksFileImport.value = null;
                return;
            }

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
            if (!Object.keys(newVal).length) {
                iconsFileImport.value = null;
                return;
            }

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
        enableAccordionNavigation.value = bookmarksStore.accordionNavigation;
        enablePreferDarkMode.value = bookmarksStore.enablePreferDarkMode;
        enableSystemDarkMode.value = bookmarksStore.enableSystemDarkMode;

        bookmarksStore.dialogOpen = true;
    });

    onUnmounted(() => {
        bookmarksStore.dialogOpen = false;
    });
</script>
<style lang="scss" scoped>
    .switch-container {
        display: flex;
        align-items: center;

        > div:first-child {
            flex-grow: 0;
        }
    }
</style>
