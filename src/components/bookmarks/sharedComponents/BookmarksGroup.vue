<template>
    <div
        class="folder"
        :class="{ 'icon-small': bookmarksStore.iconSize === 'small' }">
        <div class="folder-inner" v-if="bookmarks">
            <draggable
                :animation="200"
                :class="{ dragging }"
                :fallbackTolerance="10"
                :force-fallback="true"
                :filter="'.group-item'"
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
                        :class="[
                            getDragTargetClass(element),
                            {
                                'group-item': bookmarksStore.groupMode
                                    && isGroupFolder(element, bookmarksStore.groupIds),
                                'popup-origin-hidden': shouldHidePopupOrigin(element),
                            },
                        ]">
                        <BookmarkLink
                            v-if="isRegularBookmark(element)"
                            :bookmark="element"
                            :key="`${element.id}-link`" />
                        <BookmarkGroupCard
                            v-else
                            :bookmark="element"
                            :key="`${element.id}-group`"
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
            ref="popupOverlayRef"
            class="group-popup-overlay"
            :style="popupOverlayStyle"
            role="dialog"
            tabindex="-1"
            aria-modal="true"
            @keydown.esc="onOverlayEscape()"
            @keydown.tab="onOverlayTab($event)"
            @mousedown.self="onOverlayClickSelf()">
            <div
                class="group-popup-wrapper"
                :class="[popupState, { 'popup-transition': popupTransitioning }]"
                :style="popupStyle">
                <BookmarkGroupCard
                    class="group-popup-card"
                    :bookmark="activeGroup"
                    popup
                    :expanded="popupState === 'open'"
                    @close="closeGroupPopup()"
                    @[EMITS.DRAG_START]="popupDragging = true"
                    @[EMITS.POPUP_DRAG_END]="popupDragging = false"
                    @[EMITS.DRAG_OUT_OF_GROUP]="handlePopupDragOutOfGroup" />
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
    import {
        computed, nextTick, onMounted, onUnmounted, ref,
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
    import { computeDropIntent } from '@utils/dragIntent';

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
    const popupFallbackSize = 360;
    const popupAnimationMs = 280;
    const popupSwallowClickMs = 300;

    const dragCursor = useDragCursor();
    const popupOverlayRef = ref<HTMLElement | null>(null);
    const popupReturnFocusEl = ref<HTMLElement | null>(null);
    const closePopupTimeoutId = ref<number | null>(null);
    // Only animate while the popup is actually opening/closing — disabling the
    // transition once settled keeps window resizes from sliding the popup.
    const popupTransitioning = ref(true);
    const popupTransitionTimeoutId = ref<number | null>(null);

    function setPopupOriginFromRect(rect?: DOMRect | null): void {
        popupOrigin.value = rect
            ? {
                left: rect.left + (rect.width / 2),
                top: rect.top + (rect.height / 2),
                width: rect.width,
                height: rect.height,
            }
            : null;
    }

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
        const x = isOpen ? '50vw' : `${origin?.left ?? popupFallbackSize / 2}px`;
        const y = isOpen ? '50vh' : `${origin?.top ?? popupFallbackSize / 2}px`;
        const inlineRadius = getInlineGroupRadius();
        const expandedRadius = '8%';

        return {
            left: x,
            top: y,
            width: isOpen
                ? 'min(var(--popup-target-size, 360px), calc(100vw - 32px), calc(100vh - 32px))'
                : `${origin?.width ?? popupFallbackSize}px`,
            height: isOpen
                ? 'min(var(--popup-target-size, 360px), calc(100vw - 32px), calc(100vh - 32px))'
                : `${origin?.height ?? popupFallbackSize}px`,
            opacity: '1',
            '--popup-inline-radius': inlineRadius,
            '--popup-expanded-radius': expandedRadius,
            '--popup-card-radius': isOpen ? expandedRadius : inlineRadius,
            '--popup-group-radius': isOpen ? expandedRadius : inlineRadius,
        } as Record<string, string>;
    });

    const popupOverlayStyle = computed(() => {
        const isOpen = popupState.value === 'open';

        return {
            '--popup-overlay-opacity': isOpen ? '0.75' : '0',
            '--popup-overlay-blur': isOpen ? (`var(--popup-overlay-blur-target, ${GROUPING.POPUP_OVERLAY_BLUR})`) : '0px',
        } as Record<string, string>;
    });
    function isRegularBookmark(item: BookmarkNode): boolean {
        return !isGroupFolder(item, bookmarksStore.groupIds);
    }

    async function onOpenGroup(payload: { groupId: string; rect?: DOMRect }): Promise<void> {
        setPopupOriginFromRect(payload.rect ?? null);

        popupReturnFocusEl.value = document.activeElement as HTMLElement | null;
        activeGroupId.value = payload.groupId;
        showGroupPopup.value = true;
        popupState.value = 'opening';

        if (popupTransitionTimeoutId.value !== null) {
            window.clearTimeout(popupTransitionTimeoutId.value);
            popupTransitionTimeoutId.value = null;
        }
        popupTransitioning.value = true;

        await nextTick();
        setBackgroundInert(true);
        popupOverlayRef.value?.focus();
        requestAnimationFrame(() => {
            popupState.value = 'open';

            popupTransitionTimeoutId.value = window.setTimeout(() => {
                popupTransitioning.value = false;
                popupTransitionTimeoutId.value = null;
            }, popupAnimationMs);
        });
    }

    function closeGroupPopup(): void {
        if (!showGroupPopup.value) {
            return;
        }

        syncPopupOriginWithActiveGroup();

        if (popupTransitionTimeoutId.value !== null) {
            window.clearTimeout(popupTransitionTimeoutId.value);
            popupTransitionTimeoutId.value = null;
        }
        popupTransitioning.value = true;

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
            setBackgroundInert(false);
            popupReturnFocusEl.value?.focus();
            popupReturnFocusEl.value = null;
        }, popupAnimationMs);
    }

    async function closeGroupPopupAfterReflow(): Promise<void> {
        await nextTick();
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => resolve());
        });
        closeGroupPopup();
    }

    function waitForBookmarkMoveRefresh(bookmarkId: string): {
        promise: Promise<void>;
        cancel: () => void;
    } {
        let cancel!: () => void;
        const promise = new Promise<void>((resolve) => {
            const onBookmarksUpdated = (event: { type: string; id: string }): void => {
                if (event.type !== 'moved' || event.id !== bookmarkId) {
                    return;
                }

                emitter.off(EMITS.BOOKMARKS_UPDATED, onBookmarksUpdated);
                resolve();
            };

            emitter.on(EMITS.BOOKMARKS_UPDATED, onBookmarksUpdated);
            cancel = () => {
                emitter.off(EMITS.BOOKMARKS_UPDATED, onBookmarksUpdated);
                resolve();
            };
        });

        return { promise, cancel };
    }

    function syncPopupOriginWithActiveGroup(): void {
        if (!showGroupPopup.value || !activeGroupId.value) {
            return;
        }

        const listItem = document.querySelector(
            `[data-bookmark-id="${activeGroupId.value}"]`,
        ) as HTMLElement | null;

        if (!listItem) {
            return;
        }

        // Match the same visual anchor as the open-click payload (group card body)
        // so close animations keep a square aspect ratio after resizes.
        const originElement = listItem.querySelector('.group-body.group-link') as HTMLElement | null;

        if (!originElement) {
            return;
        }

        setPopupOriginFromRect(originElement.getBoundingClientRect());
    }

    function onWindowResize(): void {
        syncPopupOriginWithActiveGroup();
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
        return isGroupFolder(element, bookmarksStore.groupIds)
            && showGroupPopup.value
            && activeGroupId.value === element.id;
    }

    function computeDropIntentFor(draggedId: string, targetId: string): {
        type: 'create' | 'add-to-group';
        targetId: string;
    } | null {
        return computeDropIntent({
            draggedId,
            targetId,
            items: renderItems.value,
            parentFolder: props.folder,
            storeBookmarks: bookmarksStore.bookmarks ?? [],
            groupMode: bookmarksStore.groupMode,
            groupIds: bookmarksStore.groupIds,
        });
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
            && !isGroupFolder(props.folder, bookmarksStore.groupIds);

        if (canCreateGroup) {
            dropIntent.value = {
                type: 'create',
                targetId: related.id,
            };

            return false;
        }

        const canAddToGroup = isBookmarkLink(dragged)
            && isGroupFolder(related, bookmarksStore.groupIds)
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

    // The popup is teleported outside #app, so making the app inert keeps the
    // bookmarks behind the backdrop out of the tab order.
    function setBackgroundInert(inert: boolean): void {
        const appRoot = document.getElementById('app');

        if (!appRoot) {
            return;
        }

        if (inert) {
            appRoot.setAttribute('inert', '');
        } else {
            appRoot.removeAttribute('inert');
        }
    }

    function getPopupFocusables(): HTMLElement[] {
        const overlay = popupOverlayRef.value;

        if (!overlay) {
            return [];
        }

        return Array.from(
            overlay.querySelectorAll<HTMLElement>(GROUPING.FOCUSABLE_SELECTOR),
        ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
    }

    function onOverlayTab(event: KeyboardEvent): void {
        const focusables = getPopupFocusables();

        if (!focusables.length) {
            event.preventDefault();
            popupOverlayRef.value?.focus();
            return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        const outsideTrap = !active || !popupOverlayRef.value?.contains(active);

        if (event.shiftKey && (active === first || outsideTrap)) {
            event.preventDefault();
            last.focus();
            return;
        }

        if (!event.shiftKey && (active === last || outsideTrap)) {
            event.preventDefault();
            first.focus();
        }
    }

    function onOverlayClickSelf(): void {
        if (popupDragging.value) {
            return;
        }

        closeGroupPopup();
    }

    function handlePopupDragOutOfGroup(payload: {
        bookmarkId: string;
        groupId: string;
        groupParentId: string;
    }): void {
        onPopupDragOutOfGroup(payload);
    }

    async function onPopupDragOutOfGroup(payload: {
        bookmarkId: string;
        groupId: string;
        groupParentId: string;
    }): Promise<void> {
        popupDragging.value = false;
        const moveRefresh = waitForBookmarkMoveRefresh(payload.bookmarkId);

        try {
            const parentSubtree = await bookmarksStore.getBookmarks(payload.groupParentId);
            const parentChildren = (parentSubtree?.[0]?.children ?? []) as BookmarkNode[];
            const targetIndex = parentChildren.length;

            await bookmarksStore.moveBookmark(payload.bookmarkId, {
                parentId: payload.groupParentId,
                index: targetIndex,
            });
        } catch (_error) {
            // Swallow the failure and rely on the Chrome probe below.
            // The group may have already been mutated by another handler.
        }

        // Probe Chrome directly so the popup closes once the group runs empty.
        // The group folder itself is kept so it can be refilled later.
        const groupSubtree = await bookmarksStore
            .getBookmarks(payload.groupId)
            .catch(() => null);
        const remaining = (groupSubtree?.[0]?.children ?? []).filter((item) => !!item.url);

        if (!remaining.length) {
            await moveRefresh.promise;
            await closeGroupPopupAfterReflow();
            return;
        }

        moveRefresh.cancel();
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

    // Drag-add handling is done at drag end via dropIntent.
    // The earlier auto-group branches were removed because @add fires before the move resolves.
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

    onMounted(() => {
        window.addEventListener('resize', onWindowResize, { passive: true });
    });

    onUnmounted(() => {
        window.removeEventListener('resize', onWindowResize);
        setBackgroundInert(false);

        if (closePopupTimeoutId.value !== null) {
            window.clearTimeout(closePopupTimeoutId.value);
            closePopupTimeoutId.value = null;
        }

        if (popupTransitionTimeoutId.value !== null) {
            window.clearTimeout(popupTransitionTimeoutId.value);
            popupTransitionTimeoutId.value = null;
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

        &.icon-small ul {
            gap: 5px 15px;
            margin-top: 8px;
        }

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
            margin: 16px auto 0;
            max-width: 1024px;
            padding: 0;
            width: 100%;
            gap: 10px 15px;

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
                display: inline;
                position: relative;

                &.drag-target-group,
                &.drag-target-add {
                    :deep(.bookmark-image-container),
                    :deep(.group-grid) {
                        // !important needed to win over the badge feature's own
                        // blanket box-shadow removal on these same elements.
                        box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), .75) !important;
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
        --popup-target-size: 375px;
        --popup-overlay-blur-target: 6px;
        background: rgba(10, 12, 18, var(--popup-overlay-opacity, 0.75));
        backdrop-filter: blur(var(--popup-overlay-blur, 0px));
        -webkit-backdrop-filter: blur(var(--popup-overlay-blur, 0px));
        inset: 0;
        padding: clamp(16px, 4vw, 48px);
        position: fixed;
        contain: paint;
        transition: background-color 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
            backdrop-filter 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
            -webkit-backdrop-filter 0.28s cubic-bezier(0.2, 0.85, 0.2, 1);
        will-change: backdrop-filter;
        z-index: 1100;
    }
    @media (min-width: 960px) {
        .group-popup-overlay {
            --popup-target-size: 435px;
            --popup-overlay-blur-target: 4.5px;
        }
    }
    @media (min-width: 1440px) {
        .group-popup-overlay {
            --popup-target-size: 500px;
            --popup-overlay-blur-target: 3.5px;
        }
    }

    .group-popup-wrapper {
        position: fixed;
        transform: translate3d(-50%, -50%, 0);
        backface-visibility: hidden;
        will-change: left, top, width, height, border-radius, box-shadow, opacity, transform;
        border-radius: var(--popup-card-radius, 14%);
        z-index: 1101;

        // Only animate while actually opening/closing. Removing the transition
        // once settled stops window resizes from sliding the popup around.
        &.popup-transition {
            transition:
                left 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
                top 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
                width 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
                height 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
                opacity 0.18s ease,
                box-shadow 0.28s cubic-bezier(0.2, 0.85, 0.2, 1),
                border-radius 0.28s cubic-bezier(0.2, 0.85, 0.2, 1);
        }

        &.opening,
        &.closing {
            border-radius: var(--popup-inline-radius, 11.11%);
            box-shadow: 0 0 0 rgba(0, 0, 0, 0);
        }

        &.open {
            border-radius: var(--popup-expanded-radius, 14%);
            box-shadow: none; // Removed drop shadow for flat design on expanded popup
        }

        &.open :deep(.bookmark.popup):hover .group-link .group-grid,
        &.open :deep(.bookmark.popup) .group-link:active .group-grid,
        &.open :deep(.bookmark.popup):hover :deep(.bookmark-link:not(.folder) .bookmark-image-container),
        &.open :deep(.bookmark.popup) :deep(.bookmark-link:active:not(.folder) .bookmark-image-container) {
            transform: none !important;
            box-shadow: none !important;
        }
    }

    :deep(.group-popup-card) {
        border-radius: var(--popup-card-radius, 14%);
        margin: 0;
        // .group-grid clips its own content with a matching radius, so the
        // card root stays visible — letting the close button overlay the corner.
        transition: border-radius 0.28s cubic-bezier(0.2, 0.85, 0.2, 1);
        width: 100%;
        height: 100%;
    }
</style>
