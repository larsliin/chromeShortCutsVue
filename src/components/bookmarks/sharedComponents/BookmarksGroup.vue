<template>
    <div class="folder">
        <div class="folder-inner" v-if="bookmarks">
            <draggable
                :animation="200"
                :class="{ dragging }"
                :fallbackTolerance="10"
                :force-fallback="true"
                :ghost-class="'ghost'"
                :group="'bookmarks'"
                :handle="'.handle'"
                :item-key="'id'"
                :list="renderItems"
                :move="onDragMove"
                :sort="!bookmarksStore.groupMode"
                :scroll-sensitivity="100"
                :tag="'ul'"
                @add="onDragAdd($event)"
                @end="onDragEnd()"
                @start="onDragStart($event)"
                @update="onDragUpdate($event)">
                <template #item="{ element }">
                    <li
                        :data-bookmark-id="element.id"
                        :class="[getDragTargetClass(element), { 'popup-origin-hidden': shouldHidePopupOrigin(element) }]">
                        <BookmarkLink
                            v-if="isRegularBookmark(element)"
                            :bookmark="element"
                            :key="element.id" />
                        <BookmarkGroupCard
                            v-else
                            :bookmark="element"
                            :key="element.id"
                            @open="onOpenGroup($event)" />
                    </li>
                </template>
            </draggable>
            <div class="folder-empty"
                v-if="!renderItems.length">
                <v-btn
                    variant="tonal"
                    color="red"
                    @click="onDelete()">
                    Delete
                </v-btn>
            </div>
        </div>
    </div>
    <Teleport to="body"
        v-if="showConfirmDelete">
        <template>
            <v-row justify="center">
                <v-dialog
                    v-model="showConfirmDelete"
                    persistent
                    width="450">
                    <BookmarkConfirmDelete
                        typeFolder
                        :title="folder.title"
                        :id="folder.id"
                        @cancel="showConfirmDelete = false"
                        @confirm="onDeleteConfirm($event)" />
                </v-dialog>
            </v-row>
        </template>
    </Teleport>
    <Teleport to="body"
        v-if="showGroupPopup && activeGroup">
        <div
            class="group-popup-overlay"
            :style="popupOverlayStyle"
            role="dialog"
            tabindex="0"
            aria-modal="true"
            @keydown.esc="onOverlayEscape()"
            @mousedown.self="onOverlayClickSelf()">
            <div
                class="group-popup-wrapper"
                :class="popupState"
                :style="popupStyle">
                <BookmarkGroupCard
                    class="group-popup-card"
                    :bookmark="activeGroup"
                    popup
                    @open="closeGroupPopup()"
                    @[EMITS.DRAG_START]="popupDragging = true"
                    @[EMITS.POPUP_DRAG_END]="popupDragging = false"
                    @[EMITS.DRAG_OUT_OF_GROUP]="onPopupDragOutOfGroup($event)" />
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
    import {
        computed, nextTick, onUnmounted, ref,
    } from 'vue';
    import { useDragCursor } from '@cmp/useDragCursor';
    import type { BookmarkNode, DragEventInfo } from '@/types/bookmark';
    import { GROUPING, EMITS } from '@/constants';
    import BookmarkLink from '@/components/bookmarks/sharedComponents/BookmarkLink.vue';
    import BookmarkGroupCard from '@/components/bookmarks/sharedComponents/BookmarkGroupCard.vue';
    import draggable from 'vuedraggable';
    import { useBookmarksStore } from '@stores/bookmarks';
    import emitter from '@cmp/eventBus';

    import { useBookmarkOps } from '@cmp/useBookmarkOps';
    import BookmarkConfirmDelete
        from '@/components/forms/BookmarkConfirmDelete.vue';
    import {
        findNodeById,
        isBookmarkLink,
        isGroupFolder,
    } from '@utils/bookmarkGroups';

    const utils = useBookmarkOps();

    interface Props {
        folder: BookmarkNode;
        bookmarks?: BookmarkNode[];
    }

    const props = withDefaults(defineProps<Props>(), { bookmarks: () => [] });

    const emits = defineEmits([
        EMITS.DELETE,
        EMITS.BEFORE_DELETE,
    ]);

    const dragging = ref(false);
    const popupDragging = ref(false);

    const bookmarksStore = useBookmarksStore();

    const showConfirmDelete = ref(false);
    const showGroupPopup = ref(false);
    const popupState = ref<'opening' | 'open' | 'closing'>('opening');
    const activeGroupId = ref('');
    const draggedBookmarkId = ref<string | null>(null);
    const dropIntent = ref<{ type: 'create' | 'add-to-group'; targetId: string } | null>(null);
    const popupOrigin = ref<{ left: number; top: number; width: number; height: number } | null>(null);
    const popupTargetSize = 360;
    const popupAnimationMs = 280;
    const popupSwallowClickMs = 300;

    const dragCursor = useDragCursor();
    const closePopupTimeoutId = ref<number | null>(null);

    function getInlineGroupRadius(): string {
        if (bookmarksStore.iconSize === 'small') {
            return GROUPING.RADIUS_SMALL;
        }

        if (bookmarksStore.iconSize === 'large') {
            return GROUPING.RADIUS_LARGE;
        }

        return GROUPING.RADIUS_MEDIUM;
    }

    const renderItems = computed(() => props.bookmarks ?? []);
    const activeGroup = computed(() => (
        activeGroupId.value
            ? findNodeById(bookmarksStore.bookmarks ?? [], activeGroupId.value)
            : null
    ));

    const popupStyle = computed(() => {
        const origin = popupOrigin.value;
        const isOpen = popupState.value === 'open';
        const x = isOpen ? '50vw' : `${origin?.left ?? popupTargetSize / 2}px`;
        const y = isOpen ? '50vh' : `${origin?.top ?? popupTargetSize / 2}px`;
        const inlineRadius = getInlineGroupRadius();
        const expandedRadius = '14%';

        return {
            left: x,
            top: y,
            width: isOpen
                ? `min(${popupTargetSize}px, calc(100vw - 32px), calc(100vh - 32px))`
                : `${origin?.width ?? popupTargetSize}px`,
            height: isOpen
                ? `min(${popupTargetSize}px, calc(100vw - 32px), calc(100vh - 32px))`
                : `${origin?.height ?? popupTargetSize}px`,
            opacity: popupState.value === 'open' ? '1' : '0.98',
            '--popup-inline-radius': inlineRadius,
            '--popup-expanded-radius': expandedRadius,
            '--popup-card-radius': isOpen ? expandedRadius : inlineRadius,
            '--popup-group-radius': isOpen ? expandedRadius : inlineRadius,
        } as Record<string, string>;
    });

    const popupOverlayStyle = computed(() => {
        const isOpen = popupState.value === 'open';

        return {
            '--popup-overlay-blur': isOpen ? '8px' : '0px',
            '--popup-overlay-opacity': isOpen ? '0.56' : '0',
        } as Record<string, string>;
    });

    function isRegularBookmark(item: BookmarkNode): boolean {
        return !isGroupFolder(item);
    }

    async function onOpenGroup(payload: { groupId: string; rect?: DOMRect }): Promise<void> {
        popupOrigin.value = payload.rect
            ? {
                left: payload.rect.left + (payload.rect.width / 2),
                top: payload.rect.top + (payload.rect.height / 2),
                width: payload.rect.width,
                height: payload.rect.height,
            }
            : null;

        activeGroupId.value = payload.groupId;
        showGroupPopup.value = true;
        popupState.value = 'opening';

        await nextTick();
        requestAnimationFrame(() => {
            popupState.value = 'open';
        });
    }

    function closeGroupPopup(): void {
        if (!showGroupPopup.value) {
            return;
        }

        popupState.value = 'closing';

        if (closePopupTimeoutId.value !== null) {
            window.clearTimeout(closePopupTimeoutId.value);
        }

        closePopupTimeoutId.value = window.setTimeout(() => {
            showGroupPopup.value = false;
            activeGroupId.value = '';
            popupOrigin.value = null;
            popupState.value = 'opening';
            closePopupTimeoutId.value = null;
        }, popupAnimationMs);
    }

    function resetDropIntent(): void {
        dropIntent.value = null;
    }

    function getDragTargetClass(element: BookmarkNode): string {
        if (dropIntent.value?.targetId !== element.id) {
            return '';
        }

        return dropIntent.value.type === 'create'
            ? 'drag-target-group'
            : 'drag-target-add';
    }

    function shouldHidePopupOrigin(element: BookmarkNode): boolean {
        return isGroupFolder(element)
            && showGroupPopup.value
            && activeGroupId.value === element.id;
    }

    function computeDropIntentFor(draggedId: string, targetId: string): {
        type: 'create' | 'add-to-group';
        targetId: string;
    } | null {
        if (!bookmarksStore.groupMode) {
            return null;
        }

        if (!draggedId || !targetId || draggedId === targetId) {
            return null;
        }

        const dragged = renderItems.value.find((item) => item.id === draggedId);
        const related = renderItems.value.find((item) => item.id === targetId);

        if (!dragged || !related) {
            return null;
        }

        const canCreateGroup = isBookmarkLink(dragged)
            && isBookmarkLink(related)
            && dragged.parentId === props.folder.id
            && related.parentId === props.folder.id
            && !isGroupFolder(props.folder);

        if (canCreateGroup) {
            return { type: 'create', targetId: related.id };
        }

        const canAddToGroup = isBookmarkLink(dragged) && isGroupFolder(related);

        if (canAddToGroup) {
            const groupedNode = findNodeById(bookmarksStore.bookmarks ?? [], related.id);
            const groupedCount = groupedNode?.children?.filter((item) => !!item.url).length ?? 0;

            if (groupedCount >= GROUPING.MAX_ITEMS) {
                return null;
            }

            return { type: 'add-to-group', targetId: related.id };
        }

        return null;
    }

    function onPointerMoveDuringDrag(event: PointerEvent): void {
        const draggedId = draggedBookmarkId.value;

        if (!draggedId) {
            return;
        }

        const stack = document.elementsFromPoint(event.clientX, event.clientY) as HTMLElement[];
        let targetId: string | undefined;

        stack.some((node) => {
            const liEl = node.closest('[data-bookmark-id]') as HTMLElement | null;
            const id = liEl?.dataset.bookmarkId;

            if (id && id !== draggedId) {
                targetId = id;
                return true;
            }

            return false;
        });

        if (!targetId) {
            if (dropIntent.value) {
                resetDropIntent();
            }
            return;
        }

        const next = computeDropIntentFor(draggedId, targetId);
        const current = dropIntent.value;

        if (!next) {
            if (current) {
                resetDropIntent();
            }
            return;
        }

        if (!current || current.targetId !== next.targetId || current.type !== next.type) {
            dropIntent.value = next;
        }
    }

    function onDragMove(evt: {
        draggedContext?: { element?: BookmarkNode };
        relatedContext?: { element?: BookmarkNode };
        related?: HTMLElement;
    }): boolean {
        const dragged = evt.draggedContext?.element;
        const related = evt.relatedContext?.element;
        const relatedEl = evt.related;

        if (!bookmarksStore.groupMode) {
            resetDropIntent();
            return true;
        }

        if (!dragged || !related || !relatedEl) {
            resetDropIntent();
            return true;
        }

        const canCreateGroup = isBookmarkLink(dragged)
            && isBookmarkLink(related)
            && dragged.id !== related.id
            && dragged.parentId === props.folder.id
            && related.parentId === props.folder.id
            && !isGroupFolder(props.folder);

        if (canCreateGroup) {
            dropIntent.value = {
                type: 'create',
                targetId: related.id,
            };

            return false;
        }

        const canAddToGroup = isBookmarkLink(dragged)
            && isGroupFolder(related)
            && dragged.id !== related.id;

        if (canAddToGroup) {
            const groupedNode = findNodeById(bookmarksStore.bookmarks ?? [], related.id);
            const groupedCount = groupedNode?.children?.filter((item) => !!item.url).length ?? 0;

            if (groupedCount >= GROUPING.MAX_ITEMS) {
                resetDropIntent();
                return true;
            }

            dropIntent.value = {
                type: 'add-to-group',
                targetId: related.id,
            };

            return false;
        }

        resetDropIntent();
        return false;
    }

    function onDelete() {
        showConfirmDelete.value = true;
    }

    function onOverlayEscape(): void {
        if (popupDragging.value) {
            return;
        }

        closeGroupPopup();
    }

    function onOverlayClickSelf(): void {
        if (popupDragging.value) {
            return;
        }

        closeGroupPopup();
    }

    async function onPopupDragOutOfGroup(payload: {
        bookmarkId: string;
        groupId: string;
        groupParentId: string;
    }): Promise<void> {
        popupDragging.value = false;

        try {
            const parentSubtree = await bookmarksStore.getBookmarks(payload.groupParentId);
            const parentChildren = (parentSubtree?.[0]?.children ?? []) as BookmarkNode[];
            const targetIndex = parentChildren.length;

            await bookmarksStore.moveBookmark(payload.bookmarkId, {
                parentId: payload.groupParentId,
                index: targetIndex,
            });

            // The Chrome event pipeline (useBookmarkEvents.onRemoved ->
            // collapseEmptyGroups) may have already removed the now-empty
            // group folder by the time we get here, so probe before removing
            // to avoid an unhandled rejection that leaves the popup open.
            const stillExists = await bookmarksStore.getBookmarkByIdOrNull(payload.groupId);
            if (stillExists) {
                const groupSubtree = await bookmarksStore.getBookmarks(payload.groupId);
                const remainingChildren = (groupSubtree?.[0]?.children ?? [])
                    .filter((child) => !!child.url);

                if (remainingChildren.length === 0) {
                    await bookmarksStore.removeBookmarkFolder(payload.groupId);
                }
            }
        } catch (_error) {
            // Swallow — the group/parent may have been mutated by another
            // event handler. We still want to close the popup cleanly.
        } finally {
            closeGroupPopup();
        }
    }

    async function onDeleteConfirm(_event?: unknown): Promise<void> {
        emits(EMITS.BEFORE_DELETE);

        await nextTick();

        // close confirmation dialogue
        showConfirmDelete.value = false;

        // get updated bookmark folder index
        const bookmarkResponse = await bookmarksStore.getBookmarkById(props.folder.id);

        await utils.deleteBookmarkFolder(bookmarkResponse as BookmarkNode);

        emits(EMITS.DELETE, { id: props.folder.id, index: bookmarkResponse.index });
    }

    // when bookmark is moved to a different folder/parentId
    //
    // NOTE: the auto-group branches (canCreateGroup / addToGroup based on
    // adjacent renderItems) were removed because @add fires BEFORE the
    // chrome move resolves — at that point parentId on the dragged
    // bookmark still references the SOURCE folder, so the comparisons
    // could never become true. Group creation / add-to-group is already
    // handled at drag end (onDragEnd) via dropIntent, which carries the
    // real source/target context.
    async function onDragAdd(event: DragEventInfo): Promise<void> {
        if (dropIntent.value || bookmarksStore.groupMode) {
            return;
        }

        const bookmark = renderItems.value?.[event.newIndex];

        if (!bookmark) {
            return;
        }

        await bookmarksStore.moveBookmark(bookmark.id, {
            parentId: props.folder.id,
            index: event.newIndex,
        });
    }

    // when bookmark is moved within the same folder/parentId
    async function onDragUpdate(event: DragEventInfo): Promise<void> {
        if (dropIntent.value || bookmarksStore.groupMode) {
            return;
        }

        const bookmark = renderItems.value[event.newIndex];

        if (!bookmark) {
            return;
        }

        const index = event.newIndex > event.oldIndex ? event.newIndex + 1 : event.newIndex;

        await nextTick();

        await bookmarksStore.reorderBookmark(bookmark.id, index);
    }

    function onDragStart(event?: Partial<DragEventInfo>) {
        const oldIndex = event?.oldIndex;

        draggedBookmarkId.value = oldIndex === undefined
            ? null
            : renderItems.value[oldIndex]?.id ?? null;

        bookmarksStore.dragStart = true;

        dragging.value = true;

        dragCursor.start(onPointerMoveDuringDrag);

        emitter.emit(EMITS.DRAG_START);
    }

    async function onDragEnd() {
        dragCursor.stop();

        dragging.value = false;
        bookmarksStore.dragStart = false;

        // Scope the click swallower to bookmark elements only — clicks
        // elsewhere (toolbar, dialogs, anchors) should pass through.
        dragCursor.swallowClicksFor(
            (target) => target instanceof Element
                && !!target.closest('[data-bookmark-id]'),
            popupSwallowClickMs,
        );

        try {
            if (bookmarksStore.groupMode && dropIntent.value && draggedBookmarkId.value) {
                if (dropIntent.value.type === 'create') {
                    await bookmarksStore.createBookmarkGroup(
                        props.folder.id,
                        draggedBookmarkId.value,
                        dropIntent.value.targetId,
                    );
                }

                if (dropIntent.value.type === 'add-to-group') {
                    await bookmarksStore.addBookmarkToGroup(
                        dropIntent.value.targetId,
                        draggedBookmarkId.value,
                    );
                }
            }
        } finally {
            draggedBookmarkId.value = null;
            resetDropIntent();
        }
    }

    onUnmounted(() => {
        if (closePopupTimeoutId.value !== null) {
            window.clearTimeout(closePopupTimeoutId.value);
            closePopupTimeoutId.value = null;
        }
    });
