<template>
    <div class="folder"
        :class="{
            'folder-max-height': !bookmarksStore.accordionNavigation,
            'slider': !bookmarksStore.accordionNavigation
        }">
        <div class="folder-inner" v-if="bookmarks">
            <draggable
                :class="{ dragging }"
                :fallbackTolerance="10"
                :animation="200"
                :ghost-class="'ghost'"
                :group="'bookmarks'"
                :item-key="'id'"
                :list="bookmarks"
                :force-fallback="true"
                :handle="'.handle'"
                :scroll-sensitivity="100"
                :tag="'ul'"
                @add="onDragAdd($event)"
                @update="onDragUpdate($event)"
                @start="onDragStart()"
                @end="dragging = false">
                <template #item="{element}">
                    <li>
                        <BookmarkLink
                            :size="size"
                            :tabIndex="slideindex === bookmarksStore.sliderIndex ? '1' : '-1'"
                            :id="element.id"
                            :key="element.id"
                            :link="element.url"
                            :title="element.title" />
                    </li>
                </template>
            </draggable>
        </div>
    </div>
</template>

<script setup>
    import { nextTick, computed, ref } from 'vue';
    import BookmarkLink from '@/components/bookmarks/sharedComponents/BookmarkLink.vue';
    import draggable from 'vuedraggable';
    import { useBookmarksStore } from '@stores/bookmarks';
    import useEventsBus from '@cmp/eventBus';
    import { EMITS } from '@/constants';

    const { emit } = useEventsBus();

    const props = defineProps({
        slideindex: Number,
        id: String,
        bookmarks: {
            type: Array,
            default: () => [],
        },
    });

    const dragging = ref(false);

    const bookmarksStore = useBookmarksStore();

    const size = computed(() => {
        if (props.bookmarks.length > 14 || bookmarksStore.accordionNavigation) {
            return 'small';
        }
        return 'normal';
    });

    // when bookmark is moved to a different folder/parentId
    async function onDragAdd(event) {
        const bookmark = props.bookmarks[event.newIndex];

        bookmarksStore.move_bookmark(bookmark.id, { parentId: props.id, index: event.newIndex });
    }

    // when bookmark is moved within the same folder/parentId
    async function onDragUpdate(event) {
        const bookmark = props.bookmarks[event.newIndex];

        const index = event.newIndex > event.oldIndex ? event.newIndex + 1 : event.newIndex;

        await nextTick();

        bookmarksStore.reorder_bookmark(bookmark.id, index);
    }

    function onDragStart() {
        bookmarksStore.dragStart = true;

        dragging.value = true;

        emit(EMITS.DRAG_START);
    }
</script>

<style scoped lang="scss">
    .folder {
        flex: 0 0 100%;

        &-max-height {
            max-height: calc(100vh - 200px);
            overflow-y: auto;
        }

        &-inner {
            display: flex;
            justify-content: center;
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

            li {
                padding: 0;
                margin: 0 10px 5px;
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

        &.slider {
            ul {
                padding: 0 40px;
            }
        }
    }

    .sortable-chosen {
        :deep(.tooltip) {
            opacity: 0 !important;
            transition: none !important;
        }

        :deep(.bookmark-edit) {
            visibility: hidden !important;
        }
    }
</style>
