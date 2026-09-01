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
        align-items: center;
        background: rgb(var(--v-theme-surface-variant));
        border-radius: 4px;
        bottom: 0;
        color: rgb(var(--v-theme-on-surface-variant));
        display: flex;
        font-size: 14px;
        justify-content: center;
        left: 50%;
        line-height: 1.2;
        max-width: 200px;
        opacity: 0;
        overflow: hidden;
        padding: 5px 16px;
        pointer-events: none;
        position: absolute;
        text-align: center;
        text-overflow: ellipsis;
        transform: translate(-50%, 4px);
        white-space: nowrap;
        // Above neighboring bookmark labels and popup controls.
        z-index: 30;

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

    .bookmark.icon-small .tooltip {
        font-size: 12px;
        padding: 4px 10px;
        transform: translate(-50%, 2px);
        z-index: 40;
    }
</style>
