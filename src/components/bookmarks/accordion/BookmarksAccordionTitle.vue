<template>
    <v-expansion-panel-title
        :color="color">
        <BookmarkFoldout
            :list="list"
            class="foldout"
            @delete="onDelete()"
            @rename="onRename()"
            @openColorEditor="showColorEdit = true"
            @bookmarkAdd="onBookmarkAdd()" />
        <input
            aria-label="Bookmark title"
            class="input"
            type="text"
            ref="input"
            tabindex="-1"
            :class="[bookmarksStore.enableDarkMode ? 'dark' : '']"
            :style="{ width: inputWidth }"
            @click.stop="onInputClick($event)"
            @blur.stop="onBlur($event)"
            @keydown.stop="keyDown($event)"
            @keyup.stop="keyUp($event)"
            v-model="model" />
        <span ref="textWidth" class="text-width">{{ model }}</span>
        <v-icon
            size="large"
            class="icon-drag"
            :icon="mdiDragHorizontal" />
    </v-expansion-panel-title>
    <Teleport to="body"
        v-if="showConfirmDelete || showColorEdit">
        <template>
            <v-row justify="center">
                <v-dialog
                    v-model="showConfirmDelete"
                    persistent
                    width="450">
                    <BookmarkConfirmDelete
                        :showFolderMessage="true"
                        :title="model"
                        :id="bookmark.id"
                        @cancel="showConfirmDelete = false"
                        @confirm="onDeleteConfirm($event)" />
                </v-dialog>
                <v-dialog
                    v-model="showColorEdit"
                    persistent
                    width="450">
                    <BookmarkColorEdit
                        :value="bookmark.color"
                        @confirm="onColorConfirm($event)"
                        @cancel="showColorEdit = false" />
                </v-dialog>
            </v-row>
        </template>
    </Teleport>
</template>

