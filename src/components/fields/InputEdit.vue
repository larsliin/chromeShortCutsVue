<template>
    <div class="wrapper">
        <input
            class="input"
            ref="input"
            type="input"
            tabindex="-1"
            :readonly="!active"
            :class="[
                enabled ? 'enabled' : '',
                active ? 'active' : '',
                style,
                bookmarksStore.enableDarkMode ? 'dark' : ''
            ]"
            :style="{width: inputWidth}"
            v-model="model"
            @click.stop="onClick($event)"
            @focus="bookmarksStore.titleInputActive = true"
            @blur="onBlur()"
            @keydown="onChange($event)" />
        <div class="foldout">
            <BookmarkFoldout
                :list="list"
                class="foldout"
                @delete="onDelete()"
                @bookmarkAdd="onBookmarkAdd()"
                @rename="onRename()" />
        </div>
        <span ref="textwidth" class="text-width">{{ model }}</span>
    </div>

    <Teleport to="body">
        <template>
            <v-row justify="center">
                <v-dialog
                    v-model="showConfirmDelete"
                    persistent
                    width="450">
                    <BookmarkConfirmDelete
                        :typeFolder="true"
                        :title="model"
                        :id="id"
                        @cancel="showConfirmDelete = false"
                        @confirm="onDeleteConfirm()" />
                </v-dialog>
            </v-row>
        </template>
    </Teleport>
</template>
<script setup>
    import { mdiRename, mdiDeleteOutline, mdiStar } from '@mdi/js';
    import { ref, onMounted } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import BookmarkConfirmDelete
        from '@/components/forms/BookmarkConfirmDelete.vue';
    import { EMITS } from '@/constants';
    import useEventsBus from '@cmp/eventBus';
    import { useUtils } from '@/shared/utils/utils';
    import BookmarkFoldout from '@/components/fields/BookmarkFoldout.vue';

    const utils = useUtils();

    const { emit } = useEventsBus();

    const bookmarksStore = useBookmarksStore();

    const props = defineProps({
        style: String,
        id: {
            type: String,
            required: true,
        },
        value: {
            type: String,
            required: true,
        },
        enabled: {
            type: Boolean,
            default: true,
        },
    });

    const list = ref([
        {
            title: 'New Bookmark',
            icon: mdiStar,
            event: EMITS.BOOKMARK_ADD,
        },
        {
            title: 'Rename',
            icon: mdiRename,
            event: EMITS.RENAME,
        },
        {
            title: 'Delete',
            icon: mdiDeleteOutline,
            event: EMITS.DELETE,
        },
    ]);

    const model = ref(props.value);
    const active = ref(false);
    const input = ref();
    const inputWidth = ref(0);
    const textwidth = ref();

    function onBookmarkAdd() {
        emit(EMITS.BOOKMARK_ADD, props.id);
    }

    function onRename() {
        active.value = true;
        inputWidth.value = `${textwidth.value.clientWidth + 0}px`;
        input.value.focus();
    }

    const showConfirmDelete = ref(false);

    function onDelete() {
        showConfirmDelete.value = true;
    }

    function onDeleteConfirm() {
        showConfirmDelete.value = false;

        // delete all bookmarks in folder from local storage
        utils.deleteBookmarkFolder(props.id);
    }

    function onBlur() {
        active.value = false;

        bookmarksStore.update_bookmark(props.id, { title: model.value });

        bookmarksStore.titleInputActive = false;
    }

    function onChange(event) {
        if (event.keyCode === 13) {
            input.value.blur();
            return;
        }

        let add = event.keyCode === 8 ? 0 : 10;
        add = props.style === 'slider' ? add : 0;
        inputWidth.value = `${textwidth.value.clientWidth + add}px`;
    }

    onMounted(() => {
        const add = props.style === 'slider' ? 10 : 0;
        inputWidth.value = `${textwidth.value.clientWidth + add}px`;
    });

    function onClick(event) {
        event.preventDefault();
    }

</script>

<style scoped lang="scss">
     .wrapper  {
        display: flex;
        position: relative;

        &:hover .foldout {
            opacity: 1;
        }
     }

    .input {
        border-radius: 4px;
        border: 1px solid transparent;
        cursor: default;
        font-size: 16px;
        padding: 6px;
        pointer-events: none;
        width: auto;

        &.slider {
            text-align: center;

            &.active {
                border: 1px solid rgba(0,0,0,.12);

                &.dark {
                    border: 1px solid var(--darkmode-400);
                }
            }
        }

        &:focus {
            outline: none;
        }

        &:focus {
            cursor: default;
        }

        &.enabled {
            pointer-events: initial;
        }
    }

    .text-width {
        display: inline-block;
        font-size: 16px;
        font-weight: 700;
        padding: 6px;
        position: absolute;
        visibility: hidden;
        pointer-events: none;
        z-index: -1;
        white-space: nowrap;
    }

    .foldout {
        right: 0;
        position: absolute;
        transform: translateX(42px);
        opacity: .25;
    }

</style>
