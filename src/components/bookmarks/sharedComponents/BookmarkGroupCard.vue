<template>
    <span class="bookmark relative inline-block"
        :class="[
            effectiveSize,
            {
                'foldout-open': isFoldoutOpen,
                popup: props.popup,
                'drag-active': bookmarksStore.dragStart,
            },
        ]">
        <span class="handle">
            <button
                v-if="!props.popup"
                class="group-body group-link"
                type="button"
                :aria-label="groupAriaLabel"
                @click="onOpenGroup($event)">
                <span
                    class="group-grid"
                    :class="{ dark: bookmarksStore.enableDarkMode }">
                    <span
                        v-for="item in previewItems"
                        :key="item.id"
                        class="group-grid-item">
                        <BookmarkGroupPopupItem
                            :bookmark="item"
                            :image="imageMap[item.id] ?? null"
                            :ready="ready"
                            :expanded="false" />
                    </span>
                </span>
            </button>
            <span
                v-else
                ref="popupGridRef"
                class="group-body group-link"
                :aria-label="groupAriaLabel">
                <v-btn
                    class="popup-close"
                    :class="{ dark: bookmarksStore.enableDarkMode, expanded: props.expanded }"
                    :icon="mdiClose"
                    density="comfortable"
                    aria-label="Close group popup"
                    @click.stop="onClosePopup()" />
                <draggable
                    class="group-grid"
                    :class="{ dark: bookmarksStore.enableDarkMode, dragging: popupDragging, open: props.expanded }"
                    :animation="200"
                    :disabled="!props.expanded"
                    :fallbackTolerance="10"
                    :force-fallback="true"
                    :ghost-class="'ghost'"
                    :group="popupDragGroup"
                    :handle="'.popup-handle'"
                    :item-key="'id'"
                    :list="popupRenderItems"
                    :tag="'div'"
                    @end="onPopupDragEnd($event)"
                    @start="onPopupDragStart($event)"
                    @update="onPopupDragUpdate($event)">
                    <template #item="{ element }">
                        <div class="group-grid-item">
                            <BookmarkGroupPopupItem
                                :bookmark="element"
                                :image="imageMap[element.id] ?? element.image ?? null"
                                :ready="ready"
                                :expanded="props.expanded" />
                        </div>
                    </template>
                </draggable>
            </span>
        </span>
        <div class="bookmark-edit">
            <BookmarkFoldout
                :darkModeBorder="true"
                :list="list"
                :size="'x-small'"
                @toggle="onToggle($event)"
                @rename="showRenameDialog = true"
                @delete="onUngroup()" />
        </div>
        <span
            class="bookmark-title-container"
            :class="{ 'popup-title': props.popup, expanded: props.popup && props.expanded }">{{ displayTitle }}</span>
        <Teleport to="body"
            v-if="!props.popup && showRenameDialog">
            <v-row justify="center">
                <v-dialog
                    v-model="showRenameDialog"
                    persistent
                    width="450">
                    <BookmarkGroupRename
                        :value="bookmark.title"
                        @confirm="onRenameConfirm($event)"
                        @cancel="showRenameDialog = false" />
                </v-dialog>
            </v-row>
        </Teleport>
    </span>
</template>

