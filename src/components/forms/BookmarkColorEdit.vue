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

    const color = ref();

    const swatches = [
        ['#FB3838', '#F99B7B', '#FCD291', '#F8B531', '#FFFFFF'],
        ['#EFEF3F', '#F4F5A4', '#C4E49E', '#9DD354', '#D3D3D3'],
        ['#73CC6C', '#B3DBA7', '#B6DFD2', '#7DD0B8', '#808080'],
        ['#60C4ED', '#ACD9F8', '#9EACD5', '#6680C5', '#555555'],
        ['#7C65B6', '#A797CA', '#C19ECA', '#A064B0', '#333333'],
        ['#E860AC', '#EAA5C8', '#FC9FB7', '#FB338F', '#000000'],
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
