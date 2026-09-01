<template>
    <span
        class="popup-item"
        :class="{ 'drag-active': bookmarksStore.dragStart, static: !expanded }">
        <span class="popup-handle">
            <span class="group-grid-link">
                <BookmarkLink
                    class="popup"
                    :bookmark="bookmark"
                    :image="image"
                    :expanded="expanded"
                    size="smaller"
                    :draggable="false" />
            </span>
        </span>
    </span>
</template>

<script setup lang="ts">
    import { toRefs } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import type { BookmarkNode } from '@/types/bookmark';
    import BookmarkLink from '@/components/bookmarks/sharedComponents/BookmarkLink.vue';

    interface Props {
        bookmark: BookmarkNode;
        image?: string | null;
        // The collapsed preview uses the same markup but stays non-interactive.
        // This lets the popup expand with a smooth morph.
        expanded?: boolean;
    }

    const props = withDefaults(defineProps<Props>(), {
        image: null,
        expanded: true,
    });

    const bookmarksStore = useBookmarksStore();
    const { image, expanded } = toRefs(props);
</script>

<style scoped lang="scss">
    .popup-item {
        display: flex;
        width: 100%;
        height: 100%;
        position: relative;

        // the collapsed preview / mid-animation state isn't interactive —
        // clicks should fall through to the group's own open trigger.
        &.static {
            pointer-events: none;
        }

        // Guard hover effects so collapsed and mid-animation items stay inert.
        &:not(.static):hover {
            z-index: 1;

            :deep(.bookmark-edit) {
                visibility: visible;
                z-index: 2;
            }

            :deep(.menu-badge) {
                visibility: visible;
            }

            .group-grid-link :deep(.tooltip) {
                opacity: 1;
                transition: opacity 0s;
                transition-delay: 400ms;
            }

            // Keep the icon hover effect active even when the cursor
            // is over the edit button (which sits outside .group-grid-link).
            .group-grid-link :deep(.bookmark-image-container) {
                transform: perspective(400px) rotateY(25deg) scale(1.02);
            }
        }

        &.drag-active {
            :deep(.bookmark-edit) {
                visibility: hidden;
            }

            :deep(.menu-badge) {
                visibility: hidden;
            }

            .group-grid-link {
                &:hover :deep(.bookmark-image-container),
                &:active :deep(.bookmark-image-container) {
                    transform: none;
                }
            }

            &:hover .group-grid-link :deep(.bookmark-image-container) {
                transform: none;
            }
        }
    }

    .popup-handle {
        display: flex;
        width: 100%;
        height: 100%;
    }

    .group-grid-link {
        display: flex;
        width: 100%;
        height: 100%;
        text-decoration: none;
        cursor: pointer;

        :deep(.bookmark-link) {
            margin-top: 0;
        }

        &:active :deep(.bookmark-image-container) {
            transform: perspective(400px) rotateY(-15deg) scale(.98);
            transform-origin: center right;
        }
    }

    // Popup grid cells are much smaller than the default tile, so the icon needs
    // to fill its cell instead of using the fixed default sizes.
    :deep(.bookmark-image-container) {
        height: 100%;
        width: 100%;
        padding: 8%;
        border-radius: 17%;
    }
</style>
