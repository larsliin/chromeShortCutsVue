<template>
    <v-card>
        <v-form ref="form" fast-fail @submit.prevent>
            <v-card-text>
                <v-container>
                    <v-row>
                        <v-col
                            cols="12">
                            <span class="text-h5" v-if="id">Edit Bookmark</span>
                            <span class="text-h5" v-else>New Bookmark</span>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col
                            cols="6">
                            <v-row>
                                <v-col
                                    cols="12">
                                    <v-tabs
                                        v-model="tabs"
                                        color="primary"
                                        grow>
                                        <v-tab
                                            :disabled="!bookmarksStore.bookmarks
                                                || bookmarksStore.bookmarks.length === 0"
                                            :value="1">
                                            Folder
                                        </v-tab>
                                        <v-tab
                                            :value="2">
                                            New Folder
                                        </v-tab>
                                    </v-tabs>
                                    <v-autocomplete
                                        v-if="tabs === 1"
                                        :items="foldersArr"
                                        label="Select Folder"
                                        single-line
                                        :rules="[rules.required]"
                                        :disabled="!bookmarksStore.bookmarks
                                            || bookmarksStore.bookmarks.length === 0"
                                        v-model="folderSlct">
                                    </v-autocomplete>
                                    <v-text-field
                                        v-else
                                        label="Bookmark Folder Name"
                                        :rules="[rules.required]"
                                        v-model="folderTxt">
                                    </v-text-field>
                                </v-col>
                            </v-row>
                            <template v-if="!data || (data && data.url)">
                                <v-row>
                                    <v-col
                                        cols="12">
                                        <v-text-field
                                            v-model="titleTxt"
                                            :rules="[rules.required]"
                                            label="Bookmark Title">
                                        </v-text-field>
                                    </v-col>
                                </v-row>
                                <v-row>
                                    <v-col
                                        cols="12">
                                        <v-text-field
                                            v-model="urlTxt"
                                            label="Bookmark URL"
                                            hint="bookmark link"
                                            :rules="[rules.required, rules.urlvalid]">
                                        </v-text-field>
                                    </v-col>
                                </v-row>
                            </template>
                        </v-col>
                        <v-col
                            cols="6">
                            <BookmarkCreateIcon
                                :data="data"
                                :url="urlTxt"
                                :iconUrl="base64Image"
                                @update="onIconUpdate($event)"
                                @clearbitError="onClearbitError($event)" />
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>
            <v-card-actions>
                <div class="ml-6">
                    <p class="clearbit-note">
                        <a href="https://clearbit.com"
                            :class="{ dark: bookmarksStore.enableDarkMode }">
                            Generated logos provided by Clearbit
                        </a>
                    </p>
                </div>
                <v-spacer></v-spacer>
                <v-btn
                    v-if="data && data.id"
                    variant="tonal"
                    color="red"
                    @click="onDelete()">
                    Delete
                </v-btn>
                <v-btn
                    v-if="!bookmarksStore.popup"
                    color="blue-darken-1"
                    variant="text"
                    @click="$emit(EMITS.CLOSE)">
                    Cancel
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
</template>

