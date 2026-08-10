<template>
    <span class="bookmark relative inline-block"
        :class="[attrs.class, { 'foldout-open': isFoldoutOpen, 'drag-active': bookmarksStore.dragStart, expanded }]">
        <span class="handle">
            <a
                v-bind="props"
                class="bookmark-link"
                :draggable="draggable"
                title=""
                :aria-label="bookmark.title"
                :class="[bookmark.url ? '' : 'folder', effectiveSize, hideEdit ? 'hide-edit' : '']"
                :href="bookmark.url"
                :id="bookmark.id"
                :tabindex="tabIndex"
                @keyup.enter="onClick($event)"
                @click="onClick($event)">
                <BookmarkIcon
                    :color="color ?? undefined"
                    :folder="!bookmark.url"
                    :allowFallbackIcon="iconResolved"
                    :image="image" />
                <span class="bookmark-title-container"
                    v-if="((hideEdit && !image) || !hideEdit)">{{ bookmark.title }}</span>
            </a>
        </span>
        <template v-if="!hideEdit && expanded">
            <BookmarkTooltip :text="bookmark.title" />
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
        </template>
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
                        :title="props.bookmark.title"
                        :id="bookmark.id"
                        :typeFolder="!bookmark.url"
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
    import {
        ref, onMounted, onUnmounted, toRef, computed, useAttrs, type Ref,
    } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { EMITS } from '@/constants';
    import emitter from '@cmp/eventBus';
    import type { BookmarkNode, FoldoutListItem } from '@/types/bookmark';
    import BookmarkConfirmDelete
        from '@/components/forms/BookmarkConfirmDelete.vue';
    import BookmarkIcon from '@/components/bookmarks/sharedComponents/BookmarkIcon.vue';
    import BookmarkFoldout
        from '@/components/fields/BookmarkFoldout.vue';
    import BookmarkColorEdit
        from '@/components/forms/BookmarkColorEdit.vue';
    import BookmarkTooltip from '@/components/bookmarks/sharedComponents/BookmarkTooltip.vue';
    import { useBookmarkOps } from '@cmp/useBookmarkOps';
    import { useOpenBookmark } from '@cmp/useOpenBookmark';

    // The template has multiple root nodes, so attrs must be applied manually.
    defineOptions({ inheritAttrs: false });

    const utils = useBookmarkOps();

    interface Props {
        tabIndex?: string;
        bookmark: BookmarkNode;
        size?: string;
        hideEdit?: boolean;
        draggable?: boolean;
        // The collapsed preview renders the same markup without tooltip/edit UI.
        // That keeps hover states from appearing while minified.
        expanded?: boolean;
    }

    const props = withDefaults(defineProps<Props>(), {
        tabIndex: '-1',
        size: '',
        draggable: true,
        expanded: true,
    });

    const attrs = useAttrs();

    const isFoldoutOpen = ref(false);
    const image = toRef(props.bookmark, 'image') as Ref<string | null | undefined>;

    if (attrs.image) {
        image.value = attrs.image as string;
    }

    const iconResolved = ref(false);
    const list = ref<FoldoutListItem[]>([
        {
            title: 'Delete',
            icon: mdiDeleteOutline,
            event: EMITS.DELETE,
        },
    ]);

    const emits = defineEmits([
        EMITS.UPDATE,
    ]);

    const bookmarksStore = useBookmarksStore();

    const effectiveSize = computed(() => props.size || (`icon-${bookmarksStore.iconSize}`));

    async function updateImage() {
        const getImageResponse = await bookmarksStore.getLocalStorage(props.bookmark.id);

        image.value = (getImageResponse as { image?: string } | null)?.image ?? null;

        iconResolved.value = true;

        emits(EMITS.UPDATE);
    }

    const { open: openBookmark } = useOpenBookmark();

    function onClick(event: MouseEvent | KeyboardEvent): void {
        if ((event as PointerEvent).pointerId < 0) {
            event.preventDefault();
            return;
        }

        openBookmark(props.bookmark, event);
    }

    const color = toRef(props.bookmark, 'color') as Ref<string | null | undefined>;

    async function updateColor() {
        const getColorResponse = await bookmarksStore.getSyncStorage('bookmarkColors');

        if (getColorResponse) {
            color.value = (getColorResponse as Record<string, string>)[props.bookmark.id];
        }
    }

    const showConfirmDelete = ref(false);

    function onDelete() {
        showConfirmDelete.value = true;
    }

    function onDeleteConfirm(_event?: unknown): void {
        showConfirmDelete.value = false;

        if (props.bookmark.url) {
            bookmarksStore.removeBookmark(props.bookmark.id);
        } else {
            bookmarksStore.removeBookmarkFolder(props.bookmark.id);
        }
    }

    function onToggle(event: boolean): void {
        isFoldoutOpen.value = event;
    }

    function onImagesImportHandler(): void {
        updateImage();
        updateColor();
    }

    function onIconUpdateHandler(id: string): void {
        if (id === props.bookmark.id) {
            updateImage();
        }
    }

    const selectedColor = ref();

    const showColorEdit = ref(false);

    async function onColorConfirm(event: string | null): Promise<void> {
        selectedColor.value = event;

        showColorEdit.value = false;

        const getColorsResponse = await bookmarksStore.getSyncStorage('bookmarkColors');
        const colorsObj = (getColorsResponse || {}) as Record<string, string>;

        const bookmark = utils.getStoredBookmarkById(props.bookmark.id);

        if (event) {
            colorsObj[props.bookmark.id] = selectedColor.value;
            if (bookmark) { bookmark.color = selectedColor.value; }
            color.value = selectedColor.value;
        } else if (colorsObj[props.bookmark.id]) {
            delete colorsObj[props.bookmark.id];
            if (bookmark) { bookmark.color = ''; }
            color.value = null;
        }

        if (!Object.keys(colorsObj).length) {
            bookmarksStore.deleteSyncStorageItem('bookmarkColors');
        } else {
            bookmarksStore.setSyncStorage({ bookmarkColors: colorsObj });
        }

        emitter.emit(EMITS.BOOKMARKS_UPDATED, { type: 'color', id: props.bookmark.id });
    }

    onUnmounted(() => {
        emitter.off(EMITS.IMAGES_IMPORT, onImagesImportHandler);
        emitter.off(EMITS.ICON_UPDATE, onIconUpdateHandler);
    });

    onMounted(() => {
        emitter.on(EMITS.IMAGES_IMPORT, onImagesImportHandler);
        emitter.on(EMITS.ICON_UPDATE, onIconUpdateHandler);

        if (props.bookmark.url) {
            const colorItem = {
                title: 'Color',
                icon: mdiFormatColorFill,
                event: EMITS.OPEN_COLOR_EDITOR,
            };

            const editItem = {
                title: 'Edit',
                icon: mdiRename,
                event: EMITS.EDIT,
            };

            list.value.unshift(colorItem);
            list.value.unshift(editItem);
        }

        updateImage();
    });

