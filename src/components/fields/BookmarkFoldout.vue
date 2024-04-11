<template>
    <v-menu
        :class="{
            'dark-mode-border': darkModeBorder, dark: bookmarksStore.enableDarkMode,
        }"
        location="end bottom"
        origin="start top"
        v-model="toggle">
        <template v-slot:activator="{ props }">
            <v-btn
                class="button"
                :size="size"
                :icon="mdiDotsVertical"
                v-bind="props" />
        </template>
        <v-list
            class="list">
            <v-list-item class="list-item"
                v-for="(item, i) in list"
                :key="i">
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
    import { mdiDotsVertical } from '@mdi/js';
    import { ref, watch } from 'vue';
    import { EMITS } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';
    import useEventsBus from '@cmp/eventBus';

    const { bus } = useEventsBus();

    const bookmarksStore = useBookmarksStore();

    const emits = defineEmits([
        EMITS.DELETE,
        EMITS.RENAME,
        EMITS.TOGGLE,
        EMITS.OPEN_COLOR_EDITOR,
        EMITS.EDIT,
        EMITS.BOOKMARK_ADD,
    ]);

    defineProps({
        list: {
            type: Array,
            required: true,
        },
        size: {
            type: String,
            default: 'small',
        },
        darkModeBorder: Boolean,
    });

    const toggle = ref();

    function onListItemClick(event) {
        switch (event) {
        case EMITS.RENAME:
            emits(EMITS.RENAME);
            break;
        case EMITS.OPEN_COLOR_EDITOR:
            emits(EMITS.OPEN_COLOR_EDITOR);
            break;
        case EMITS.DELETE:
            emits(EMITS.DELETE);
            break;
        case EMITS.EDIT:
            emits(EMITS.EDIT);
            break;
        case EMITS.BOOKMARK_ADD:
            emits(EMITS.BOOKMARK_ADD);
            break;
        default:
        }
    }

    watch(toggle, (newVal) => {
        emits(EMITS.TOGGLE, newVal);
    });

    watch(() => bus.value.get(EMITS.DRAG_START), async () => {
        if (toggle.value) {
            toggle.value = false;
        }
    });
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
        position: relative;
        z-index: 5;
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

    .dark-mode-border.dark :deep(.v-list) {
        border: 1px solid rgba(255,255,255,.1);
    }

</style>
