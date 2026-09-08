<template>
    <v-card>
        <v-card-text>
            <div class="text-center">
                <h5 class="text-h5">{{ ungroup ? 'Ungroup' : `Delete ${typeFolder ? 'Folder' : 'Bookmark'}` }}</h5>
            </div>
            <p class="text-center text-body-1 mt-3 mb-3">
                Are you sure you want to {{ ungroup ? 'ungroup' : 'delete' }} {{ title }}?
            </p>
            <p class="text-center text-body-1 mt-3 mb-3"
                v-if="typeFolder && !ungroup">
                Deleting {{ title }} will also permanently delete its containing bookmarks
            </p>
        </v-card-text>
        <v-spacer class="mt-2 mb-2" />
        <v-divider />
        <v-card-actions>
            <v-spacer class="mt-2 mb-2" />
            <div class="actions">
                <v-btn
                    variant="text"
                    @click="onCancel()">
                    Cancel
                </v-btn>
                <v-btn
                    variant="tonal"
                    :color="ungroup ? undefined : 'red'"
                    @click="onConfirmDelete()">
                    {{ ungroup ? 'Ungroup' : 'Delete' }}
                </v-btn>
            </div>
        </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
    import { onMounted, onUnmounted } from 'vue';
    import { EMITS } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();

    interface Props {
        title?: string;
        id: string;
        typeFolder?: boolean;
        ungroup?: boolean;
    }

    const props = withDefaults(defineProps<Props>(), { title: '' });

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

<style scoped lang="scss">
    .actions {
        display: flex;
        gap: 12px;
    }
</style>
