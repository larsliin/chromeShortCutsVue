<template>
    <template v-if="!data || (data && data.url)">
        <v-row>
            <v-col
                cols="12">
                <BookmarkIcon
                    :loading="isIconLoading"
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
                    color="blue-darken-1 mr-3 mb-3"
                    variant="tonal"
                    @click="onClickFindImage()">
                    Browse
                </v-btn>
                <v-btn
                    class="mr-3 mb-3"
                    color="blue-darken-1"
                    variant="tonal"
                    :disabled="!url"
                    @click="getClearbitImage()">
                    Generate
                </v-btn>
                <v-btn
                    color="blue-darken-1 mb-3"
                    variant="tonal"
                    :disabled="!base64Image"
                    @click="onClearImage()">
                    Clear
                </v-btn>
            </v-col>
            <v-col cols="12">
                <template v-if="showClearbitError && bookmarksStore.popup">
                    <span class="clearbit-error">
                        The icon generator service
                        could not recognize the provided domain
                    </span>
                </template>
            </v-col>
        </v-row>
    </template>
</template>

<script setup>
    import {
        ref, watch,
    } from 'vue';
    import BookmarkIcon from '@/components/bookmarks/sharedComponents/BookmarkIcon.vue';
    import { EMITS } from '@/constants';
    import { useUtils } from '@/shared/utils/utils';
    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();

    const utils = useUtils();

    const props = defineProps({
        data: {
            type: Object,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
        iconUrl: String,
    });

    const emits = defineEmits([
        EMITS.CLEARBIT_ERROR,
        EMITS.UPDATE,
    ]);

    const showClearbitError = ref(false);

    const isIconLoading = ref(false);

    const base64Image = ref();

    async function fetchClearBitImage(imageUrl) {
        isIconLoading.value = true;
        try {
            const response = await utils.getBase64ImageFromUrl(imageUrl);
            if (response === 'error') {
                showClearbitError.value = true;
                emits(EMITS.CLEARBIT_ERROR, props.url);
            } else {
                base64Image.value = response;
                emits(EMITS.UPDATE, base64Image.value);
            }
            isIconLoading.value = false;
        } catch (error) {
            isIconLoading.value = false;
        }
    }

    function getClearbitImage() {
        if (!props.url) {
            return;
        }

        if (utils.isValidURL(props.url)) {
            const domain = utils.getDomainFromUrl(props.url);
            const imageUrl = `https://logo.clearbit.com/${domain}?size=200`;

            fetchClearBitImage(imageUrl);
        }

        showClearbitError.value = false;
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

    const imageFile = ref();
    let init = false;

    async function onImageInpChange(event) {
        // eslint-disable-next-line prefer-destructuring
        imageFile.value = event.target.files[0];

        const base64Response = await getBase64Data(imageFile.value);
        base64Image.value = base64Response;

        emits(EMITS.UPDATE, base64Image.value);
    }

    function onClickFindImage() {
        document.getElementById('inp_image').click();
    }

    function onClearImage() {
        base64Image.value = null;

        emits(EMITS.UPDATE, base64Image);
    }

    watch(() => props.iconUrl, (newVal) => {
        if (!init) {
            init = true;
            base64Image.value = newVal;
        }
    });

</script>
<style scoped lang="scss">
    .inp-file {
        display: none;
    }

    .clearbit-error {
        color: rgb(var(--v-theme-error));
    }
</style>
