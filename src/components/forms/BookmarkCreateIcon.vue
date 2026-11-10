<template>
    <template v-if="!data || (data && data.url)">
        <v-row>
            <v-col
                cols="12">
                <span
                    class="icon-preview"
                    :class="effectiveSize">
                    <BookmarkIcon
                        :loading="isIconLoading"
                        :color="color ?? undefined"
                        :image="base64Image" />
                </span>
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
                <TooltipButton
                    class="mr-3 mb-3"
                    color="blue-darken-1"
                    variant="tonal"
                    text="Upload image"
                    :icon="mdiFolderOpen"
                    @click="onClickFindImage()" />
                <TooltipButton
                    class="mr-3 mb-3"
                    color="blue-darken-1"
                    variant="tonal"
                    text="Auto-generate icon based on URL"
                    :icon="mdiCloudDownload"
                    :disabled="!url"
                    @click="getClearbitImage()" />
                <TooltipButton
                    class="mr-3 mb-3"
                    color="blue-darken-1"
                    variant="tonal"
                    text="Pick background color"
                    :icon="mdiFormatColorFill"
                    @click="emits(EMITS.OPEN_COLOR_EDITOR)" />
                <TooltipButton
                    class="mb-3"
                    color="red"
                    variant="tonal"
                    text="Clear icon and background color"
                    :icon="mdiClose"
                    :disabled="!base64Image && !color"
                    @click="onClearImage()" />
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
    import { ref, watch, computed } from 'vue';
    import { mdiFormatColorFill, mdiFolderOpen, mdiCloudDownload, mdiClose } from '@mdi/js';
    import BookmarkIcon from '@/components/bookmarks/sharedComponents/BookmarkIcon.vue';
    import TooltipButton from '@/components/fields/TooltipButton.vue';
    import { getDomainFromUrl, isValidURL, getBase64ImageFromUrl } from '@utils/urlUtils';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { EMITS, LOGO_GENERATOR } from '@/constants';

    const bookmarksStore = useBookmarksStore();
    const effectiveSize = computed(() => `icon-${bookmarksStore.iconSize}`);

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
            const response = await getBase64ImageFromUrl(imageUrl);
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

        if (isValidURL(props.url)) {
            const domain = getDomainFromUrl(props.url);
            const imageUrl = `${LOGO_GENERATOR.LOGO_GENERATOR_DOMAIN}/${domain}?token=${LOGO_GENERATOR.LOGO_GENERATOR_TOKEN}`;

            fetchClearBitImage(imageUrl);
        }

        showClearbitError.value = false;
    }

    let init = false;

    async function onImageInpChange(event: Event): Promise<void> {
        const file = (event.target as HTMLInputElement).files?.[0];

        if (!file) {
            return;
        }

        base64Image.value = await bookmarksStore.toBase64(file);

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

    .icon-preview {
        display: inline-flex;
    }

    .icon-preview.icon-small {
        :deep(.bookmark-image-container) {
            width: 56px;
            padding: 7.14%;
            border-radius: 12.5%;
            font-size: 34px;
        }

        :deep(.bookmark-image) {
            border-radius: 8.93%;
        }
    }

    .icon-preview.icon-medium {
        :deep(.bookmark-image-container) {
            width: 82px;
            padding: 7.32%;
        }
    }

    .icon-preview.icon-large {
        :deep(.bookmark-image-container) {
            width: 108px;
            padding: 7.41%;
            border-radius: 12.96%;
            font-size: 66px;
        }

        :deep(.bookmark-image) {
            border-radius: 9.26%;
        }
    }

    .clearbit-error {
        color: rgb(var(--v-theme-error));
    }
</style>