</script>
<style scoped lang="scss">

    .bookmark {
        display: inline-block;
        margin: 0 0 8px;
        position: relative;
    }

    .foldout {
        margin-right: 4px;
    }

    .bookmark-link {
        align-items: center;
        color: rgba(var(--v-theme-on-surface),var(--v-high-emphasis-opacity));
        display: flex;
        flex-direction: column;
        margin-top: 34px;
        outline-color: #01a1f6;
        outline-offset: 14px;
        text-decoration: none;
        width: 90px;

        &.hide-edit {
            margin-top: 4px;

            .bookmark-title-container {
                margin-top: 4px;
            }
        }

        &.icon-small {
            width: 56px;

            .bookmark-image-container {
                width: 100%;
                padding: 7.14%;
                border-radius: 12.5%;
                font-size: 34px;
            }

            :deep(.bookmark-image) {
                border-radius: 8.93%;
            }

            .bookmark-title-container {
                font-size: 10px;
            }
        }

        &.icon-medium {
            width: 82px;

            .bookmark-image-container {
                width: 100%;
                padding: 7.32%;
            }

            .bookmark-title-container {
                font-size: 11px;
            }
        }

        &.icon-large {
            width: 108px;

            .bookmark-image-container {
                width: 100%;
                padding: 7.41%;
                border-radius: 12.96%;
                font-size: 66px;
            }

            :deep(.bookmark-image) {
                border-radius: 9.26%;
            }

            .bookmark-title-container {
                font-size: 12px;
            }
        }

        &.smaller {
            width: 58px;

            .bookmark-image-container {
                border-radius: 12%;
                padding: 8%;
                width: 100%;

                :deep(svg) {
                    width: 32px
                }
            }

            .bookmark-title-container {
                font-size: 10px;
            }
        }
    }

    .bookmark-image-container {
        transform-origin: center right;
    }

    :deep(.v-btn--icon.v-btn--density-default) {
        width: 28px;
        height: 28px;
    }

    .bookmark-title-container {
        display: inline-block;
        margin: 15px 0 0;
        max-width: 100%;
        overflow: hidden;
        padding-bottom: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    // In the popup grid, the icon fills its cell rather than the accordion width.
    // Width needs to be set explicitly so the percentage resolves all the way down.
    .bookmark.popup {
        width: 100%;
        // The stacked bottom margin overflows the fixed-square grid.
        // Collapse it while minified and restore it as the popup opens.
        margin-bottom: 0;
        transition: margin-bottom 0.28s cubic-bezier(0.2, 0.85, 0.2, 1);

        &.expanded {
            margin-bottom: 8px;
        }

        .bookmark-link {
            margin-top: 0;
            width: 100%;

            .bookmark-title-container {
                // Start collapsed to match the preview look.
                // Line-height 0 ensures the row truly takes no space.
                margin-top: 0;
                opacity: 0;
                font-size: 0;
                line-height: 0;
                // Let title spacing grow with the grid resize.
                // This prevents overflow while the popup is still opening.
                transition: font-size 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
                    line-height 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
                    margin-top 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
                    opacity 0.28s cubic-bezier(0.2, 0.85, 0.2, 1);
            }
        }

        &.expanded .bookmark-link .bookmark-title-container {
            margin-top: 10px;
            font-size: 12px;
            line-height: 1.2;
            opacity: 1;
            // Wait for the popup grow animation before revealing text.
            // Only opacity is delayed; size changes are immediate.
            transition: font-size 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
                line-height 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
                margin-top 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
                opacity 0.28s cubic-bezier(0.2, 0.85, 0.2, 1) 0.28s;
        }

        // smaller than the base tooltip so it fits the tighter popup cells.
        .tooltip {
            font-size: 15px;
            padding: 2px 12px;
        }
    }

    .bookmark-edit {
        visibility: hidden;
        position: absolute;
        right: 0;
        top: 0;
        opacity: .5;
    }

    .bookmark {
        &:not(.popup):hover,
        &.foldout-open {
            z-index: 1;

            .tooltip {
                opacity: 1;
                transition: opacity 0s;
                transition-delay: 400ms;
            }

            .bookmark-edit {
                visibility: visible;
            }
        }
    }

    .bookmark:not(.drag-active):not(.popup):hover > .handle > .bookmark-link:not(.folder) .bookmark-image-container {
        transform: perspective(400px) rotateY(25deg) scale(1.02);
        box-shadow: 0 0 25px 0px rgba(0, 0, 0, 0.15);
    }

    .bookmark:not(.drag-active):not(.popup) > .handle > .bookmark-link:active:not(.folder) .bookmark-image-container {
        transform: perspective(400px) rotateY(-15deg) scale(.98);
        box-shadow: 0 0 25px 0px rgba(0, 0, 0, 0.15);
        transform-origin: center right;
    }

    .bookmark.dragging .bookmark-link .bookmark-image-container {
        transform: none;
        box-shadow: 0px 0 20px 0px rgba(0, 0, 0, 0.15);
    }
    .bookmark-link:active .bookmark-image-overlay {
        opacity: 1;
    }

</style>
