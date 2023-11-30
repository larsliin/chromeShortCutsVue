<template>
    <v-card>
        <v-card-text>
            <div class="text-center">
                <h5 class="text-h5">Delete {{ typeFolder ? 'Folder' : 'Bookmark' }}</h5>
            </div>
            <p class="text-center text-body-1 mt-3 mb-3">
                Are you sure you want to delete {{ title }}?
            </p>
            <p class="text-center text-body-1 mt-3 mb-3"
                v-if="typeFolder">
                Deleting {{ title }} will also permanently delete its containing bookmarks
            </p>
        </v-card-text>
        <v-spacer class="mt-2 mb-2" />
        <v-divider></v-divider>
        <v-card-actions>
            <v-spacer  class="mt-2 mb-2" />
            <div>
                <v-btn
                    variant="text"
                    @click="onCancel()">
                    Cancel
                </v-btn>
                <v-btn
                    variant="tonal"
                    color="red"
                    @click="onConfirmDelete()">
                    Delete
                </v-btn>
            </div>
        </v-card-actions>
    </v-card>
</template>

<script setup>
    import { onMounted, onUnmounted } from 'vue';
    import { EMITS } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();

    const props = defineProps({
        title: {
            type: String,
            default: '',
        },
        id: {
            type: String,
            required: true,
        },
        typeFolder: Boolean,
    });

    const emits = defineEmits([
        EMITS.CANCEL, EMITS.CONFIRM,
    ]);

    function onCancel() {
        emits(EMITS.CANCEL);
    }
    function onConfirmDelete() {
        emits(EMITS.CONFIRM, props.id);
    }

    onMounted(() => {
        bookmarksStore.dialogOpen = true;
    });

    onUnmounted(() => {
        bookmarksStore.dialogOpen = false;
    });
</script>
