<template>
    <div class="tooltip">{{ text }}</div>
</template>

<script setup lang="ts">
    interface Props {
        text: string;
    }

    defineProps<Props>();
</script>

<style scoped lang="scss">
    // Shared by BookmarkLink and BookmarkGroupCard; the hover trigger that
    // reveals it lives in each parent's own scoped styles.
    .tooltip {
        background: rgb(var(--v-theme-surface-variant));
        border-radius: 4px;
        bottom: 0;
        color: rgb(var(--v-theme-on-surface-variant));
        font-size: 14px;
        left: 50%;
        max-width: 200px;
        opacity: 0;
        overflow: hidden;
        padding: 5px 16px;
        pointer-events: none;
        position: absolute;
        text-overflow: ellipsis;
        transform: translate(-50%, 8px);
        white-space: nowrap;

        @media (min-width: 768px) {
            max-width: 230px;
        }

        @media (min-width: 1024px) {
            max-width: 300px;
        }

        @media (min-width: 1200px) {
            max-width: 500px;
        }
    }
</style>
