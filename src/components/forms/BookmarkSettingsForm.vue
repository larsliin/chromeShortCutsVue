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
        ref, watch, reactive, type Ref,
    } from 'vue';
    // eslint-disable-next-line
    import useVuelidate from '@vuelidate/core';
    import {
        EMITS, ARGS, FILE_NAMES, ICON_SIZE, STORAGE_KEYS,
    } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';
    import emitter from '@cmp/eventBus';
    import { useBookmarkOps } from '@cmp/useBookmarkOps';
    import { useAccordionSync } from '@cmp/useAccordionSync';
    import { useBookmarkLoader } from '@cmp/useBookmarkLoader';
    import { useDarkMode } from '@cmp/useDarkMode';
    import type { BookmarkNode, FolderColorItem, ImportFileData } from '@/types/bookmark';
    import {
        findNodeById,
        getGroupDisplayName,
        hasLegacyGroupPrefix,
        isImportedGroupFolder,
    } from '@utils/bookmarkGroups';
    import { runSequentially } from '@utils/async';
    import {
        isImportBookmarksFileValid,
        isImportIconsFileValid,
    } from '@utils/importValidation';
    import ToolTip from '@/components/fields/ToolTip.vue';

    const {
        getStoredImageItems, deleteLocalStoreImages, deleteAllBookmarks, getBookmarksAsFlatArr,
    } = useBookmarkOps();
    const { buildRootFolder, persistAccordionModel } = useAccordionSync();
    const bookmarkLoader = useBookmarkLoader();
    const { applyDarkMode } = useDarkMode();

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
    const isIconsFileValid = ref(false);

    const errorDialog = ref(false);

    function clearFileInput() {
        formData.iconsFileImport = null;
        formData.bookmarksFileImport = null;
    }

    function downloadJson(data: object, fileName: string): void {
        const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
        const a = document.createElement('a');

        try {
            a.href = url;
            a.download = `${fileName}.json`;
            a.click();
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    async function onClickExportIcons() {
        const imageItems = await getStoredImageItems();

        // Get color data from sync storage
        const folderColors = (await bookmarksStore.getSyncStorage(STORAGE_KEYS.FOLDER_COLORS)) as
            Record<string, string> | null;
        const bookmarkColors = (await bookmarksStore.getSyncStorage(STORAGE_KEYS.BOOKMARK_COLORS)) as
            Record<string, string> | null;

        // Process folders with colors
        const foldersWithColors: FolderColorItem[] = Object.entries(folderColors ?? {})
            .flatMap(([id, color]) => {
                const folder = (bookmarksStore.bookmarks ?? []).find((e) => e.id === id);
                return folder?.title ? [{ id, color, title: folder.title }] : [];
            });

        // Process bookmarks with colors
        const bookmarksWithColors = bookmarkColors
            ? imageItems
                .filter((item) => !!item.id)
                .map((item) => ({
                    ...item,
                    color: bookmarkColors[item.id] || item.color || null,
                }))
            : [];

        downloadJson(
            { folders: foldersWithColors, bookmarks: bookmarksWithColors, type: 'icons' },
            FILE_NAMES.BOOKMARK_ICONS_EXPORT,
        );
    }

    async function onClickExportBookmarks(): Promise<void> {
        const exportBookmarks: BookmarkNode[] = Array.from(bookmarksStore.bookmarks ?? []);

        // fetch all images from local storage
        (await getStoredImageItems()).forEach((localitem) => {
            // Use findNodeById to traverse all descendants including bookmarks inside group folders
            const bookmark = findNodeById(exportBookmarks, localitem.id);

            if (bookmark) {
                bookmark.image = localitem.image;
            }
        });

        // Tag every node whose id is in groupIds with isGroup so the importer
        // can recreate the group registration without the legacy title prefix.
        const { groupIds } = bookmarksStore;
        function tagGroups(nodes: BookmarkNode[]): void {
            nodes.forEach((node) => {
                if (groupIds[node.id]) {
                    node.isGroup = true;
                }
                if (node.children?.length) {
                    tagGroups(node.children);
                }
            });
        }
        tagGroups(exportBookmarks);

        downloadJson({ bookmarks: exportBookmarks, type: 'bookmarks' }, FILE_NAMES.BOOKMARKS_EXPORT);
    }

    const colorsFoldersMap: Record<string, string> = {};
    const colorsBookmarksMap: Record<string, string> = {};

    // Persist imported colors and reload the bookmark tree.
    // This ensures group IDs and colors are available before first render.
    async function updateBookmarksStore(): Promise<void> {
        const persistPromises: Promise<unknown>[] = [];

        if (Object.keys(colorsFoldersMap).length) {
            persistPromises.push(
                bookmarksStore.setSyncStorage({ [STORAGE_KEYS.FOLDER_COLORS]: { ...colorsFoldersMap } }),
            );
        }

        if (Object.keys(colorsBookmarksMap).length) {
            persistPromises.push(
                bookmarksStore.setSyncStorage({ [STORAGE_KEYS.BOOKMARK_COLORS]: { ...colorsBookmarksMap } }),
            );
        }

        await Promise.all(persistPromises);

        await bookmarkLoader.getBookmarks();

        emitter.emit(EMITS.BOOKMARKS_UPDATED, { type: ARGS.IMPORT, id: '' });
    }

    // save imported images
    async function saveImages(
        results: chrome.bookmarks.BookmarkTreeNode[],
        images: (string | undefined | null)[],
    ): Promise<void> {
        await Promise.all(results.flatMap((item, index) => (images[index]
            ? [bookmarksStore.setLocalStorage({
                [item.id]: {
                    id: item.id,
                    parentId: item.parentId,
                    image: images[index],
                    url: item.url,
                    title: item.title,
                },
            })]
            : [])));

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

        // Newly-created group folder IDs to register in bookmarksStore.groupIds
        // once the whole import is done (single persistence at the end).
        const newGroupIds: string[] = [];

        async function createLink(parentId: string, link: BookmarkNode): Promise<void> {
            const created = await bookmarksStore.createBookmark(parentId, link.title, link.url);
            createdBookmarks.push(created);
            imagesArr.push(link.image);

            if (link.color) {
                colorsBookmarksMap[created.id] = link.color;
            }
        }

        async function createChild(parentId: string, child: BookmarkNode): Promise<void> {
            if (child.url) {
                await createLink(parentId, child);
                return;
            }

            // Defensive: skip any other child types (non-group folders without url)
            if (!isImportedGroupFolder(child)) {
                return;
            }

            // Create the group folder first, then its links sequentially.
            // Legacy-prefixed or empty titles fall back to the default name.
            const createdGroupFolder = await bookmarksStore.createBookmark(
                parentId,
                getGroupDisplayName(hasLegacyGroupPrefix(child.title) ? '' : child.title),
            );

            newGroupIds.push(createdGroupFolder.id);

            await runSequentially(
                (child.children ?? []).filter((groupChild) => groupChild.url),
                (groupChild) => createLink(createdGroupFolder.id, groupChild),
            );
        }

        // Process each top-level folder's children sequentially to preserve order
        await Promise.all(bookmarks.map((topLevelFolder) => runSequentially(
            topLevelFolder.children ?? [],
            (child) => createChild(foldersMap[topLevelFolder.id], child),
        )));

        // Register all imported groups in groupIds and persist once.
        if (newGroupIds.length) {
            const merged: Record<string, true> = { ...bookmarksStore.groupIds };
            newGroupIds.forEach((id) => {
                merged[id] = true;
            });
            bookmarksStore.groupIds = merged;
            await bookmarksStore.persistGroupIds();
        }

        await persistAccordionModel([0]);

        await saveImages(createdBookmarks, imagesArr);
    }

    // import bookmarks
    async function onBookmarksImportReaderLoad(event: ProgressEvent<FileReader>): Promise<void> {
        bookmarksStore.isImporting = true;

        // Reset accumulator maps so entries from a previous import in the same
        // session don't leak into this run.
        Object.keys(colorsFoldersMap).forEach((key) => { delete colorsFoldersMap[key]; });
        Object.keys(colorsBookmarksMap).forEach((key) => { delete colorsBookmarksMap[key]; });

        await deleteLocalStoreImages();
        await deleteAllBookmarks();
        await buildRootFolder();

        await bookmarksStore.deleteSyncStorageItem(STORAGE_KEYS.FOLDER_COLORS);
        await bookmarksStore.deleteSyncStorageItem(STORAGE_KEYS.STATISTICS);

        bookmarksStore.statistics = [];

        emitter.emit(EMITS.BOOKMARKS_IMPORT);

        const bookmarksRootResponse = await bookmarksStore.getBookmarkById(bookmarksStore.rootId as string);

        const importObj = JSON.parse(event.target?.result as string) as ImportFileData;
        const importedFolders = importObj.bookmarks ?? [];

        const createdFolders = await Promise.all(importedFolders.map((folder) => bookmarksStore
            .createBookmark(bookmarksRootResponse.id, folder.title)));
        await onImportedFoldersCreated(createdFolders, importedFolders);
    }

    // import icons
    async function onIconsImportReaderLoad(event: ProgressEvent<FileReader>): Promise<void> {
        bookmarksStore.isImporting = true;

        bookmarksStore.deleteSyncStorageItem(STORAGE_KEYS.BOOKMARK_COLORS);
        bookmarksStore.deleteSyncStorageItem(STORAGE_KEYS.FOLDER_COLORS);

        const importIcons = JSON.parse(event.target?.result as string) as ImportFileData;
        const bookmarksFlatResponse = await getBookmarksAsFlatArr();

        const promiseAllArr: Promise<void>[] = [];
        const colorArr: Record<string, string> = {};

        (importIcons.bookmarks ?? []).forEach((item) => {
            const bookmarks = (bookmarksFlatResponse ?? [])
                .filter((e) => item.url === e.url);

            bookmarks.forEach((bookmark) => {
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
            });
        });

        // save bookmarks colors to local storage
        bookmarksStore.setSyncStorage({ [STORAGE_KEYS.BOOKMARK_COLORS]: colorArr });

        const folderColorArr: Record<string, string> = {};

        (importIcons.folders ?? []).forEach((item) => {
            const bookmark = bookmarksStore.bookmarks
                ?.find((e) => item.title === e.title);

            if (bookmark && item.color) {
                folderColorArr[bookmark.id] = item.color;
            }
        });

        // save folders colors to local storage
        bookmarksStore.setSyncStorage({ [STORAGE_KEYS.FOLDER_COLORS]: folderColorArr });

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

        if (formData.iconsFileImport && isIconsFileValid.value) {
            const reader = new FileReader();
            reader.onload = onIconsImportReaderLoad;
            reader.readAsText(formData.iconsFileImport);
        }

        // The preferred dark mode setting is only editable while the OS setting is off.
        if (formData.enableSystemDarkMode) {
            bookmarksStore.setSyncStorage({ [STORAGE_KEYS.SYSTEM_DARK_MODE]: true });
        } else {
            bookmarksStore.deleteSyncStorageItem(STORAGE_KEYS.SYSTEM_DARK_MODE);

            if (formData.enablePreferDarkMode) {
                bookmarksStore.setSyncStorage({ [STORAGE_KEYS.DARK_MODE]: true });
            } else {
                bookmarksStore.deleteSyncStorageItem(STORAGE_KEYS.DARK_MODE);
            }
        }

        applyDarkMode(formData.enablePreferDarkMode, formData.enableSystemDarkMode);

        // iconSize
        bookmarksStore.iconSize = formData.iconSize;
        bookmarksStore.setSyncStorage({ [STORAGE_KEYS.ICON_SIZE]: formData.iconSize });

        emits(EMITS.SAVE);
    }

    function handleFileImport(
        file: File | File[] | null,
        importType: 'bookmarksFileImport' | 'iconsFileImport',
        isValid: Ref<boolean>,
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
