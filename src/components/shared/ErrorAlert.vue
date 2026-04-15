<template>
    <v-alert
        v-if="bookmarksStore.errorMessage"
        type="error"
        variant="tonal"
        closable
        class="error-alert"
        @click:close="bookmarksStore.errorMessage = null">
        {{ bookmarksStore.errorMessage }}
    </v-alert>
</template>

<script setup lang="ts">
    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();
</script>

<style scoped lang="scss">
    .error-alert {
        position: fixed;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        min-width: 350px;
        max-width: 600px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
</style>
