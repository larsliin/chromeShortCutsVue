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
    import { toRef, toRefs, type Ref } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import type { BookmarkNode } from '@/types/bookmark';
    import BookmarkLink from '@/components/bookmarks/sharedComponents/BookmarkLink.vue';

    interface Props {
        bookmark: BookmarkNode;
        image?: string | null;
        // false for the collapsed group preview: shows the same icon+title
        // markup as the open popup, but non-interactive and "closed"-styled
        // so expanding can morph smoothly instead of swapping layouts.
        expanded?: boolean;
    }

    const props = withDefaults(defineProps<Props>(), {
        image: null,
        expanded: true,
    });

    const bookmarksStore = useBookmarksStore();
    const image = toRef(props, 'image') as Ref<string | null | undefined>;
    const { expanded } = toRefs(props);
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
            box-shadow: 0 0 25px 0 rgba(0, 0, 0, 0.15);
            transform-origin: center right;
        }
    }

    :deep(.v-btn--icon.v-btn--density-default) {
        width: 28px;
        height: 28px;
    }

    // Give the dot-menu activator a dark surface so the white dots
    // stay legible against light bookmark icons inside the popup.
    :deep(.button) {
        background-color: rgba(var(--darkmode-rgb-100), 0.6);
    }

    .popup-item {
        // :not(.static) is a belt-and-suspenders guard on top of the
        // pointer-events:none above — hover effects must never engage on
        // the non-interactive collapsed/mid-animation items.
        &:not(.static):hover {
            z-index: 1;

            :deep(.bookmark-edit) {
                visibility: visible;
                z-index: 2;
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
                box-shadow: 0 0 25px 0 rgba(0, 0, 0, 0.15);
            }
        }

        &.drag-active {
            :deep(.bookmark-edit) {
                visibility: hidden;
            }

            .group-grid-link {
                &:hover :deep(.bookmark-image-container),
                &:active :deep(.bookmark-image-container) {
                    transform: none;
                    box-shadow: none;
                }
            }

            &:hover .group-grid-link :deep(.bookmark-image-container) {
                transform: none;
                box-shadow: none;
            }
        }
    }

    :deep(.bookmark-image-container) {
        height: 100%;
        width: 100%;
        padding: 8%;
    }
</style>
