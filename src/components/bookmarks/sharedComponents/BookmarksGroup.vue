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
                            @open="groupPopup.onOpenGroup($event)" />
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
                    <BookmarkConfirmAction
                        typeFolder
                        :title="folder.title"
                        :id="folder.id"
                        @cancel="showConfirmDelete = false"
                        @confirm="onDeleteConfirm($event)" />
                </v-dialog>
            </v-row>
        </template>
    </Teleport>
    <BookmarkGroupPopup :popup="groupPopup" />
</template>

<script setup lang="ts">
    import {
        computed, nextTick, ref,
    } from 'vue';
    import { useDragCursor } from '@cmp/useDragCursor';
    import type { BookmarkNode, DragEventInfo } from '@/types/bookmark';
    import { GROUPING, EMITS } from '@/constants';
    import BookmarkLink from '@/components/bookmarks/sharedComponents/BookmarkLink.vue';
    import BookmarkGroupCard from '@/components/bookmarks/sharedComponents/BookmarkGroupCard.vue';
    import BookmarkGroupPopup from '@/components/bookmarks/sharedComponents/BookmarkGroupPopup.vue';
    import draggable from 'vuedraggable';
    import { useBookmarksStore } from '@stores/bookmarks';
    import emitter from '@cmp/eventBus';

    import { useBookmarkOps } from '@cmp/useBookmarkOps';
    import { useGroupPopup } from '@cmp/useGroupPopup';
    import BookmarkConfirmAction
        from '@/components/forms/BookmarkConfirmAction.vue';
    import {
        findNodeById,
        isBookmarkLink,
        isGroupFolder,
    } from '@utils/bookmarkGroups';
    import { computeDropIntent } from '@utils/dragIntent';

    const utils = useBookmarkOps();
    const groupPopup = useGroupPopup();

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

    const bookmarksStore = useBookmarksStore();

    const showConfirmDelete = ref(false);
    const draggedBookmarkId = ref<string | null>(null);
    const dropIntent = ref<{ type: 'create' | 'add-to-group'; targetId: string } | null>(null);
    const popupSwallowClickMs = 300;

    const dragCursor = useDragCursor();

    const renderItems = computed(() => props.bookmarks ?? []);

    function isRegularBookmark(item: BookmarkNode): boolean {
        return !isGroupFolder(item, bookmarksStore.groupIds);
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
            && groupPopup.shouldHidePopupOrigin(element.id);
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
</script>
<style lang="scss">
    // Set on <body> for the duration of a drag by useDragCursor.
    .cursor-pointer {
        &,
        a,
        button {
            cursor: grabbing !important;
        }

        // Sortable's clone never gets Vue's .drag-active, so hide badges globally.
        .bookmark-edit,
        .menu-badge {
            visibility: hidden !important;
        }
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
</style>
