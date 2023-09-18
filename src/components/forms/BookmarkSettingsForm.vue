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
    import { ref, onMounted, nextTick } from 'vue';
    import { EMITS, FOLDER } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';

    const emits = defineEmits([EMITS.CLOSE, EMITS.SAVE]);

    const bookmarksStore = useBookmarksStore();

    const form = ref();
    const enableArrowNavigation = ref();
    const fileImport = ref();

    function onClickExport() { }

    async function onImportIconsReaderLoad(event) {
        const importBookmarks = JSON.parse(event.target.result);

        // delete all images from local storage
        const promiseLocalStorageArr = [];
        const localStorageItems = await bookmarksStore.get_localStorageAll(null);
        const localStorageItemsImageArr = Object.values(localStorageItems).filter((e) => e.image);

        localStorageItemsImageArr.forEach((item) => {
            promiseLocalStorageArr.push(bookmarksStore.delete_localStorageItem(item.id));
        });

        Promise.all(promiseLocalStorageArr)
            .then(() => {
                // delete all bookmarks
                const promiseArr = [];

                bookmarksStore.bookmarks.forEach((item) => {
                    promiseArr.push(bookmarksStore.remove_bookmarkFolder(item.id));
                });

                Promise.all(promiseArr)
                    .then(async () => {
                        await nextTick();
                        bookmarksStore.sliderIndex = 0;
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

    onMounted(() => {
        console.log(bookmarksStore.bookmarks);
        enableArrowNavigation.value = bookmarksStore.arrowNavigation;
    });
</script>
