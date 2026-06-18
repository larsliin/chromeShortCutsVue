<template>
    <v-card class="bookmark-group-dialog"
        rounded="0"
        variant="flat">
        <v-card-text class="bookmark-group-dialog__content">
            <div class="bookmark-group-dialog__title text-h5">
                Group
            </div>
            <draggable
                :animation="200"
                :fallbackTolerance="10"
                :force-fallback="true"
                :ghost-class="'ghost'"
                :group="'bookmarks'"
                :handle="'.handle'"
                :item-key="'id'"
                :list="groupItems"
                :scroll-sensitivity="100"
                :tag="'ul'"
                @add="onDragAdd($event)"
                @update="onDragUpdate($event)">
                <template #item="{ element }">
                    <li>
                        <BookmarkLink
                            :bookmark="element"
                            :hideEdit="true"
                            size="smaller"
                            :key="element.id" />
                    </li>
                </template>
            </draggable>
        </v-card-text>
        <v-card-actions class="bookmark-group-dialog__actions">
            <v-spacer />
            <v-btn
                variant="tonal"
                color="red"
                @click="onUngroup()">
                Ungroup
            </v-btn>
            <v-btn
                color="blue-darken-1"
                variant="text"
                @click="emit(EMITS.CLOSE)">
                Close
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import draggable from 'vuedraggable';
    import type { DragEventInfo } from '@/types/bookmark';
    import { EMITS } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';
    import BookmarkLink from '@/components/bookmarks/sharedComponents/BookmarkLink.vue';
    import { findNodeById } from '@utils/bookmarkGroups';

    interface Props {
        groupId: string;
    }

    const props = defineProps<Props>();

    const emit = defineEmits([
        EMITS.CLOSE,
    ]);

    const bookmarksStore = useBookmarksStore();

    const groupNode = computed(() => findNodeById(bookmarksStore.bookmarks ?? [], props.groupId));

    const groupItems = computed(() => (groupNode.value?.children ?? []).filter((item) => !!item.url));

    async function onUngroup(): Promise<void> {
        await bookmarksStore.ungroupBookmarkGroup(props.groupId);
        emit(EMITS.CLOSE);
    }

    async function onDragUpdate(event: DragEventInfo): Promise<void> {
        const bookmark = groupItems.value[event.newIndex];

        if (!bookmark) {
            return;
        }

        const index = event.newIndex > event.oldIndex ? event.newIndex + 1 : event.newIndex;

        await bookmarksStore.reorderBookmark(bookmark.id, index);
    }

    async function onDragAdd(event: DragEventInfo): Promise<void> {
        const bookmark = groupItems.value[event.newIndex];

        if (!bookmark) {
            return;
        }

        await bookmarksStore.addBookmarkToGroup(props.groupId, bookmark.id);
    }
</script>

<style scoped lang="scss">
    .bookmark-group-dialog {
        background: rgb(var(--v-theme-surface));
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        width: 100%;

        &__content {
            display: flex;
            flex: 1 1 auto;
            flex-direction: column;
            gap: 16px;
            min-height: 0;
            overflow: auto;
            padding: 24px;
        }

        &__title {
            flex: 0 0 auto;
        }

        &__actions {
            flex: 0 0 auto;
            padding-inline: 24px;
            padding-bottom: 24px;
        }

        ul {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            justify-content: center;
            list-style: none;
            margin: 0;
            padding: 0;

            li {
                display: inline;
                margin: 0;
                padding: 0;
            }
        }
    }
</style>
