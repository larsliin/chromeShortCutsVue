<template>
    <div class="folder"
        :class="{
            'folder-max-height': !bookmarksStore.accordionNavigation,
            'slider': !bookmarksStore.accordionNavigation
        }">
        <div class="folder-inner" v-if="bookmarks">
            <draggable
                tag="ul"
                item-key="id"
                ghost-class="ghost"
                :animation="200"
                :list="bookmarks"
                group="bookmarks"
                @add="onDragAdd($event)"
                @update="onDragUpdate($event)"
                @start="onDragStart()">
                <template #item="{element}">
                    <li>
                        <BookmarkLink
                            :size="size"
                            :tabIndex="slideindex === bookmarksStore.sliderIndex ? '1' : '-1'"
                            :id="element.id"
                            :key="element.id"
                            :link="element.url"
                            :title="element.title"
                            :typeFolder="!!element.url" />
                    </li>
                </template>
            </draggable>
        </div>
    </div>
</template>

<script setup>
    import { nextTick, computed } from 'vue';
    import BookmarkLink from '@/components/bookmarks/sharedComponents/BookmarkLink.vue';
    import draggable from 'vuedraggable';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { useUtils } from '@/shared/utils/utils';

    const props = defineProps({
        slideindex: Number,
        id: String,
        bookmarks: {
            type: Array,
            default: () => [],
        },
    });

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
        }

        &.slider {
            ul {
                padding: 0 40px;
            }
        }
    }
</style>
