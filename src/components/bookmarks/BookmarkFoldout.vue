<template>
    <v-menu
        location="end bottom"
        origin="start top">
        <template v-slot:activator="{ props }">
            <v-btn
                class="button"
                size="small"
                icon="mdi-dots-vertical"
                v-bind="props"></v-btn>
        </template>
        <v-list
            class="list">
            <v-list-item class="list-item"
                v-for="(item, i) in items" :key="i">
                <v-list-item-title>
                    <!-- https://pictogrammers.com/library/mdi/ -->
                    <v-btn
                        class="item-button"
                        size="small"
                        height="48"
                        :ripple="false"
                        variant="text"
                        @click="onListItemClick(item.event)">
                        <span class="item-button-text text-body-2">
                            <v-icon
                                class="icon"
                                :icon="item.icon" />
                            <span class="item-title">{{ item.title }}</span>
                        </span>
                    </v-btn>
                </v-list-item-title>
            </v-list-item>
        </v-list>
    </v-menu>
</template>

<script setup>
    import { ref } from 'vue';
    import { EMITS } from '@/constants';

    const emits = defineEmits([
        EMITS.DELETE, EMITS.DELETE,
    ]);

    const items = ref([
        {
            title: 'Rename',
            icon: 'mdi-rename',
            event: EMITS.RENAME,
        },
        {
            title: 'Delete',
            icon: 'mdi-delete-outline',
            event: EMITS.DELETE,
        },
    ]);

    function onListItemClick(event) {
        switch (event) {
            case EMITS.RENAME:
                emits(EMITS.RENAME);
                break;
            case EMITS.DELETE:
                emits(EMITS.DELETE);
                break;
            default:
        }
    }
</script>

<style scoped lang="scss">
    .v-list.list {
        padding-inline-end: 0;
        padding-inline-start: 0;
        padding: 0;
    }

    .v-list-item.list-item {
        padding-inline-end: 0;
        padding-inline-start: 0;
        padding: 0;
    }

    .button {
        background-color: transparent;
        box-shadow: none;
    }

    .item-button {
        border-radius: 0;
        font-weight: normal;
        justify-content: flex-start;
        padding: 0 18px;
        width: 100%;

        .item-button-text {
            line-height: 1;
        }
    }

    .item-title {
        vertical-align: bottom;
        display: inline-block;
    }

    .icon {
        margin-right: 6px;
        display: inline-block;
    }

</style>
