<template>
    <v-card>
        <v-form ref="form" fast-fail @submit.prevent>
            <v-card-title>
                <span class="text-h5">Add Bookmark</span>
            </v-card-title>
            <v-card-text>
                <v-container>
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
                            <BookmarkIcon
                                :image="base64Image" />
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col
                            cols="12">
                            <v-btn
                                color="blue-darken-1"
                                variant="tonal"
                                @click="onClickFindImage()">
                                Find Image
                            </v-btn>
                            <input
                                class="inp-file"
                                type="file"
                                id="inp_image"
                                accept=".jpg, .jpeg, .gif, .png, .svg"
                                @change="onImageInpChange($event)" />
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
    import { ref, computed, onMounted, nextTick } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import BookmarkIcon from '@/components/bookmarks/BookmarkIcon.vue';
    import { FOLDER, EMITS } from '@/constants';

    const tabs = ref();

    const emits = defineEmits(EMITS.CLOSE);

    const rules = {
        required: value => !!value || 'Field is required',
        urlvalid: value => isValidURL(value) || 'Field requires a valid URL'
    };

    const bookmarksStore = useBookmarksStore();

    const foldersArr = computed(() => bookmarksStore.bookmarks.flatMap(e => e.title));

    const imageFile = ref();
    const base64Image = ref();
    const clearbitFile = ref();
    const form = ref();
    const folderSlct = ref();
    const folderTxt = ref('');
    const titleTxt = ref('');
    const urlTxt = ref('');

    async function onClickSave() {
        const valid = await form.value.validate();

        if (!valid.valid) {
            return;
        }

        const folderStr = tabs.value === 1 ? folderSlct.value : folderTxt.value

        const getRootResponse = await bookmarksStore.get_localStorage(FOLDER.ROOT.id);

        const findFolderResponse = await bookmarksStore.get_folderByTitle(getRootResponse.id, folderStr);

        let createBookmarkResponse;

        if (findFolderResponse && findFolderResponse.length) {
            // if folder exists
            createBookmarkResponse = await bookmarksStore.create_bookmark(findFolderResponse[0].id, titleTxt.value, urlTxt.value);

        } else {
            // if folder does not exist
            const createFolderResponse = await bookmarksStore.create_bookmark(getRootResponse.id, folderStr);

            createBookmarkResponse = await bookmarksStore.create_bookmark(createFolderResponse.id, titleTxt.value, urlTxt.value);
        }

        await bookmarksStore.set_localStorage({
            [createBookmarkResponse.id]: {
                id: createBookmarkResponse.id,
                image: base64Image.value,
                url: urlTxt.value,
                title: titleTxt.value,
            }
        });

        bookmarksStore.sliderIndex = bookmarksStore.bookmarks.findIndex(e => e.id === createBookmarkResponse.parentId);

        bookmarksStore.set_localStorage({ sliderIndex: bookmarksStore.sliderIndex });

        emits(EMITS.SAVE);
    }

    function isValidURL(str) {
        const expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
        const regex = new RegExp(expression);

        return !!str.match(regex);
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
        imageFile.value = event.target.files[0];
        clearbitFile.value = null;

        const base64Response = await getBase64Data(imageFile.value);
        base64Image.value = base64Response;
    }

    onMounted(async() => {
        folderSlct.value = bookmarksStore.bookmarks[bookmarksStore.sliderIndex].title;

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
