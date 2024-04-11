<template>
    <v-tooltip
        location="top center"
        origin="auto"
        open-delay="250"
        transition="none">
        <template v-slot:activator="{ props }">
            <!-- https://pictogrammers.com/library/mdi/ -->
            <span class="icon-container" v-bind="props">
                <v-icon
                    size="small"
                    :icon="mdiHelpCircleOutline" />
            </span>
        </template>
        <span v-html="tooltip"></span>
    </v-tooltip>

</template>

<script setup>
    import { mdiHelpCircleOutline } from '@mdi/js';

    defineProps({
        tooltip: {
            type: String,
            required: true,
        },
    });
</script>

<style scoped lang="scss">
    .icon-container {
        cursor: pointer;
        margin: 6px;
        padding: 2px;
        opacity: .7;
    }
</style>
