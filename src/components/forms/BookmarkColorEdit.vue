<template>
    <v-card>
        <v-card-text>
            <div class="text-center">
                <h5 class="text-h5">Select color</h5>
            </div>
            <div class="text-center mt-8">
                <v-color-picker
                    class="d-inline"
                    v-model="color"
                    hide-sliders
                    hide-inputs
                    hide-canvas
                    swatches-max-height="200"
                    :swatches="swatches"
                    show-swatches />
            </div>
        </v-card-text>
        <v-spacer class="mt-2 mb-2" />
        <v-divider />
        <v-card-actions>
            <v-spacer class="mt-2 mb-2" />
            <div class="btn-wrapper">
                <div>
                    <v-btn
                        v-if="hasColor"
                        variant="text"
                        @click="onClear()">
                        Clear
                    </v-btn>
                </div>
                <div>
                    <v-btn
                        variant="text"
                        @click="onCancel()">
                        Cancel
                    </v-btn>
                    <v-btn
                        variant="tonal"
                        :disabled="!color"
                        @click="onConfirm()">
                        Update
                    </v-btn>
                </div>
            </div>
        </v-card-actions>
    </v-card>
</template>

<script setup>
    import { onMounted, onUnmounted, ref } from 'vue';
    import { EMITS } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();

    const props = defineProps({
        value: {
            type: String,
            required: true,
        },
    });

    const emits = defineEmits([
        EMITS.CANCEL, EMITS.CONFIRM,
    ]);

    const color = ref();

    const swatches = [
        ['#ffcb0e', '#f5e70c', '#f0ea22', '#c0d62f', '#FFFFFF'],
        ['#89c541', '#46b749', '#24af4b', '#2ab567', '#D3D3D3'],
        ['#10a1c5', '#197fbe', '#1c60ad', '#294b9f', '#808080'],
        ['#263a94', '#373491', '#613191', '#9f3c96', '#555555'],
        ['#c21b79', '#e71b4c', '#ed2227', '#ee3824', '#333333'],
        ['#f26324', '#f57a20', '#f79020', '#faac1a', '#000000'],
    ];

    function onCancel() {
        emits(EMITS.CANCEL);
    }
    function onConfirm() {
        emits(EMITS.CONFIRM, color.value);
    }

    function onClear() {
        emits(EMITS.CONFIRM, null);
    }

    const hasColor = ref(false);

    onMounted(() => {
        color.value = props.value;

        hasColor.value = !!props.value;

        bookmarksStore.dialogOpen = true;
    });

    onUnmounted(() => {
        bookmarksStore.dialogOpen = false;
    });
</script>
<style lang="scss" scoped>
    :deep(.v-color-picker-swatches) {
        transform: scale(1.3);
    }

    .btn-wrapper {
        display: flex;
        width: 100%;

        > div:first-child {
            flex: 1;
        }
    }
</style>
