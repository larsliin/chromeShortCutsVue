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
                            <h5 class="text-h6 mb-3">Import Bookmarks</h5>
                            <p
                                class="text-body-1 mb-3">
                                Import bookmarks data file
                            </p>
                            <v-file-input
                                label="File input"
                                prepend-icon="mdi-upload"></v-file-input>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col
                            cols="12">
                            <p
                                class="text-body-1 mb-3">
                                Export bookmarks for simple importing on devices not
                                linked to this Google account
                            </p>
                            <v-btn
                                color="blue-darken-1"
                                variant="tonal"
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

    const emits = defineEmits([EMITS.CLOSE, EMITS.SAVE]);

    const bookmarksStore = useBookmarksStore();

    const form = ref();
    const enableArrowNavigation = ref(bookmarksStore.arrowNavigation);

    function onClickImport() {
        document.getElementById('inp_import').click();
    }

    function onClickExport() { }

    function onClickSave() {
        bookmarksStore.arrowNavigation = enableArrowNavigation.value;

        if (!enableArrowNavigation.value) {
            bookmarksStore.set_localStorage({ arrowNavigation: false });
        } else {
            console.log('del');
            bookmarksStore.delete_localStorageItem('arrowNavigation');
        }

        emits(EMITS.SAVE);
    }

    onMounted(async () => {
        enableArrowNavigation.value = bookmarksStore.arrowNavigation;
    });
</script>
<style>
    .inp-file {
        display: none;
    }
</style>
