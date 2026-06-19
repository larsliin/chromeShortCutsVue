<template>
    <span
        class="popup-item"
        :class="{ 'foldout-open': isFoldoutOpen, 'drag-active': bookmarksStore.dragStart }">
        <span class="popup-handle">
            <a
                class="group-grid-link"
                :href="bookmark.url || undefined"
                :aria-label="bookmark.title"
                draggable="false"
                @dragstart.prevent
                @click="onOpenBookmark($event)">
                <BookmarkIcon
                    :color="color ?? undefined"
                    :folder="false"
                    :hide="!ready"
                    :image="image" />
            </a>
        </span>
        <div class="bookmark-edit">
            <BookmarkFoldout
                :darkModeBorder="true"
                :list="list"
                :size="'x-small'"
                @toggle="onToggle($event)"
                @delete="onDelete()"
                @edit="emitter.emit(EMITS.EDIT, bookmark.id)"
                @openColorEditor="showColorEdit = true" />
        </div>
    </span>
    <Teleport to="body"
        v-if="showConfirmDelete">
        <template>
            <v-row justify="center">
                <v-dialog
                    v-model="showConfirmDelete"
                    persistent
                    width="450">
                    <BookmarkConfirmDelete
                        :title="bookmark.title"
                        :id="bookmark.id"
                        :typeFolder="false"
                        @cancel="showConfirmDelete = false"
                        @confirm="onDeleteConfirm($event)" />
                </v-dialog>
            </v-row>
        </template>
    </Teleport>
    <Teleport to="body"
        v-if="showColorEdit">
        <template>
            <v-row justify="center">
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

<script setup lang="ts">
    import { mdiRename, mdiDeleteOutline, mdiFormatColorFill } from '@mdi/js';
    import { ref, onMounted, toRef, type Ref } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { EMITS } from '@/constants';
    import emitter from '@cmp/eventBus';
    import type { BookmarkNode, FoldoutListItem } from '@/types/bookmark';
    import BookmarkConfirmDelete from '@/components/forms/BookmarkConfirmDelete.vue';
    import BookmarkIcon from '@/components/bookmarks/sharedComponents/BookmarkIcon.vue';
    import BookmarkFoldout from '@/components/fields/BookmarkFoldout.vue';
    import BookmarkColorEdit from '@/components/forms/BookmarkColorEdit.vue';
    import { useBookmarkOps } from '@cmp/useBookmarkOps';
    import { useOpenBookmark } from '@cmp/useOpenBookmark';

    const utils = useBookmarkOps();

    interface Props {
        bookmark: BookmarkNode;
        image?: string | null;
        ready?: boolean;
    }

    const props = withDefaults(defineProps<Props>(), {
        image: null,
        ready: true,
    });

    const bookmarksStore = useBookmarksStore();

    const isFoldoutOpen = ref(false);
    const showConfirmDelete = ref(false);
    const showColorEdit = ref(false);
    const selectedColor = ref<string | null>();
    const color = toRef(props.bookmark, 'color') as Ref<string | null | undefined>;
    const image = toRef(props, 'image') as Ref<string | null | undefined>;
    const ready = toRef(props, 'ready');

    const list = ref<FoldoutListItem[]>([
        {
            title: 'Edit',
            icon: mdiRename,
            event: EMITS.EDIT,
        },
        {
            title: 'Color',
            icon: mdiFormatColorFill,
            event: EMITS.OPEN_COLOR_EDITOR,
        },
        {
            title: 'Delete',
            icon: mdiDeleteOutline,
            event: EMITS.DELETE,
        },
    ]);

    function onToggle(event: boolean): void {
        isFoldoutOpen.value = event;
    }

    function onDelete(): void {
        showConfirmDelete.value = true;
    }

    function onDeleteConfirm(): void {
        showConfirmDelete.value = false;
        bookmarksStore.removeBookmark(props.bookmark.id);
    }

    async function onColorConfirm(event: string | null): Promise<void> {
        selectedColor.value = event;
        showColorEdit.value = false;

        const getColorsResponse = await bookmarksStore.getSyncStorage('bookmarkColors');
        const colorsObj = (getColorsResponse || {}) as Record<string, string>;

        const bookmark = utils.getStoredBookmarkById(props.bookmark.id);

        if (event) {
            colorsObj[props.bookmark.id] = selectedColor.value as string;
            if (bookmark) {
                bookmark.color = selectedColor.value as string;
            }
            color.value = selectedColor.value;
        } else if (colorsObj[props.bookmark.id]) {
            delete colorsObj[props.bookmark.id];
            if (bookmark) {
                bookmark.color = '';
            }
            color.value = null;
        }

        if (!Object.keys(colorsObj).length) {
            bookmarksStore.deleteSyncStorageItem('bookmarkColors');
        } else {
            bookmarksStore.setSyncStorage({ bookmarkColors: colorsObj });
        }

        emitter.emit(EMITS.BOOKMARKS_UPDATED, { type: 'color', id: props.bookmark.id });
    }

    const { open: openBookmark } = useOpenBookmark();

    function onOpenBookmark(event: MouseEvent): void {
        openBookmark(props.bookmark, event);
    }

    async function updateColor(): Promise<void> {
        const getColorResponse = await bookmarksStore.getSyncStorage('bookmarkColors');

        if (getColorResponse) {
            color.value = (getColorResponse as Record<string, string>)[props.bookmark.id];
        }
    }

    onMounted(() => {
        updateColor();
    });
</script>

<style scoped lang="scss">
    .popup-item {
        display: flex;
        width: 100%;
        height: 100%;
        position: relative;
    }

    .popup-handle {
        display: flex;
        width: 100%;
        height: 100%;
    }

    .group-grid-link {
        display: flex;
        width: 100%;
        height: 100%;
        text-decoration: none;
        cursor: pointer;

        &:active :deep(.bookmark-image-container) {
            transform: perspective(400px) rotateY(-15deg) scale(.98);
            box-shadow: 0 0 25px 0 rgba(0, 0, 0, 0.15);
            transform-origin: center right;
        }
    }

    .bookmark-edit {
        visibility: hidden;
        position: absolute;
        right: 3px;
        top: 3px;
        opacity: .5;
        z-index: 10;
    }

    :deep(.v-btn--icon.v-btn--density-default) {
        width: 28px;
        height: 28px;
    }

    // Give the dot-menu activator a dark surface so the white dots
    // stay legible against light bookmark icons inside the popup.
    :deep(.button) {
        background-color: rgba(var(--darkmode-rgb-100), 0.6);
    }

    .popup-item {
        &:hover,
        &.foldout-open {
            z-index: 1;

            .bookmark-edit {
                visibility: visible;
            }

            // Keep the icon hover effect active even when the cursor
            // is over the edit button (which sits outside .group-grid-link).
            .group-grid-link :deep(.bookmark-image-container) {
                transform: perspective(400px) rotateY(25deg) scale(1.02);
                box-shadow: 0 0 25px 0 rgba(0, 0, 0, 0.15);
            }
        }

        &.drag-active {
            .bookmark-edit {
                visibility: hidden;
            }

            .group-grid-link {
                &:hover :deep(.bookmark-image-container),
                &:active :deep(.bookmark-image-container) {
                    transform: none;
                    box-shadow: none;
                }
            }

            &:hover .group-grid-link :deep(.bookmark-image-container) {
                transform: none;
                box-shadow: none;
            }
        }
    }

    :deep(.bookmark-image-container) {
        height: 100%;
        width: 100%;
        padding: 8%;
    }
</style>
