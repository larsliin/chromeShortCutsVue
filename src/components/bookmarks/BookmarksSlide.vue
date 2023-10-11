<template>
    <div class="folder">
        <div class="folder-inner" v-if="bookmarks">
            <draggable
                tag="ul"
                item-key="id"
                ghost-class="ghost"
                :animation="200"
                :list="bookmarks"
                @start="onDragStart()"
                @end="onDragEnd($event, element)">
                <template #item="{element}">
                    <li>
                        <BookmarkLink
                            :size="size"
                            :tabIndex="slideindex === bookmarksStore.sliderIndex ? '1' : '-1'"
                            :id="element.id"
                            :key="element.id"
                            :link="element.url"
                            :title="element.url ? element.title : ''"
                            :typeFolder="!!element.url" />
                    </li>
                </template>
            </draggable>
        </div>
    </div>
</template>

<script setup>
    import { nextTick, computed } from 'vue';
    import BookmarkLink from '@/components/bookmarks/BookmarkLink.vue';
    import draggable from 'vuedraggable';
    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();

    const props = defineProps({
        slideindex: Number,
        bookmarks: {
            type: Array,
            default: () => [],
        },
    });

    const size = computed(() => {
        if (props.bookmarks.length > 14) {
            return 'small';
        }
        return 'normal';
    });

    function onDragStart() {
        bookmarksStore.dragStart = true;
    }

    async function onDragEnd(event) {
        const bookmark = props.bookmarks[event.newIndex];

        const index = event.newIndex > event.oldIndex ? event.newIndex + 1 : event.newIndex;

        await nextTick();

        bookmarksStore.reorder_bookmark(bookmark.id, index);
    }
</script>

<style scoped lang="scss">
    .folder {
        flex: 0 0 100%;
        max-height: calc(100vh - 200px);
        overflow-y: auto;

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
            padding: 0 40px;
            width: 100%;

            li {
                padding: 0;
                margin: 0 5px;
                display: inline;
                line-height: 0;
                position: relative;
            }
        }
    }
</style>
