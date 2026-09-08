<template>
    <Teleport to="body"
        v-if="popup.showGroupPopup.value && popup.activeGroup.value">
        <div
            :ref="setOverlayRef"
            class="group-popup-overlay"
            :style="popup.popupOverlayStyle.value"
            role="dialog"
            tabindex="-1"
            aria-modal="true"
            @keydown.esc="popup.onOverlayEscape()"
            @keydown.tab="popup.onOverlayTab($event)"
            @mousedown.self="popup.onOverlayClickSelf()">
            <div
                class="group-popup-wrapper"
                :class="[popup.popupState.value, { 'popup-transition': popup.popupTransitioning.value }]"
                :style="popup.popupStyle.value">
                <BookmarkGroupCard
                    class="group-popup-card"
                    :bookmark="popup.activeGroup.value"
                    popup
                    :expanded="popup.popupState.value === 'open'"
                    @close="popup.closeGroupPopup()"
                    @[EMITS.DRAG_START]="onPopupDragStart"
                    @[EMITS.POPUP_DRAG_END]="onPopupDragEnd"
                    @[EMITS.DRAG_OUT_OF_GROUP]="popup.handlePopupDragOutOfGroup" />
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
    import type { ComponentPublicInstance } from 'vue';
    import { EMITS } from '@/constants';
    import BookmarkGroupCard from '@/components/bookmarks/sharedComponents/BookmarkGroupCard.vue';
    import type { useGroupPopup } from '@cmp/useGroupPopup';

    interface Props {
        popup: ReturnType<typeof useGroupPopup>;
    }

    const props = defineProps<Props>();

    function setOverlayRef(el: Element | ComponentPublicInstance | null): void {
        props.popup.setPopupOverlayEl(el instanceof HTMLElement ? el : null);
    }

    function onPopupDragStart(): void {
        props.popup.setPopupDragging(true);
    }

    function onPopupDragEnd(): void {
        props.popup.setPopupDragging(false);
    }
</script>

<style scoped lang="scss">
    .group-popup-overlay {
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
            --popup-overlay-blur-target: 4.5px;
        }
    }
    @media (min-width: 1440px) {
        .group-popup-overlay {
            --popup-overlay-blur-target: 3.5px;
        }
    }

    .group-popup-wrapper {
        position: fixed;
        backface-visibility: hidden;
        will-change: left, top, width, height, border-radius, box-shadow, opacity;
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
