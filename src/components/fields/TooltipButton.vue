<template>
    <v-tooltip
        location="top center"
        origin="auto"
        open-delay="600"
        transition="none"
        :text="text">
        <template v-slot:activator="{ props: tooltipProps }">
            <v-btn
                :icon="icon"
                v-bind="{ ...tooltipProps, ...$attrs }" />
        </template>
    </v-tooltip>
</template>

<script setup lang="ts">
    import type { FoldoutListItem } from '@/types/bookmark';

    interface Props {
        text: string;
        icon: FoldoutListItem['icon'];
    }

    // Attributes such as class, color and onClick belong on the button, not the tooltip.
    defineOptions({ inheritAttrs: false });

    defineProps<Props>();
</script>
