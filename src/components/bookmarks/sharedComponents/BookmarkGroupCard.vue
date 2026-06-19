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
                class="bookmark-link group-link"
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
                        <BookmarkIcon
                            :color="item.color ?? undefined"
                            :folder="false"
                            :hide="!ready"
                            :image="imageMap[item.id] ?? null" />
                    </span>
                </span>
            </button>
            <span
                v-else
                ref="popupGridRef"
                class="bookmark-link group-link"
                :aria-label="groupAriaLabel">
                <draggable
                    class="group-grid"
                    :class="{ dark: bookmarksStore.enableDarkMode, dragging: popupDragging }"
                    :animation="200"
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
                                :image="imageMap[element.id] ?? null"
                                :ready="ready" />
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
                @delete="onUngroup()" />
        </div>
    </span>
</template>

<script setup lang="ts">
    import { mdiUngroup } from '@mdi/js';
    import {
        computed, ref, useTemplateRef, watch,
    } from 'vue';
    import { EMITS } from '@/constants';
    import type { BookmarkNode, DragEventInfo, FoldoutListItem } from '@/types/bookmark';
    import { useBookmarksStore } from '@stores/bookmarks';
    import BookmarkFoldout from '@/components/fields/BookmarkFoldout.vue';
    import BookmarkIcon from '@/components/bookmarks/sharedComponents/BookmarkIcon.vue';
    import BookmarkGroupPopupItem from '@/components/bookmarks/sharedComponents/BookmarkGroupPopupItem.vue';
    import draggable from 'vuedraggable';
    import emitter from '@cmp/eventBus';
    import { getGroupPreviewItems } from '@utils/bookmarkGroups';

    interface Props {
        bookmark: BookmarkNode;
        popup?: boolean;
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

    const props = defineProps<Props>();

    const emits = defineEmits<{
        open: [payload: GroupOpenPayload];
        dragOutOfGroup: [payload: DragOutOfGroupPayload];
        dragStart: [];
        popupDragEnd: [];
    }>();

    const bookmarksStore = useBookmarksStore();

    const isFoldoutOpen = ref(false);
    const effectiveSize = computed(() => `icon-${bookmarksStore.iconSize}`);

    const list = ref<FoldoutListItem[]>([
        {
            title: 'Ungroup',
            icon: mdiUngroup,
            event: EMITS.DELETE,
        },
    ]);

    const previewItems = computed(() => getGroupPreviewItems(props.bookmark));

    // Bind directly to props.bookmark.children, mirroring how the outer
    // BookmarksGroup binds :list="renderItems" where
    // renderItems = computed(() => props.bookmarks ?? []).
    // vuedraggable needs the same array reference between renders so its
    // in-place mutations propagate via Vue reactivity.
    const popupRenderItems = computed(() => props.bookmark.children ?? []);

    const popupDragGroup = { name: 'popup-bookmarks', pull: true, put: true };
    const draggedPopupBookmarkId = ref<string | null>(null);
    const popupDragging = ref(false);
    const popupGridRef = useTemplateRef<HTMLElement>('popupGridRef');

    const imageMap = ref<Record<string, string>>({});
    const ready = ref(false);

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
        document.body.classList.add('cursor-pointer');
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
        document.body.classList.remove('cursor-pointer');
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
            emits('popupDragEnd');
            // keep popupDragging true through the SortableJS animation so
            // the .dragging class continues suppressing hover transforms while
            // items slide into their new positions
            window.setTimeout(() => {
                popupDragging.value = false;
            }, 220);
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
        const imageEntries = await Promise.all(previewItems.value.map(async (item) => {
            const stored = await bookmarksStore.getLocalStorage(item.id);
            const image = (stored as { image?: string } | undefined)?.image;
            return [item.id, image ?? ''] as const;
        }));

        imageMap.value = Object.fromEntries(imageEntries.filter((entry) => !!entry[1]));
        ready.value = true;
    }

    watch(
        () => (props.bookmark.children ?? []).map((child) => child.id).join('|'),
        () => {
            loadGroupImages();
        },
        { immediate: true },
    );
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

    .bookmark-link {
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
        cursor: pointer;
        margin-top: 34px;
        padding: 0;
    }

    .group-grid {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 11.11%;
        background-color: var(--blue-lighter);
        box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.15);
        transform-origin: center right;
        transition: transform 0.05s, box-shadow 0.05s;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-template-rows: repeat(3, minmax(0, 1fr));
        gap: 3%;
        padding: 8.89%;

        &.dark {
            background-color: var(--darkmode-200);
            box-shadow: none;
        }
    }

    .group-grid-item {
        width: 100%;
        aspect-ratio: 1;
        display: flex;
        align-items: stretch;
        justify-content: stretch;

        .group-grid-link {
            display: flex;
            width: 100%;
            height: 100%;
            text-decoration: none;
        }

        :deep(.bookmark-image-container) {
            height: 100%;
            width: 100%;
            padding: 7%;
            border-radius: 17%;
        }
    }

    .bookmark.icon-small {
        width: 56px;

        .group-grid {
            // small icons need a higher percentage to produce a
            // visually comparable absolute padding to medium/large
            // (~6 px on a 56 px grid).
            padding: 11%;
            border-radius: 5.36%;
            gap: 5%;
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

        .handle {
            display: block;
            height: 100%;
            width: 100%;
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

        .group-grid {
            height: 100%;
            border-radius: var(--popup-group-radius, 14%);
            box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
            background-color: color-mix(in srgb, var(--blue-lighter) 85%, transparent);
            transition: border-radius 0.28s cubic-bezier(0.2, 0.85, 0.2, 1);

            &.dark {
                background-color: color-mix(in srgb, var(--darkmode-200) 85%, transparent);
            }
            // popup padding is pinned here so it is consistent across all
            // icon sizes — the per-size .bookmark.icon-* rules would
            // otherwise produce too little padding for small icons.
            padding: 7%;
            gap: 3%;
            // override the base grid layout with flex+wrap so SortableJS
            // can detect swaps inside the popup. CSS Grid leaves empty
            // cells when an item is removed mid-drag, which prevents
            // SortableJS from registering a sort change.
            display: flex;
            flex-wrap: wrap;
            align-content: flex-start;
            justify-content: flex-start;

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

        .group-grid-item {
            // 3 columns with 3% gap on a 100% wide row:
            // 3w + 2 * 3% = 100% → w = (100% - 6%) / 3
            width: calc((100% - 6%) / 3);

            :deep(.bookmark-image-container) {
                padding: 8%;
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
