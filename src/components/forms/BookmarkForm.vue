<template>
    <v-card>
        <v-form ref="form" fast-fail @submit.prevent>
            <v-card-text>
                <v-container>
                    <v-row>
                        <v-col
                            cols="12">
                            <v-card-title>
                                <span class="text-h5">Add Bookmark</span>
                            </v-card-title>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col
                            cols="12">
                            <v-tabs
                                v-model="tabs"
                                color="primary"
                                grow>
                                <v-tab
                                    :disabled="folderSlct && folderSlct.length === 0"
                                    :value="1">
                                    Existing Folder
                                </v-tab>
                                <v-tab
                                    :disabled="folderSlct && folderSlct.length === 0"
                                    :value="2">
                                    Create New Folder
                                </v-tab>
                            </v-tabs>
                            <v-autocomplete
                                v-if="tabs === 1"
                                :items="foldersArr"
                                label="Select Folder"
                                single-line
                                :rules="[rules.required]"
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
                    <v-row>
                        <v-col
                            cols="12">
                            <span class="text-h6">Icon</span>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col
                            cols="12">
                            <BookmarkIcon
                                :image="base64Image" />
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col
                            cols="12">
                            <input
                                class="inp-file"
                                type="file"
                                id="inp_image"
                                accept=".jpg, .jpeg, .gif, .png, .svg"
                                @change="onImageInpChange($event)" />
                            <v-btn
                                color="blue-darken-1"
                                variant="tonal"
                                @click="onClickFindImage()">
                                Browse
                            </v-btn>
                            <v-btn
                                class="ml-5"
                                color="blue-darken-1"
                                variant="tonal"
                                :disabled="!urlTxt"
                                @click="getClearbitImage()">
                                Generate
                            </v-btn>
                            <v-btn
                                class="ml-5"
                                color="blue-darken-1"
                                variant="tonal"
                                :disabled="!base64Image"
                                @click="base64Image = null">
                                Clear
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
    import { ref, computed, onMounted } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import BookmarkIcon from '@/components/bookmarks/BookmarkIcon.vue';
    import { FOLDER, EMITS } from '@/constants';
    import useEventsBus from '@cmp/eventBus';
    import { useUtils } from '@/shared/utils/utils';

    const { emit } = useEventsBus();

    const utils = useUtils();

    const tabs = ref();

    const emits = defineEmits(EMITS.CLOSE);

    const props = defineProps({
        data: Object,
    });
    const rules = {
        required: (value) => !!value || 'Field is required',
        // eslint-disable-next-line no-use-before-define
        urlvalid: (value) => utils.isValidURL(value) || 'Field requires a valid URL',
    };

    const bookmarksStore = useBookmarksStore();

    const foldersArr = computed(() => bookmarksStore.bookmarks.flatMap((e) => e.title));
    const foldersIdArr = computed(() => bookmarksStore.bookmarks.map((e) => ({ [e.title]: e.id })));

    const id = ref();
    const parentId = ref();
    const imageFile = ref();
    const base64Image = ref();
    const clearbitFile = ref();
    const form = ref();
    const folderSlct = ref();
    const folderTxt = ref('');
    const titleTxt = ref('');
    const urlTxt = ref('');

    async function fetchClearBitImage(imageUrl) {
        try {
            const response = await utils.getBase64ImageFromUrl(imageUrl);
            if (response === 'error') {
                //
            } else {
                base64Image.value = response;
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function getClearbitImage() {
        if (!urlTxt.value) {
            return;
        }

        if (utils.isValidURL(urlTxt.value)) {
            const domain = utils.getDomainFromUrl(urlTxt.value);
            const imageUrl = `https://logo.clearbit.com/${domain}?size=200`;

            fetchClearBitImage(imageUrl);
        }
    }

    // force event trigger if bookmark data is not updated but image has changed
    function emitImageUpdate() {
        if (id.value && titleTxt.value === props.data.title && urlTxt.value === props.data.url) {
            emit(EMITS.IMAGE_UPDATED, id.value);
        }
    }

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

    async function onClickSave() {
        const formValidation = await form.value.validate();

        if (!formValidation.valid) {
            return;
        }

        // get folder text
        const folderStr = tabs.value === 1 ? folderSlct.value : folderTxt.value;

        const getRootResponse = await bookmarksStore.get_localStorage(FOLDER.ROOT.id);

        // check if there is any existing folders with that folder name in our root folder
        const findFolderResponse = await bookmarksStore
            .get_folderByTitle(getRootResponse.id, folderStr);

        let createBookmarkResponse;
        let slideToFolderId;

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
            slideToFolderId = foldersIdArr.value
                // eslint-disable-next-line no-prototype-builtins
                .find((item) => item.hasOwnProperty(folderStr))[folderStr];
        } else {
            // if folder does NOT exist
            const createFolderResponse = await bookmarksStore
                .create_bookmark(getRootResponse.id, folderStr);

            if (id.value) {
                // if bookmark is an exsisting bookmark that is being edited then update bookmark
                createBookmarkResponse = await bookmarksStore
                    .update_bookmark(id.value, { title: titleTxt.value, url: urlTxt.value });

                // move to the newly created folder
                await moveToFolder(folderStr, createFolderResponse.id);
                slideToFolderId = createFolderResponse.id;
            } else {
                // if bookmark is a new bookmark then create a new bookmark
                createBookmarkResponse = await bookmarksStore
                    .create_bookmark(createFolderResponse.id, titleTxt.value, urlTxt.value);
                slideToFolderId = createBookmarkResponse.parentId;
            }
        }

        if (id.value) {
            emitImageUpdate();
        } else {
            // create local storage item
            await bookmarksStore.set_localStorage({
                [createBookmarkResponse.id]: {
                    id: createBookmarkResponse.id,
                    image: base64Image.value,
                    url: urlTxt.value,
                    title: titleTxt.value,
                },
            });
        }

        // slide to the new bookmark folder
        bookmarksStore.sliderIndex = bookmarksStore.bookmarks
            .findIndex((e) => e.id === slideToFolderId);

        bookmarksStore.set_localStorage({ sliderIndex: bookmarksStore.sliderIndex });

        emits(EMITS.SAVE);
    }

    function onClickFindImage() {
        document.getElementById('inp_image').click();
    }

    async function getBase64Data(file) {
        try {
            const base64Data = await bookmarksStore.toBase64(file);
            return base64Data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async function onImageInpChange(event) {
        // eslint-disable-next-line prefer-destructuring
        imageFile.value = event.target.files[0];
        clearbitFile.value = null;

        const base64Response = await getBase64Data(imageFile.value);
        base64Image.value = base64Response;
    }

    onMounted(async () => {
        folderSlct.value = bookmarksStore.bookmarks[bookmarksStore.sliderIndex].title;

        if (props.data) {
            id.value = props.data.id;
            parentId.value = props.data.parentId;
            titleTxt.value = props.data.title;
            urlTxt.value = props.data.url;
            base64Image.value = props.data.image;
        }

        if (folderSlct.value.length === 0) {
            tabs.value = 2;
        }
    });
</script>
<style>
    .inp-file {
        display: none;
    }
</style>