<script setup lang="ts">
    import { mdiClose, mdiRename, mdiUngroup } from '@mdi/js';
    import {
        computed, onMounted, onUnmounted, ref, useTemplateRef, watch,
    } from 'vue';
    import { EMITS, GROUPING } from '@/constants';
    import type { BookmarkNode, DragEventInfo, FoldoutListItem } from '@/types/bookmark';
    import { useBookmarksStore } from '@stores/bookmarks';
    import BookmarkFoldout from '@/components/fields/BookmarkFoldout.vue';
    import BookmarkGroupRename from '@/components/forms/BookmarkGroupRename.vue';
    import BookmarkGroupPopupItem from '@/components/bookmarks/sharedComponents/BookmarkGroupPopupItem.vue';
    import draggable from 'vuedraggable';
    import emitter from '@cmp/eventBus';
    import { useDragCursor } from '@cmp/useDragCursor';
    import { getGroupPreviewItems } from '@utils/bookmarkGroups';

    interface Props {
        bookmark: BookmarkNode;
        popup?: boolean;
        // Drives the popup layout between collapsed and expanded states.
        // This keeps the group animation in sync with its wrapper.
        expanded?: boolean;
    }

    interface GroupOpenPayload {
        groupId: string;
        rect?: DOMRect;
    }

    interface DragOutOfGroupPayload {
        bookmarkId: string;
        groupId: string;
        groupParentId: string;
    }

    const EMPTY_BOOKMARKS: BookmarkNode[] = [];

    const props = withDefaults(defineProps<Props>(), { expanded: true });

    const emits = defineEmits<{
        open: [payload: GroupOpenPayload];
        close: [];
        dragOutOfGroup: [payload: DragOutOfGroupPayload];
        dragStart: [];
        popupDragEnd: [];
    }>();

    const bookmarksStore = useBookmarksStore();

    const isFoldoutOpen = ref(false);
    const effectiveSize = computed(() => `icon-${bookmarksStore.iconSize}`);

    const list = ref<FoldoutListItem[]>([
        {
            title: 'Rename Group',
            icon: mdiRename,
            event: EMITS.RENAME,
        },
        {
            title: 'Ungroup',
            icon: mdiUngroup,
            event: EMITS.DELETE,
        },
    ]);

    const showRenameDialog = ref(false);

    const displayTitle = computed(() => {
        const t = (props.bookmark.title ?? '').trim();
        return t.length ? t : GROUPING.DEFAULT_NAME;
    });

    async function onRenameConfirm(name: string): Promise<void> {
        showRenameDialog.value = false;
        await bookmarksStore.renameBookmarkGroup(props.bookmark.id, name);
        // The new title is picked up via the chrome.bookmarks.onChanged
        // listener, which refreshes the in-memory tree.
    }

    const previewItems = computed(() => getGroupPreviewItems(props.bookmark));

    // Bind directly to the bookmark children array so draggable updates stay reactive.
    // This mirrors the outer BookmarksGroup list binding.
    const popupRenderItems = computed(() => props.bookmark.children ?? EMPTY_BOOKMARKS);

    const popupDragGroup = { name: 'popup-bookmarks', pull: true, put: true };
    const draggedPopupBookmarkId = ref<string | null>(null);
    const popupDragging = ref(false);
    const popupGridRef = useTemplateRef<HTMLElement>('popupGridRef');

    const dragCursor = useDragCursor();
    const popupDragEndTimeoutId = ref<number | null>(null);
    const popupDragEndDelayMs = 220;

    const imageMap = ref<Record<string, string>>({});
    const ready = ref(!!props.popup);

    const groupAriaLabel = computed(() => `Open group with ${previewItems.value.length} bookmarks`);

    function onToggle(event: boolean): void {
        isFoldoutOpen.value = event;
    }

    function onOpenGroup(event: MouseEvent): void {
        const target = event.currentTarget as HTMLElement | null;

        emits('open', {
            groupId: props.bookmark.id,
            rect: target?.getBoundingClientRect(),
        });
    }

    function onClosePopup(): void {
        emits('close');
    }

    async function onUngroup(): Promise<void> {
        await bookmarksStore.ungroupBookmarkGroup(props.bookmark.id);
    }

    function onPopupDragStart(event?: Partial<DragEventInfo> & { item?: HTMLElement; from?: HTMLElement }): void {
        const oldIndex = event?.oldIndex;

        draggedPopupBookmarkId.value = oldIndex === undefined
            ? null
            : popupRenderItems.value[oldIndex]?.id ?? null;

        popupDragging.value = true;
        bookmarksStore.dragStart = true;
        dragCursor.start();
        emitter.emit(EMITS.DRAG_START);
        emits(EMITS.DRAG_START);
    }

    function isPointerInsidePopupGrid(clientX: number, clientY: number): boolean {
        const el = popupGridRef.value;

        if (!el) {
            return false;
        }

        const rect = el.getBoundingClientRect();

        return clientX >= rect.left
            && clientX <= rect.right
            && clientY >= rect.top
            && clientY <= rect.bottom;
    }

    async function onPopupDragEnd(event: {
        originalEvent?: { clientX?: number; clientY?: number };
        oldIndex?: number;
        newIndex?: number;
        item?: HTMLElement;
        from?: HTMLElement;
        to?: HTMLElement;
    }): Promise<void> {
        dragCursor.stop();
        bookmarksStore.dragStart = false;

        const draggedId = draggedPopupBookmarkId.value;
        const original = event?.originalEvent;
        const clientX = original?.clientX;
        const clientY = original?.clientY;

        const droppedOutside = clientX !== undefined
            && clientY !== undefined
            && !isPointerInsidePopupGrid(clientX, clientY);

        try {
            if (droppedOutside && draggedId && props.bookmark.parentId) {
                emits(EMITS.DRAG_OUT_OF_GROUP, {
                    bookmarkId: draggedId,
                    groupId: props.bookmark.id,
                    groupParentId: props.bookmark.parentId,
                });
            }
        } finally {
            draggedPopupBookmarkId.value = null;
            emits(EMITS.POPUP_DRAG_END);
            // Keep popupDragging true during the SortableJS animation.
            // This preserves the drag class while items settle into place.
            if (popupDragEndTimeoutId.value !== null) {
                window.clearTimeout(popupDragEndTimeoutId.value);
            }
            popupDragEndTimeoutId.value = window.setTimeout(() => {
                popupDragging.value = false;
                popupDragEndTimeoutId.value = null;
            }, popupDragEndDelayMs);
        }
    }

    async function onPopupDragUpdate(event: DragEventInfo): Promise<void> {
        const bookmark = popupRenderItems.value[event.newIndex];

        if (!bookmark) {
            return;
        }

        const index = event.newIndex > event.oldIndex ? event.newIndex + 1 : event.newIndex;

        await bookmarksStore.reorderBookmark(bookmark.id, index);
    }

    async function loadGroupImages(): Promise<void> {
        const immediateEntries = (props.bookmark.children ?? [])
            .filter((item) => !!item.image)
            .map((item) => [item.id, item.image as string] as const);

        if (immediateEntries.length) {
            imageMap.value = {
                ...imageMap.value,
                ...Object.fromEntries(immediateEntries),
            };
            ready.value = true;
        }

        const imageEntries = await Promise.all(previewItems.value.map(async (item) => {
            const stored = await bookmarksStore.getLocalStorage(item.id);
            const image = (stored as { image?: string } | undefined)?.image;
            if (image) {
                item.image = image;
            }
            return [item.id, image ?? ''] as const;
        }));

        imageMap.value = {
            ...imageMap.value,
            ...Object.fromEntries(imageEntries.filter((entry) => !!entry[1])),
        };
        ready.value = true;
    }

    watch(
        () => (props.bookmark.children ?? []).map((child) => child.id).join('|'),
        () => {
            loadGroupImages();
        },
        { immediate: true },
    );

    function onImagesImportHandler(): void {
        loadGroupImages();
    }

    onMounted(() => {
        emitter.on(EMITS.IMAGES_IMPORT, onImagesImportHandler);
    });

    onUnmounted(() => {
        emitter.off(EMITS.IMAGES_IMPORT, onImagesImportHandler);

        if (popupDragEndTimeoutId.value !== null) {
            window.clearTimeout(popupDragEndTimeoutId.value);
            popupDragEndTimeoutId.value = null;
        }
    });