</script>
<style>
    .cursor-pointer,
    .cursor-pointer a,
    .cursor-pointer button {
        cursor: grabbing !important;
    }
</style>
<style scoped lang="scss">
    .folder {
        flex: 0 0 100%;

        &-inner {
            display: flex;
            justify-content: center;
            min-height: 150px;
            position: relative;
        }

        &-empty {
            margin-top: 60px;
            opacity: 0;
            z-index: 1;
            pointer-events: none;
        }

        ul {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            list-style: none;
            margin: 0 auto;
            margin: 0;
            max-width: 1024px;
            padding: 0;
            width: 100%;

            &:empty {
                position: absolute;
                height: 100%;

                + div {
                    opacity: 1;
                    pointer-events: all;
                }
            }

            li {
                padding: 0;
                margin: 0 10px;
                display: inline;
                position: relative;

                &.drag-target-group,
                &.drag-target-add {
                    :deep(.bookmark-image-container),
                    :deep(.group-grid) {
                        box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), .75);
                        transform: scale(1.03);
                        transition: box-shadow .08s ease, transform .08s ease;
                    }
                }

                &.popup-origin-hidden {
                    visibility: hidden;
                }
            }

            &.dragging {
                :deep(.bookmark-edit) {
                    display: none;
                }

                :deep(.tooltip) {
                    display: none;
                }

                :deep(.bookmark-image-container) {
                    transform: none !important;
                }
            }
        }

    }

    .group-popup-overlay {
        background: rgba(10, 12, 18, var(--popup-overlay-opacity, 0.56));
        backdrop-filter: blur(var(--popup-overlay-blur, 8px));
        -webkit-backdrop-filter: blur(var(--popup-overlay-blur, 8px));
        inset: 0;
        padding: clamp(16px, 4vw, 48px);
        position: fixed;
        transition:
            backdrop-filter 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
            -webkit-backdrop-filter 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
            background-color 0.28s cubic-bezier(0.2, 0.85, 0.2, 1);
        z-index: 1100;
    }

    .group-popup-wrapper {
        position: fixed;
        transform: translate(-50%, -50%);
        border-radius: var(--popup-card-radius, 14%);
        transition:
            left 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
            top 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
            width 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
            height 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
            opacity 0.18s ease,
            box-shadow 0.28s ease,
            border-radius 0.28s cubic-bezier(0.2, 0.85, 0.2, 1);
        z-index: 1101;

        &.opening,
        &.closing {
            border-radius: var(--popup-inline-radius, 11.11%);
            box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
        }

        &.open {
            border-radius: var(--popup-expanded-radius, 14%);
            box-shadow: 0 22px 70px rgba(0, 0, 0, 0.35);
        }
    }

    :deep(.group-popup-card) {
        border-radius: var(--popup-card-radius, 14%);
        margin: 0;
        overflow: hidden;
        transition: border-radius 0.28s cubic-bezier(0.2, 0.85, 0.2, 1);
        width: 100%;
        height: 100%;
    }
</style>
