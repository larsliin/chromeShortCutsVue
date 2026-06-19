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
                            class="form-divider"
                            cols="6">
                            <div
                                class="pr-3">
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
                                            :disabled="!!$v.formData.iconsFileImport.$model"
                                            label="Bookmarks Data File"
                                            :prepend-icon="mdiDownload"
                                            v-model="$v.formData.bookmarksFileImport.$model" />
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
                                            :disabled="!bookmarksStore.hasBookmarks"
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
                                            :disabled="!!$v.formData.bookmarksFileImport.$model
                                                || !bookmarksStore.hasBookmarks"
                                            label="Icons Data File input"
                                            :prepend-icon="mdiDownload"
                                            v-model="$v.formData.iconsFileImport.$model" />
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
                                            :disabled="!bookmarksStore.hasBookmarks"
                                            @click="onClickExportIcons()">
                                            Export Icons
                                        </v-btn>
                                    </v-col>
                                </v-row>
                            </div>
                        </v-col>
                        <v-col
                            cols="6">
                            <div
                                class="pl-3">
                                <v-row>
                                    <v-col
                                        cols="12">
                                        <p>Dark mode color theme</p>
                                        <div class="switch-container">
                                            <v-switch
                                                label="Use OS dark mode setting"
                                                color="info"
                                                hide-details="auto"
                                                :disabled="formData.enablePreferDarkMode"
                                                v-model="$v.formData.enableSystemDarkMode.$model" />
                                            <ToolTip
                                                tooltip="Use the operating system dark mode setting" />
                                        </div>
                                        <div class="switch-container">
                                            <v-switch
                                                label="Prefer dark mode"
                                                color="info"
                                                hide-details="auto"
                                                v-model="$v.formData.enablePreferDarkMode.$model" />
                                            <ToolTip
                                                tooltip="Switch to dark mode theme.
                                                If enabled this setting<br />will override operating
                                                systems dark mode setting." />
                                        </div>
                                    </v-col>
                                </v-row>
                                <v-row>
                                    <v-col
                                        cols="12">
                                        <p class="mb-3">Icon size</p>
                                        <v-btn-toggle
                                            v-model="$v.formData.iconSize.$model"
                                            mandatory
                                            color="primary"
                                            variant="outlined"
                                            density="compact">
                                            <v-btn :value="ICON_SIZE.SMALL">
                                                Small
                                            </v-btn>
                                            <v-btn :value="ICON_SIZE.MEDIUM">
                                                Medium
                                            </v-btn>
                                            <v-btn :value="ICON_SIZE.LARGE">
                                                Large
                                            </v-btn>
                                        </v-btn-toggle>
                                    </v-col>
                                </v-row>
                            </div>
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
                    :disabled="!$v.$anyDirty"
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
<script setup lang="ts">
    import { mdiDownload, mdiUpload } from '@mdi/js';
    import {
        ref, onMounted, watch, onUnmounted, reactive, type Ref,
    } from 'vue';
    // eslint-disable-next-line
    import useVuelidate from '@vuelidate/core';
    import { EMITS, FILE_NAMES, ICON_SIZE } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';
    import emitter from '@cmp/eventBus';
    import { useBookmarkOps } from '@cmp/useBookmarkOps';
    import { useAccordionSync } from '@cmp/useAccordionSync';
    import type { BookmarkNode, FolderColorItem, ImportFileData } from '@/types/bookmark';
    import { findNodeById, isGroupName } from '@utils/bookmarkGroups';
    import {
        isImportBookmarksFileValid,
        isImportIconsFileValid,
    } from '@utils/importValidation';
    import { useTheme } from 'vuetify';
    import ToolTip from '@/components/fields/ToolTip.vue';

    const theme = useTheme();

    const { deleteLocalStoreImages, deleteAllBookmarks, getBookmarksAsFlatArr } = useBookmarkOps();
    const { buildRootFolder } = useAccordionSync();

    const emits = defineEmits([EMITS.CLOSE, EMITS.SAVE]);

    const bookmarksStore = useBookmarksStore();

    const form = ref();

    // Reactive form data
    const formData = reactive({
        enableSystemDarkMode: bookmarksStore.enableSystemDarkMode,
        enablePreferDarkMode: bookmarksStore.enablePreferDarkMode,
        bookmarksFileImport: null as File | null,
        iconsFileImport: null as File | null,
        iconSize: bookmarksStore.iconSize,
    });

    const rules = {
        formData: {
            enableSystemDarkMode: {},
            enablePreferDarkMode: {},
            bookmarksFileImport: { },
            iconsFileImport: { },
            iconSize: {},
        },
    };

    const $v = useVuelidate(rules, { formData });

    const isBookmarksFileValid = ref(false);
    const isIconsFileValid = ref();

    const errorDialog = ref(false);

    onMounted(async () => {
        bookmarksStore.dialogOpen = true;
    });

    function clearFileInput() {
        formData.iconsFileImport = null;
        formData.bookmarksFileImport = null;
    }

    async function onClickExportIcons() {
        // Safely get and filter local storage items
        const localStorageItems = (await bookmarksStore.getLocalStorageAll() as Record<string, Record<string, unknown>>) || {};
        const localStorageItemsImageArr = Object.values(localStorageItems)
            .filter((e): e is Record<string, unknown> => !!e && !!(e as Record<string, unknown>).image);

        // Get color data from sync storage
        const folderColorsResponse = await bookmarksStore.getSyncStorage('folderColors');
        const bookmarkColorsResponse = await bookmarksStore.getSyncStorage('bookmarkColors');

        // Process folders with colors
        const foldersWithColors: FolderColorItem[] = [];
        if (folderColorsResponse && bookmarksStore.bookmarks) {
            const mapped = Object.entries(folderColorsResponse as Record<string, string>)
                .map((e) => {
                    if (!e || !e[0]) return null;
                    const folder = (bookmarksStore.bookmarks ?? []).find((a) => a.id === e[0]);
                    if (!folder || !folder.title) return null;
                    return { id: e[0], color: e[1], title: folder.title } satisfies FolderColorItem;
                })
                .filter((folder): folder is FolderColorItem => folder !== null);
            foldersWithColors.push(...mapped);
        }

        // Process bookmarks with colors
        const bookmarkColorsMap = bookmarkColorsResponse as Record<string, string> | null;
        const bookmarksWithColors = bookmarkColorsMap
            ? localStorageItemsImageArr
                .filter((obj): obj is Record<string, unknown> => !!(obj as Record<string, unknown>).id)
                .map((obj) => ({
                    ...obj,
                    color: bookmarkColorsMap[(obj.id as string)] || obj.color || null,
                }))
            : [];

        // Prepare and export data
        const exportArr = {
            folders: foldersWithColors,
            bookmarks: bookmarksWithColors,
            type: 'icons',
        };

        const jsonString = JSON.stringify(exportArr);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const a = document.createElement('a');
        const url = URL.createObjectURL(blob);

        try {
            a.href = url;
            a.download = `${FILE_NAMES.BOOKMARK_ICONS_EXPORT}.json`;
            a.click();
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    async function onClickExportBookmarks(): Promise<void> {
        const exportBookmarks: BookmarkNode[] = Array.from(bookmarksStore.bookmarks ?? []);

        // fetch all images from local storage
        const localStorageItems = await bookmarksStore.getLocalStorageAll() as Record<string, Record<string, unknown>>;
        const localStorageItemsImageArr = Object.values(localStorageItems)
            .filter((e): e is Record<string, unknown> => !!(e as Record<string, unknown>).image);

        localStorageItemsImageArr.forEach((localitem) => {
            // Use findNodeById to traverse all descendants including bookmarks inside group folders
            const bookmark = findNodeById(exportBookmarks, localitem.id as string);

            if (bookmark) {
                bookmark.image = localitem.image as string;
            }
        });

        // run exporter
        const result = { bookmarks: exportBookmarks, type: 'bookmarks' };
        const jsonString = JSON.stringify(result);

        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([jsonString], { type: 'application/json' }));
        a.download = `${FILE_NAMES.BOOKMARKS_EXPORT}.json`;
        a.click();
    }

    const colorsFoldersMap: Record<string, string> = {};
    const colorsBookmarksMap: Record<string, string> = {};

    // update global store bookmarks obj with the latest imported bookmarks
    async function updateBookmarksStore(): Promise<void> {
        const bookmarksResponse = await bookmarksStore.getBookmarks(bookmarksStore.rootId as string);

        const rawBmChildren = bookmarksResponse[0].children ?? [];
        bookmarksStore.bookmarks = rawBmChildren as BookmarkNode[];

        Object.entries(colorsFoldersMap).forEach((item) => {
            const bookmarkFolder = (bookmarksStore.bookmarks ?? []).find((e) => e.id === item[0]);
            if (bookmarkFolder) {
                const [, bookmarkFolderColor] = item;
                bookmarkFolder.color = bookmarkFolderColor;
            }
        });

        // save imported colors
        if (colorsFoldersMap && Object.keys(colorsFoldersMap).length) {
            bookmarksStore.setSyncStorage({ folderColors: colorsFoldersMap });
        }

        //
        // inject imported colors into new bookmarks object
        Object.entries(colorsBookmarksMap).forEach((item) => {
            const bookmarksFlatArr = bookmarksStore.flatBookmarks;
            const bookmark = bookmarksFlatArr.find((e) => e?.id === item[0]);
            if (bookmark) {
                const [, bookmarkColor] = item;
                bookmark.color = bookmarkColor;
            }
        });

        // save imported colors
        if (colorsBookmarksMap && Object.keys(colorsBookmarksMap).length) {
            bookmarksStore.setSyncStorage({ bookmarkColors: colorsBookmarksMap });
        }

        emitter.emit(EMITS.BOOKMARKS_UPDATED, { type: 'import', id: '' });
    }

    // save imported images
    async function saveImages(
        results: chrome.bookmarks.BookmarkTreeNode[],
        images: (string | undefined | null)[],
    ): Promise<void> {
        const promiseArr: Promise<void>[] = [];
        results.forEach((item, index) => {
            if (images[index]) {
                promiseArr.push(bookmarksStore.setLocalStorage({
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

        await Promise.all(promiseArr);

        // when all images are saved then update bookmarks
        await updateBookmarksStore();

        bookmarksStore.isImporting = false;
    }

    async function onImportedFoldersCreated(
        createdTopLevelFolders: chrome.bookmarks.BookmarkTreeNode[],
        bookmarks: BookmarkNode[],
    ): Promise<void> {
        // Map old top-level folder id to new folder id
        const foldersMap: Record<string, string> = {};
        createdTopLevelFolders.forEach((folder, i) => {
            foldersMap[bookmarks[i].id] = folder.id;
            if (bookmarks[i].color) {
                colorsFoldersMap[folder.id] = bookmarks[i].color as string;
            }
        });

        // Collect all created bookmark links and their images
        const createdBookmarks: chrome.bookmarks.BookmarkTreeNode[] = [];
        const imagesArr: (string | null | undefined)[] = [];

        // Helper to create group folder children sequentially
        async function createGroupChildren(
            groupFolderId: string,
            groupChildren: BookmarkNode[],
        ): Promise<void> {
            await groupChildren.reduce<Promise<void>>(
                (chain, groupChild) => chain.then(async () => {
                    if (groupChild.url) {
                        const createdGroupBookmark = await bookmarksStore.createBookmark(
                            groupFolderId,
                            groupChild.title,
                            groupChild.url,
                        );
                        createdBookmarks.push(createdGroupBookmark);
                        imagesArr.push(groupChild.image);

                        if (groupChild.color) {
                            colorsBookmarksMap[createdGroupBookmark.id] = groupChild.color;
                        }
                    }
                }),
                Promise.resolve(),
            );
        }

        // Process each top-level folder's children sequentially to preserve order
        await Promise.all(bookmarks.map(async (topLevelFolder) => {
            const newParentId = foldersMap[topLevelFolder.id];
            const children = topLevelFolder.children ?? [];

            // Process children sequentially using reduce chain
            await children.reduce<Promise<void>>(
                (chain, child) => chain.then(async () => {
                    if (child.url) {
                        // Regular bookmark link - create directly under top-level folder
                        const created = await bookmarksStore.createBookmark(
                            newParentId,
                            child.title,
                            child.url,
                        );
                        createdBookmarks.push(created);
                        imagesArr.push(child.image);

                        if (child.color) {
                            colorsBookmarksMap[created.id] = child.color;
                        }
                    } else if (isGroupName(child.title)) {
                        // Group folder - create the group folder first, then its children
                        const createdGroupFolder = await bookmarksStore.createBookmark(
                            newParentId,
                            child.title,
                        );

                        await createGroupChildren(
                            createdGroupFolder.id,
                            child.children ?? [],
                        );
                    }
                    // Defensive: skip any other child types (non-group folders without url)
                }),
                Promise.resolve(),
            );
        }));

        bookmarksStore.accordionModel = [0];
        await bookmarksStore.setSyncStorage({
            accordion: [...bookmarksStore.accordionModel],
        });

        await saveImages(createdBookmarks, imagesArr);
    }

    // import bookmarks
    async function onBookmarksImportReaderLoad(event: ProgressEvent<FileReader>): Promise<void> {
        bookmarksStore.isImporting = true;

        await deleteLocalStoreImages();
        await deleteAllBookmarks();
        await buildRootFolder();

        await bookmarksStore.deleteSyncStorageItem('folderColors');
        await bookmarksStore.deleteSyncStorageItem('statistics');

        bookmarksStore.statistics = [];

        emitter.emit(EMITS.BOOKMARKS_IMPORT);

        const bookmarksRootResponse = await bookmarksStore.getBookmarkById(bookmarksStore.rootId as string);

        const importObj = JSON.parse(event.target?.result as string) as ImportFileData;
        const foldersPromiseArr: Promise<chrome.bookmarks.BookmarkTreeNode>[] = [];

        (importObj.bookmarks ?? []).forEach((folder) => {
            foldersPromiseArr.push(bookmarksStore
                .createBookmark(bookmarksRootResponse.id, folder.title));
        });

        const createdFolders = await Promise.all(foldersPromiseArr);
        await onImportedFoldersCreated(createdFolders, importObj.bookmarks ?? []);
    }

    // import bookmarks
    async function onIconsImportReaderLoad(event: ProgressEvent<FileReader>): Promise<void> {
        bookmarksStore.isImporting = true;

        bookmarksStore.deleteSyncStorageItem('bookmarkColors');
        bookmarksStore.deleteSyncStorageItem('folderColors');

        const importIcons = JSON.parse(event.target?.result as string) as ImportFileData;
        const bookmarksFlatResponse = await getBookmarksAsFlatArr();

        const promiseAllArr: Promise<void>[] = [];
        const colorArr: Record<string, string> = {};

        (importIcons.bookmarks ?? []).forEach((item) => {
            const bookmarks = (bookmarksFlatResponse ?? [])
                .filter((e) => item.url === e.url);

            bookmarks.forEach((bookmark) => {
                if (bookmark) {
                    if (item.color) {
                        colorArr[bookmark.id] = item.color;
                    }

                    promiseAllArr.push(bookmarksStore.setLocalStorage({
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
        bookmarksStore.setSyncStorage({ bookmarkColors: colorArr });

        const folderColorArr: Record<string, string> = {};

        (importIcons.folders ?? []).forEach((item) => {
            const bookmark = bookmarksStore.bookmarks
                ?.find((e) => item.title === e.title);

            if (bookmark) {
                if (item.color) {
                    folderColorArr[bookmark.id] = item.color;
                }
            }
        });

        // save folders colors to local storage
        bookmarksStore.setSyncStorage({ folderColors: folderColorArr });

        // when all colors and images have been updated and loaded then emit event
        await Promise.all(promiseAllArr);
        emitter.emit(EMITS.IMAGES_IMPORT);
    }

    function onClickSave() {
        // import
        if (formData.bookmarksFileImport && isBookmarksFileValid.value) {
            const reader = new FileReader();
            reader.onload = onBookmarksImportReaderLoad;
            reader.readAsText(formData.bookmarksFileImport);
        }

        if (formData.iconsFileImport) {
            const reader = new FileReader();
            reader.onload = onIconsImportReaderLoad;
            reader.readAsText(formData.iconsFileImport);
        }

        // enableSystemDarkMode
        bookmarksStore.enableSystemDarkMode = formData.enableSystemDarkMode;

        if (formData.enableSystemDarkMode) {
            bookmarksStore.setSyncStorage({ systemDarkMode: true });

            bookmarksStore.enableDarkMode = window
                .matchMedia('(prefers-color-scheme: dark)').matches;
        } else {
            bookmarksStore.deleteSyncStorageItem('systemDarkMode');

            bookmarksStore.enableDarkMode = false;
        }

        // enablePreferDarkMode
        if (!formData.enableSystemDarkMode) {
            bookmarksStore.enablePreferDarkMode = formData.enablePreferDarkMode;
            bookmarksStore.enableDarkMode = bookmarksStore.enablePreferDarkMode;

            if (formData.enablePreferDarkMode) {
                bookmarksStore.setSyncStorage({ darkMode: true });
            } else {
                bookmarksStore.deleteSyncStorageItem('darkMode');
            }
        }
        theme.global.name.value = bookmarksStore.enableDarkMode ? 'dark' : 'light';

        // iconSize
        bookmarksStore.iconSize = formData.iconSize;
        bookmarksStore.setSyncStorage({ iconSize: formData.iconSize });

        emits(EMITS.SAVE);
    }

    function handleFileImport(
        file: File | File[] | null,
        importType: 'bookmarksFileImport' | 'iconsFileImport',
        isValid: Ref<boolean | undefined>,
        validationFn: (data: ImportFileData) => boolean,
    ): void {
        if (!file) {
            formData[importType] = null;
            return;
        }

        const fileToImport = Array.isArray(file) ? file[0] : file;
        formData[importType] = fileToImport;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsedData = JSON.parse((e.target as FileReader).result as string) as ImportFileData;
                isValid.value = validationFn(parsedData);

                if (!isValid.value) {
                    errorDialog.value = true;
                }
            } catch (_error) {
                isValid.value = false;
                errorDialog.value = true;
            }
        };
        reader.readAsText(fileToImport);
    }

    watch(
        () => [formData.bookmarksFileImport, formData.iconsFileImport],
        ([bookmarksFile, iconsFile]) => {
            if (bookmarksFile) {
                handleFileImport(
                    bookmarksFile,
                    'bookmarksFileImport',
                    isBookmarksFileValid,
                    isImportBookmarksFileValid,
                );
            }

            if (iconsFile) {
                handleFileImport(
                    iconsFile,
                    'iconsFileImport',
                    isIconsFileValid,
                    isImportIconsFileValid,
                );
            }
        },
    );

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

    .form-divider {
        border-right: solid 1px rgb(var(--v-theme-on-surface-variant));
    }
</style>