<script setup>
    import { ref, watch, onMounted } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import BookmarkCreateIcon from '@/components/forms/BookmarkCreateIcon.vue';
    import { EMITS } from '@/constants';
    import { useUtils } from '@/shared/composables/utils';
    import useEventsBus from '@cmp/eventBus';

    const { bus, emit } = useEventsBus();

    const utils = useUtils();

    const tabs = ref();

    const emits = defineEmits([
        EMITS.CLOSE,
        EMITS.SAVE,
        EMITS.CLEARBIT_ERROR,
        EMITS.DELETE,
    ]);

    const props = defineProps({
        data: Object,
        folderPreSelected: String,
    });

    const rules = {
        required: (value) => !!value || 'Field is required',
        // eslint-disable-next-line no-use-before-define
        urlvalid: (value) => utils.isValidURL(value) || 'Field requires a valid URL',
    };

    const bookmarksStore = useBookmarksStore();

    const foldersArr = ref();
    const foldersIdArr = ref();

    const id = ref();
    const parentId = ref();

    const base64Image = ref();
    const form = ref();
    const folderSlct = ref();
    const folderTxt = ref('');
    const titleTxt = ref('');
    const urlTxt = ref('');

    async function moveToFolder(folderStr, newFolderId) {
        if (newFolderId) {
            // move bookmark to a newly created folder
            await bookmarksStore.move_bookmark(id.value, { parentId: newFolderId });
        } else {
            // move bookmark to an exsisting folder if the provided prop parent id
            // does not match the parent id from the select dropdown
            const isSameFolder = !!(foldersIdArr.value
                .find((item) => item[folderStr] === parentId.value));

            // if bookmark is existing bookmark that is being edited
            // and bookmark is being moved to another folder
            if (!isSameFolder) {
                const targetId = foldersIdArr.value
                    // eslint-disable-next-line no-prototype-builtins
                    .find((item) => item.hasOwnProperty(folderStr))[folderStr];

                await bookmarksStore.move_bookmark(id.value, { parentId: targetId });
            }
        }
    }

    function onDelete() {
        emits(EMITS.DELETE, props.data);
    }

    // force event trigger if bookmark data is not updated but image has changed
    function emitImageUpdate() {
        emit(EMITS.CHANGED, id.value);
    }

    async function onClickSave() {
        const formValidation = await form.value.validate();

        if (!formValidation.valid) {
            return;
        }

        // get folder text
        const folderStr = tabs.value === 1 ? folderSlct.value : folderTxt.value;

        if (!bookmarksStore.rootId) {
            await utils.buildRootFolder();
        }

        // check if there is any existing folders with that folder name in our root folder
        const findFolderResponse = await bookmarksStore
            .get_folderByTitle(bookmarksStore.rootId, folderStr);
        let createBookmarkResponse;

        bookmarksStore.editBase64Image = base64Image.value;

        if (findFolderResponse && findFolderResponse.length) {
            // if we have a folder with the provided folder name already
            if (id.value) {
                // if bookmark is existing bookmark that is being edited
                createBookmarkResponse = await bookmarksStore
                    .update_bookmark(id.value, { title: titleTxt.value, url: urlTxt.value });

                moveToFolder(folderStr);
            } else {
                // bookmark is new bookmark
                createBookmarkResponse = await bookmarksStore
                    .create_bookmark(findFolderResponse[0].id, titleTxt.value, urlTxt.value);
            }
        } else {
            // if folder does NOT exist
            // then create a new folder
            const createFolderResponse = await bookmarksStore
                .create_bookmark(bookmarksStore.rootId, folderStr);

            if (id.value) {
                // if bookmark is an existing bookmark that is being edited then update bookmark
                createBookmarkResponse = await bookmarksStore
                    .update_bookmark(id.value, { title: titleTxt.value, url: urlTxt.value });

                // move to the newly created folder
                await moveToFolder(folderStr, createFolderResponse.id);
            } else {
                // if bookmark is a new bookmark then create a new bookmark
                createBookmarkResponse = await bookmarksStore
                    .create_bookmark(createFolderResponse.id, titleTxt.value, urlTxt.value);
            }
        }

        if (id.value) {
            emitImageUpdate();
        } else {
            // create local storage item
            await bookmarksStore.set_localStorage({
                [createBookmarkResponse.id]: {
                    id: createBookmarkResponse.id,
                    parentId: createBookmarkResponse.parentId,
                    image: base64Image.value,
                    url: urlTxt.value,
                    title: titleTxt.value,
                },
            });
        }

        emits(EMITS.SAVE);
    }

    function onIconUpdate(event) {
        base64Image.value = event;
    }

    function onClearbitError(event) {
        emits(EMITS.CLEARBIT_ERROR, event);
    }

    watch(() => bus.value.get(EMITS.BOOKMARKS_UPDATED), async () => {
        if (bookmarksStore.rootId) {
            const bookmarks = await bookmarksStore.get_bookmarks(bookmarksStore.rootId);
            foldersArr.value = bookmarks[0].children.flatMap((e) => e.title);
            foldersIdArr.value = bookmarks[0].children.map((e) => ({ [e.title]: e.id }));
        }

        if (!bookmarksStore.bookmarks?.length) {
            tabs.value = 2;
        }
    });

    onMounted(async () => {
        bookmarksStore.dialogOpen = true;

        const bookmarks = await bookmarksStore.get_bookmarks(bookmarksStore.rootId);
        foldersArr.value = bookmarks[0].children.flatMap((e) => e.title);
        foldersIdArr.value = bookmarks[0].children.map((e) => ({ [e.title]: e.id }));

        const slctDisabled = !bookmarksStore.bookmarks
            || bookmarksStore.bookmarks.length === 0;

        if (props.data) {
            id.value = props.data.id;
            parentId.value = props.data.parentId;
            titleTxt.value = props.data.title;
            urlTxt.value = props.data.url;

            if (props.data.image) {
                base64Image.value = JSON.parse(JSON.stringify(props.data.image));
            }
        }

        if (!slctDisabled && props.data && props.data.parentId) {
            const parentIndex = bookmarks[0].children
                .findIndex((e) => e.id === props.data.parentId);
            folderSlct.value = bookmarksStore.bookmarks[parentIndex].title;
        }

        if (props.folderPreSelected && !props.data) {
            const folder = bookmarksStore.bookmarks
                .find((e) => e.id === props.folderPreSelected);
            const title = folder ? folder.title : null;
            folderSlct.value = title;
        }

        if (slctDisabled) {
            tabs.value = 2;
        }
    });

</script>
<style scoped lang="scss">
    .clearbit-note {
        font-size: 12px;
    }

    a.dark {
        color: var(--darkmode-400);
    }
</style>
