<template>
    <v-expansion-panel-title>
        <BookmarkFoldout
            :list="list"
            class="foldout"
            @delete="onDelete()"
            @rename="onRename()" />
        <input
            class="input"
            type="text"
            ref="input"
            tabindex="-1"
            :class="[ active, bookmarksStore.enableDarkMode ? 'dark' : '']"
            :style="{width: inputWidth}"
            @click.stop="onInputClick($event)"
            @blur.stop="onBlur($event)"
            @keydown.stop="keyDown($event)"
            @keyup.stop="keyUp($event)"
            v-model="model" />
        <span ref="textwidth" class="text-width">{{ model }}</span>
        <v-icon
            size="large"
            class="icon-drag"
            icon="mdi-drag-horizontal"></v-icon>
    </v-expansion-panel-title>
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
                        :id="bookmark.id"
                        @cancel="showConfirmDelete = false"
                        @confirm="onDeleteConfirm($event)" />
                </v-dialog>
            </v-row>
        </template>
    </Teleport>
</template>

<script setup>
    import {
        ref, onMounted, nextTick,
    } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import BookmarkFoldout
        from '@/components/bookmarks/BookmarkFoldout.vue';
    import BookmarkConfirmDelete
        from '@/components/forms/BookmarkConfirmDelete.vue';
    import { EMITS } from '@/constants';

    const bookmarksStore = useBookmarksStore();

    const emits = defineEmits([
        EMITS.DELETE,
    ]);

    const props = defineProps({
        bookmark: Object,
    });

    const list = ref([
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

    const input = ref();
    const active = ref(false);
    const inputWidth = ref(0);
    const textwidth = ref();

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

        emits(EMITS.DELETE, props.bookmark.id);

        bookmarksStore.remove_bookmarkFolder(props.bookmark.id);
    }

    function onInputClick(event) {
        event.preventDefault();
    }

    const model = ref(props.bookmark.title);

    function onBlur() {
        bookmarksStore.update_bookmark(props.bookmark.id, { title: model.value });

        active.value = false;
    }

    async function keyDown(event) {
        if (event.keyCode === 13) {
            input.value.blur();
        }

        const add = event.keyCode === 8 ? -6 : 6;

        await nextTick();

        inputWidth.value = `${textwidth.value.clientWidth + add}px`;
    }

    function keyUp(event) {
        event.preventDefault();
    }

    onMounted(() => {
        inputWidth.value = `${textwidth.value.clientWidth + 0}px`;
    });

</script>

<style scoped lang="scss">
    .input {
        border: 1px solid transparent;
        max-width: calc(48% - 30px);
        overflow: hidden;
        padding: 4px 6px;
        pointer-events: none;
        text-overflow: ellipsis;
        white-space: nowrap;

        &.active {
            pointer-events: initial;
        }

        &:focus {
            outline: none;
            border: 1px solid rgba(0,0,0,.12);

            &.dark {
                border: 1px solid var(--darkmode-300);
            }
        }
    }

    .foldout {
        margin-right: 4px;
    }

    :deep(.v-expansion-panel-title__overlay) {
        pointer-events: none;
        background-color: rgb(var(--v-theme-primary));
    }

    .v-expansion-panel-title {
        padding: 6px 24px 6px 10px;

        &:hover {
            .button {
                opacity: .5;
            }

            .icon-drag {
                opacity: .75;
            }
        }
    }

    .icon-edit {
        height: 15px;
    }

    .icon-drag {
        left: 50%;
        opacity: .15;
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
    }

    .text-width {
        display: inline-block;
        font-size: 15px;
        padding: 0 10px;
        position: absolute;
        visibility: hidden;
        pointer-events: none;
        z-index: -1;
        white-space: nowrap;
    }
</style>
