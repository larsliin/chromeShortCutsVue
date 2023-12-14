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
        <v-divider></v-divider>
        <v-card-actions>
            <v-spacer  class="mt-2 mb-2" />
            <div class="btn-wrapper">
                <div>
                    <v-btn
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

    const emits = defineEmits([
        EMITS.CANCEL, EMITS.CONFIRM,
    ]);

    const color = ref('#ff0000');

    const swatches = [
        ['#f44336', '#3f51b5', '#009688', '#ffeb3b'],
        ['#e81e63', '#2196f3', '#4caf50', '#ffc107'],
        ['#9c27b0', '#03a9f4', '#8bc34a', '#ff9800'],
        ['#673ab7', '#00bcd4', '#cddc39', '#ff5722'],
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

    onMounted(() => {
        bookmarksStore.dialogOpen = true;
    });

    onUnmounted(() => {
        bookmarksStore.dialogOpen = false;
    });
</script>
<style lang="scss" scoped>
    :deep(.v-color-picker-swatches) {
        transform: scale(1.5);
    }

    .btn-wrapper {
        display: flex;
        width: 100%;

        > div:first-child {
            flex: 1;
        }
    }
</style>
