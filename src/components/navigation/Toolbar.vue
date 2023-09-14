<template>
    <div class="toolbar flex">
        <div>
            <v-btn
            :color="'primary'"
            @click="dialog = true">Add Bookmark</v-btn>
        </div>
        <v-btn icon="mdi-wrench" size="small"></v-btn>
    </div>

    <Teleport to="body">
        <template>
            <v-row justify="center">
                <v-dialog
                    v-model="dialog"
                    persistent
                    width="450">
                    <BookmarkForm
                        @close="dialog = false"
                        @save="onSave()" />
                </v-dialog>
            </v-row>
        </template>
    </Teleport>
</template>

<script setup>
    import { ref } from 'vue';
    import BookmarkForm from '@/components/forms/BookmarkForm.vue';

    const dialog = ref(false);

    function onSave() {
        dialog.value = false;
    }
</script>

<style scoped lang="scss">
.toolbar {
    padding: 20px;
    position: fixed;
    width: 100%;
    z-index: 999;

    > div:first-child {
        flex: 1;
    }
}
</style>