<script setup>
    import {
        ref, onMounted, nextTick, watch,
    } from 'vue';
    import {
        mdiRename, mdiDragHorizontal, mdiDeleteOutline, mdiStar, mdiPalette,
    } from '@mdi/js';
    import { useBookmarksStore } from '@stores/bookmarks';
    import BookmarkConfirmDelete
        from '@/components/forms/BookmarkConfirmDelete.vue';
    import BookmarkColorEdit
        from '@/components/forms/BookmarkColorEdit.vue';

    import { EMITS } from '@/constants';
    import useEventsBus from '@cmp/eventBus';
    import BookmarkFoldout from '@/components/fields/BookmarkFoldout.vue';
    import { useUtils } from '@/shared/composables/utils';

    const utils = useUtils();

    const bookmarksStore = useBookmarksStore();

    const { emit, bus } = useEventsBus();

    const emits = defineEmits([
        EMITS.DELETE,
        EMITS.BOOKMARK_ADD,
        EMITS.BEFORE_DELETE,
    ]);

    const props = defineProps({
        bookmark: {
            type: Object,
            required: true,
        },
    });

    // https://pictogrammers.com/library/mdi
    const list = ref([
        {
            title: 'New Bookmark',
            icon: mdiStar,
            event: EMITS.BOOKMARK_ADD,
        },
        {
            title: 'Rename Folder',
            icon: mdiRename,
            event: EMITS.RENAME,
        },
        {
            title: 'Folder Color',
            icon: mdiPalette,
            event: EMITS.OPEN_COLOR_EDITOR,
        },
        {
            title: 'Delete Folder',
            icon: mdiDeleteOutline,
            event: EMITS.DELETE,
        },
    ]);

    const input = ref();
    const inputWidth = ref(0);
    const textWidth = ref();

    function onBookmarkAdd() {
        emit(EMITS.BOOKMARK_ADD, props.bookmark.id);
    }

    const showColorEdit = ref(false);

    const selectedColor = ref();

    const color = ref();

    async function onColorConfirm(event) {
        selectedColor.value = event;

        showColorEdit.value = false;

        const getColorsResponse = await bookmarksStore.get_syncStorage('folderColors');
        const colorsObj = getColorsResponse || {};

        const folder = bookmarksStore.bookmarks.find((e) => e.id === props.bookmark.id);

        if (event) {
            colorsObj[props.bookmark.id] = selectedColor.value;
            folder.color = selectedColor.value;
            color.value = selectedColor.value;
        } else if (colorsObj[props.bookmark.id]) {
            delete colorsObj[props.bookmark.id];
            folder.color = '';
            color.value = null;
        }

        if (!Object.keys(colorsObj).length) {
            bookmarksStore.delete_syncStorageItem('folderColors');
        } else {
            bookmarksStore.set_syncStorage({ folderColors: colorsObj });
        }
    }

    function onRename() {
        inputWidth.value = `${textWidth.value.clientWidth + 0}px`;

        input.value.focus();
    }

    const showConfirmDelete = ref(false);

    function onDelete() {
        showConfirmDelete.value = true;
    }

    async function onDeleteConfirm() {
        emits(EMITS.BEFORE_DELETE);

        await nextTick();

        // close confirmation dialogue
        showConfirmDelete.value = false;

        // get updated bookmark folder index
        const bookmarkResponse = await bookmarksStore.get_bookmarkById(props.bookmark.id);
        const bookmark = bookmarkResponse;

        utils.deleteBookmarkFolder(bookmarkResponse);

        emits(EMITS.DELETE, { id: props.bookmark.id, index: bookmark.index });
    }

    function onInputClick(event) {
        event.preventDefault();
    }

    const model = ref(props.bookmark.title);

    function onBlur() {
        bookmarksStore.update_bookmark(props.bookmark.id, { title: model.value });
    }

    async function keyDown(event) {
        if (event.keyCode === 13) {
            input.value.blur();
        }

        const add = event.keyCode === 8 ? -6 : 6;

        await nextTick();

        inputWidth.value = `${textWidth.value.clientWidth + add}px`;
    }

    function keyUp(event) {
        event.preventDefault();
    }

    async function updateColor() {
        const getColorResponse = await bookmarksStore.get_syncStorage('folderColors');

        if (getColorResponse) {
            color.value = getColorResponse[props.bookmark.id];
        }
    }

    watch(() => bus.value.get(EMITS.IMAGES_IMPORT), () => {
        updateColor();
    });

    onMounted(() => {
        inputWidth.value = `${textWidth.value.clientWidth + 0}px`;

        color.value = props.bookmark.color;
    });

</script>

<style scoped lang="scss">
    .v-expansion-panel-title:after {
        content: '';
        background: linear-gradient(0deg, rgba(0,0,0,.15) 0%, rgba(0,0,0,0) 100%);
        display: block;
        height: 100%;
        left: 0;
        position: absolute;
        top: 0;
        width: 100%;
    }

    .input {
        border: 1px solid transparent;
        color: inherit;
        max-width: calc(48% - 30px);
        overflow: hidden;
        padding: 4px 6px;
        pointer-events: none;
        position: relative;
        text-overflow: ellipsis;
        white-space: nowrap;
        z-index: 10;

        &:focus {
            outline: none;
            pointer-events: auto;
            border: 1px solid rgba(0,0,0,.12);

            &.dark {
                border: 1px solid var(--darkmode-300);
            }
        }
    }

    .foldout {
        margin-right: 4px;

    }
    :deep(.v-btn) {
        color: inherit
    }

    :deep(.v-expansion-panel-title__overlay) {
        background-color: rgb(var(--v-theme-primary));
        pointer-events: none;
    }

    .v-expansion-panel--active>.v-expansion-panel-title {
        min-height: 52px;
    }

    .v-expansion-panel-title {
        padding: 2px 24px 2px 10px;

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
        z-index: 0;
    }

    .text-width {
        display: inline-block;
        font-size: 15px;
        padding: 0 10px;
        pointer-events: none;
        position: absolute;
        visibility: hidden;
        white-space: nowrap;
        z-index: -1;
    }
</style>
