<template>
    <template v-if="!data || (data && data.url)">
        <v-row>
            <v-col
                cols="12">
                <BookmarkIcon
                    :loading="isIconLoading"
                    :color="color ?? undefined"
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
                <v-tooltip
                    location="top center"
                    origin="auto"
                    open-delay="600"
                    transition="none"
                    text="Upload image">
                    <template v-slot:activator="{ props: tooltipProps }">
                        <v-btn
                            class="mr-3 mb-3"
                            color="blue-darken-1"
                            variant="tonal"
                            :icon="mdiFolderOpen"
                            v-bind="tooltipProps"
                            @click="onClickFindImage()" />
                    </template>
                </v-tooltip>
                <v-tooltip
                    location="top center"
                    origin="auto"
                    open-delay="600"
                    transition="none"
                    text="Auto-generate icon based on URL">
                    <template v-slot:activator="{ props: tooltipProps }">
                        <v-btn
                            class="mr-3 mb-3"
                            color="blue-darken-1"
                            variant="tonal"
                            :icon="mdiCloudDownload"
                            :disabled="!url"
                            v-bind="tooltipProps"
                            @click="getClearbitImage()" />
                    </template>
                </v-tooltip>
                <v-tooltip
                    location="top center"
                    origin="auto"
                    open-delay="600"
                    transition="none"
                    text="Pick background color">
                    <template v-slot:activator="{ props: tooltipProps }">
                        <v-btn
                            class="mr-3 mb-3"
                            color="blue-darken-1"
                            variant="tonal"
                            :icon="mdiFormatColorFill"
                            v-bind="tooltipProps"
                            @click="emits(EMITS.OPEN_COLOR_EDITOR)" />
                    </template>
                </v-tooltip>
                <v-tooltip
                    location="top center"
                    origin="auto"
                    open-delay="600"
                    transition="none"
                    text="Clear icon and background color">
                    <template v-slot:activator="{ props: tooltipProps }">
                        <v-btn
                            class="mb-3"
                            color="red"
                            variant="tonal"
                            :icon="mdiClose"
                            :disabled="!base64Image && !color"
                            v-bind="tooltipProps"
                            @click="onClearImage()" />
                    </template>
                </v-tooltip>
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

<script setup lang="ts">
    import { ref, watch } from 'vue';
    import { mdiFormatColorFill, mdiFolderOpen, mdiCloudDownload, mdiClose } from '@mdi/js';
    import BookmarkIcon from '@/components/bookmarks/sharedComponents/BookmarkIcon.vue';
    import { useUtils } from '@/shared/composables/utils';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { EMITS, LOGO_GENERATOR } from '@/constants';

    const bookmarksStore = useBookmarksStore();

    const utils = useUtils();

    interface Props {
        data?: { url?: string };
        url?: string | null;
        iconUrl?: string;
        color?: string | null;
    }

    const props = withDefaults(defineProps<Props>(), { url: null, iconUrl: '', color: null });

    const emits = defineEmits([
        EMITS.CLEARBIT_ERROR,
        EMITS.UPDATE,
        EMITS.OPEN_COLOR_EDITOR,
        EMITS.CLEAR_COLOR,
    ]);

    const showClearbitError = ref(false);

    const isIconLoading = ref(false);

    const base64Image = ref();

    async function fetchClearBitImage(imageUrl: string): Promise<void> {
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
        } catch (_error) {
            isIconLoading.value = false;
        }
    }

    function getClearbitImage() {
        if (!props.url) {
            return;
        }

        if (utils.isValidURL(props.url)) {
            const domain = utils.getDomainFromUrl(props.url);
            const imageUrl = `${LOGO_GENERATOR.LOGO_GENERATOR_DOMAIN}/${domain}?token=${LOGO_GENERATOR.LOGO_GENERATOR_TOKEN}`;

            fetchClearBitImage(imageUrl);
        }

        showClearbitError.value = false;
    }

    async function getBase64Data(file: File): Promise<string | ArrayBuffer | null> {
        const base64Data = await bookmarksStore.toBase64(file);
        return base64Data;
    }

    const imageFile = ref();
    let init = false;

    async function onImageInpChange(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        imageFile.value = input.files?.[0];

        const base64Response = await getBase64Data(imageFile.value);
        base64Image.value = base64Response;

        emits(EMITS.UPDATE, base64Image.value);
    }

    function onClickFindImage(): void {
        (document.getElementById('inp_image') as HTMLElement)?.click();
    }

    function onClearImage() {
        base64Image.value = null;
        emits(EMITS.UPDATE, '');
        emits(EMITS.CLEAR_COLOR);
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