</script>

<style scoped lang="scss">
    .bookmark {
        display: inline-block;
        margin: 0 0 8px;
        position: relative;

        &.popup {
            display: block;
            height: 100%;
            margin: 0;
            width: 100%;
        }
    }

    // Layout for the group's own open-trigger (button) / popup wrapper
    // (span) — distinct from BookmarkLink's .bookmark-link anchor class.
    .group-body {
        align-items: center;
        color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
        display: flex;
        flex-direction: column;
        margin-top: 34px;
        outline-color: #01a1f6;
        outline-offset: 14px;
        text-decoration: none;
        width: 100%;
    }

    .group-link {
        border: 0;
        background: transparent;
        margin-top: 34px;
        padding: 0;
    }

    // only the closed-card trigger is clickable — the popup's span wrapper
    // isn't, so it shouldn't show a pointer cursor.
    button.group-link {
        cursor: pointer;
    }

    .group-grid {
        width: 100%;
        aspect-ratio: 1;
        // guards the 1:1 shape if row content (icon + collapsing title)
        // ever slightly outgrows the aspect-ratio-derived height.
        overflow: hidden;
        border-radius: 11.11%;
        background-color: var(--blue-lighter);
        box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.15);
        transform-origin: center right;
        // Use flex wrap so the preview and popup share one layout engine.
        // This keeps padding and gap transitions smooth.
        display: flex;
        flex-wrap: wrap;
        align-content: flex-start;
        justify-content: flex-start;
        gap: 3%;
        padding: 8.89%;
        transition: transform 0.05s, box-shadow 0.05s,
            padding 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
            gap 0.28s cubic-bezier(0.2, 0.85, 0.2, 1);

        &.dark {
            background-color: var(--darkmode-200);
            box-shadow: none;
        }
    }

    .group-grid-item {
        // 3 columns with 3% gap on a 100% wide row:
        // 3w + 2 * 3% = 100% → w = (100% - 6%) / 3
        width: calc((100% - 6%) / 3);
        // Let the height follow the icon/title content instead of forcing a square.
        // The title stays visible, so a fixed square can clip when the card expands.
        aspect-ratio: auto;
        display: flex;
        align-items: stretch;
        justify-content: stretch;
        transition: width 0.28s cubic-bezier(0.2, 0.85, 0.2, 1);
    }

    .bookmark.icon-small {
        width: 56px;

        .group-grid {
            // Small icons need a higher padding percentage to match larger icons.
            // This keeps their visual spacing comparable on a 56px grid.
            padding: 11%;
            border-radius: 5.36%;
            gap: 5%;
        }

        // gap above is 5%, not the 3% the base width formula assumes.
        .group-grid-item {
            width: calc((100% - 10%) / 3);
        }
    }

    .bookmark.icon-medium {
        width: 82px;

        .group-grid {
            padding: 7.32%;
        }
    }

    .bookmark.icon-large {
        width: 108px;

        .group-grid {
            padding: 7.41%;
            border-radius: 12.96%;
        }
    }

    .bookmark-title-container {
        display: inline-block;
        margin: 15px 0 0;
        max-width: 100%;
        overflow: hidden;
        padding-bottom: 0;
        text-align: center;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
        color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
    }

    .bookmark.icon-small .bookmark-title-container {
        font-size: 10px;
    }

    .bookmark.icon-medium .bookmark-title-container {
        font-size: 11px;
    }

    .bookmark.icon-large .bookmark-title-container {
        font-size: 12px;
    }

    .bookmark-edit {
        visibility: hidden;
        position: absolute;
        right: 0;
        top: 0;
        opacity: .5;
    }

    .bookmark.popup {
        width: 100%;
        max-width: none;

        --popup-close-size: 32px;

        .handle {
            display: block;
            height: 100%;
            width: 100%;
            position: relative;
            overflow: visible;
        }

        // Only hide the outer group card's foldout (Ungroup) in popup mode.
        // Inner item foldouts live inside BookmarkGroupPopupItem and are scoped there.
        > .bookmark-edit {
            display: none;
        }

        .group-link {
            display: block;
            height: 100%;
            margin-top: 0;
            width: 100%;
        }

        .popup-close.v-btn {
            // Matches .group-grid's background so the button reads as part of the card.
            background-color: color-mix(in srgb, var(--blue-lighter) 95%, transparent);
            box-shadow: none;
            position: absolute;
            right: calc(var(--popup-close-size) * -0.25);
            top: calc(var(--popup-close-size) * -0.25);
            height: var(--popup-close-size);
            width: var(--popup-close-size);
            z-index: 6;
            opacity: 0;
            pointer-events: none;
            // Close fades out faster than the 0.28s popup scale so it clears before the shrink finishes.
            transition: transform 0.14s ease, opacity 0.15s ease;

            &.expanded {
                opacity: 1;
                pointer-events: auto;
                // Fades in alongside the popup's own 0.28s scale-up, after a short delay.
                transition: transform 0.14s ease, opacity 0.22s ease 0.06s;
            }

            &.dark {
                background-color: color-mix(in srgb, var(--darkmode-200) 95%, transparent);
            }

            :deep(.v-icon) {
                color: rgba(var(--v-theme-on-surface), 1);
            }

            // Disable Vuetify's default hover/focus overlay darkening.
            :deep(.v-btn__overlay) {
                opacity: 0 !important;
            }

            &:active {
                transform: scale(0.96);
            }
        }

        .group-grid {
            height: 100%;
            border-radius: var(--popup-group-radius, 14%);
            box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
            background-color: color-mix(in srgb, var(--blue-lighter) 95%, transparent);
            transition: border-radius 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
                padding 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
                gap 0.28s cubic-bezier(0.2, 0.85, 0.2, 1);

            &.dark {
                background-color: color-mix(in srgb, var(--darkmode-200) 95%, transparent);
            }

            // .open switches padding and gap to the full popup layout.
            // This keeps the card animation smooth instead of snapping to final values.
            &.open {
                // The card stays fixed-size, so its rows need compact vertical spacing.
                // Larger horizontal padding keeps the icons and titles fitting without growth.
                padding: 5% 14% 2%;
                gap: 2% 6%;
            }

            &.dragging {
                .group-grid-link {
                    &:hover :deep(.bookmark-image-container),
                    &:active :deep(.bookmark-image-container) {
                        transform: none;
                        box-shadow: none;
                    }
                }
            }
        }

        .group-grid.open .group-grid-item {
            // 3 columns with 6% gap on a 100% wide row:
            // 3w + 2 * 6% = 100% → w = (100% - 12%) / 3
            width: calc((100% - 12%) / 3);
        }

        // The card fills its wrapper, so the label sits just below it
        // instead of being hidden like the non-popup preview title.
        // Starts matching the minified label's size/position exactly so
        // swapping to the popup instance doesn't jump, then grows on expand.
        > .bookmark-title-container.popup-title {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 15px;
            color: rgba(255, 255, 255, 0.92);
            text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
            z-index: 5;
            transition: margin-top 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
                font-size 0.28s cubic-bezier(0.2, 0.85, 0.2, 1);

            &.expanded {
                margin-top: 12px;
                font-size: 13px;
            }
        }

        &.icon-small,
        &.icon-medium,
        &.icon-large {
            width: 100%;
            max-width: none;
        }
    }

    .bookmark {
        &:not(.popup):not(.drag-active):hover .group-link .group-grid {
            transform: perspective(400px) rotateY(25deg) scale(1.02);
            box-shadow: 0 0 25px 0 rgba(0, 0, 0, 0.15);
        }

        &:not(.popup):not(.drag-active) .group-link:active .group-grid {
            transform: perspective(400px) rotateY(-15deg) scale(.98);
            box-shadow: 0 0 25px 0 rgba(0, 0, 0, 0.15);
            transform-origin: center right;
        }

        &:hover,
        &.foldout-open {
            z-index: 1;

            .bookmark-edit {
                visibility: visible;
            }
        }
    }
</style>
