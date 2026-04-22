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
                :list="bookmarks"
                :scroll-sensitivity="100"
                :tag="'ul'"
                @add="onDragAdd($event)"
                @end="onDragEnd()"
                @start="onDragStart()"
                @update="onDragUpdate($event)">
                <template #item="{ element }">
                    <li>
                        <BookmarkLink
                            :bookmark="element"
                            :key="element.id" />
                    </li>
                </template>
            </draggable>
            <div class="folder-empty"
                v-if="!bookmarks.length">
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
                        :showFolderMessage="false"
                        :title="folder.title"
                        :id="folder.id"
                        @cancel="showConfirmDelete = false"
                        @confirm="onDeleteConfirm($event)" />
                </v-dialog>
            </v-row>
        </template>
    </Teleport>
</template>

<script setup lang="ts">
    import {
        nextTick, ref,
    } from 'vue';
    import type { BookmarkNode, DragEventInfo } from '@/types/bookmark';
    import BookmarkLink from '@/components/bookmarks/sharedComponents/BookmarkLink.vue';
    import draggable from 'vuedraggable';
    import { useBookmarksStore } from '@stores/bookmarks';
    import useEventsBus from '@cmp/eventBus';
    import { EMITS } from '@/constants';
    import { useUtils } from '@/shared/composables/utils';
    import BookmarkConfirmDelete
        from '@/components/forms/BookmarkConfirmDelete.vue';

    const utils = useUtils();

    const { emit } = useEventsBus();

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

    function onDelete() {
        showConfirmDelete.value = true;
    }

    async function onDeleteConfirm(_event?: unknown): Promise<void> {
        emits(EMITS.BEFORE_DELETE);

        await nextTick();

        // close confirmation dialogue
        showConfirmDelete.value = false;

        // get updated bookmark folder index
        const bookmarkResponse = await bookmarksStore.get_bookmarkById(props.folder.id);

        await utils.deleteBookmarkFolder(bookmarkResponse as BookmarkNode);

        emits(EMITS.DELETE, { id: props.folder.id, index: bookmarkResponse.index });
    }

    // when bookmark is moved to a different folder/parentId
    async function onDragAdd(event: DragEventInfo): Promise<void> {
        const bookmark = props.bookmarks?.[event.newIndex];

        if (bookmark) {
            bookmarksStore.move_bookmark(bookmark.id, {
                parentId: props.folder.id,
                index: event.newIndex,
            });
        }
    }

    // when bookmark is moved within the same folder/parentId
    async function onDragUpdate(event: DragEventInfo): Promise<void> {
        const bookmark = (props.bookmarks ?? [])[event.newIndex];

        if (!bookmark) {
            return;
        }

        const index = event.newIndex > event.oldIndex ? event.newIndex + 1 : event.newIndex;

        await nextTick();

        bookmarksStore.reorder_bookmark(bookmark.id, index);
    }

    function onDragStart() {
        bookmarksStore.dragStart = true;

        dragging.value = true;

        document.body.classList.add('cursor-pointer');

        emit(EMITS.DRAG_START);
    }

    function onDragEnd() {
        document.body.classList.remove('cursor-pointer');

        dragging.value = false;
    }
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
