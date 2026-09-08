// Owns the expanded group popup: open/close animation, centered position
// calculation, focus trap, and dragging a bookmark out of the group.
import {
    computed, nextTick, onMounted, onUnmounted, ref,
} from 'vue';
import type { BookmarkNode } from '@/types/bookmark';
import { GROUPING, EMITS } from '@/constants';
import { useBookmarksStore } from '@stores/bookmarks';
import emitter from '@cmp/eventBus';
import { findNodeById } from '@utils/bookmarkGroups';

export function useGroupPopup() {
    const bookmarksStore = useBookmarksStore();

    const showGroupPopup = ref(false);
    const popupState = ref<'opening' | 'open' | 'closing'>('opening');
    const activeGroupId = ref('');
    const popupOrigin = ref<{ left: number; top: number; width: number; height: number } | null>(null);
    const popupFallbackSize = 360;
    const popupAnimationMs = 280;
    const popupDragging = ref(false);
    // Tracked in JS (instead of vw/vh) so the popup's centered position can be
    // rounded to a whole pixel — translate(-50%) of a fractional box blurs text.
    const viewportWidth = ref(window.innerWidth);
    const viewportHeight = ref(window.innerHeight);

    const popupOverlayRef = ref<HTMLElement | null>(null);
    const popupReturnFocusEl = ref<HTMLElement | null>(null);
    const closePopupTimeoutId = ref<number | null>(null);
    // Only animate while the popup is actually opening/closing — disabling the
    // transition once settled keeps window resizes from sliding the popup.
    const popupTransitioning = ref(true);
    const popupTransitionTimeoutId = ref<number | null>(null);

    const activeGroup = computed(() => (
        activeGroupId.value
            ? findNodeById(bookmarksStore.bookmarks ?? [], activeGroupId.value)
            : null
    ));

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

    // Mirrors the .group-popup-overlay media query breakpoints (960px/1440px).
    function getPopupTargetSize(width: number): number {
        if (width >= 1440) {
            return 500;
        }
        if (width >= 960) {
            return 435;
        }
        return 375;
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

    const popupStyle = computed(() => {
        const origin = popupOrigin.value;
        const isOpen = popupState.value === 'open';
        const inlineRadius = getInlineGroupRadius();
        const expandedRadius = '8%';

        // Compute the top-left corner directly, all rounded to whole pixels.
        // This replaces left/top-at-center + transform: translate(-50%, -50%),
        // which blurred text whenever the box's runtime size was fractional.
        let left: number;
        let top: number;
        let width: number;
        let height: number;

        if (isOpen) {
            const maxWidth = viewportWidth.value - 32;
            const maxHeight = viewportHeight.value - 32;
            const size = Math.round(Math.min(getPopupTargetSize(viewportWidth.value), maxWidth, maxHeight));
            width = size;
            height = size;
            left = Math.round((viewportWidth.value - size) / 2);
            top = Math.round((viewportHeight.value - size) / 2);
        } else {
            width = Math.round(origin?.width ?? popupFallbackSize);
            height = Math.round(origin?.height ?? popupFallbackSize);
            left = Math.round((origin?.left ?? popupFallbackSize / 2) - (width / 2));
            top = Math.round((origin?.top ?? popupFallbackSize / 2) - (height / 2));
        }

        return {
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
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
        viewportWidth.value = window.innerWidth;
        viewportHeight.value = window.innerHeight;
        syncPopupOriginWithActiveGroup();
    }

    function onOverlayEscape(): void {
        if (popupDragging.value) {
            return;
        }

        closeGroupPopup();
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

    function setPopupOverlayEl(el: HTMLElement | null): void {
        popupOverlayRef.value = el;
    }

    function setPopupDragging(value: boolean): void {
        popupDragging.value = value;
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

    function handlePopupDragOutOfGroup(payload: {
        bookmarkId: string;
        groupId: string;
        groupParentId: string;
    }): void {
        onPopupDragOutOfGroup(payload);
    }

    function shouldHidePopupOrigin(groupId: string): boolean {
        return showGroupPopup.value && activeGroupId.value === groupId;
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

    return {
        showGroupPopup,
        popupState,
        activeGroupId,
        activeGroup,
        popupDragging,
        popupTransitioning,
        popupOverlayRef,
        popupStyle,
        popupOverlayStyle,
        onOpenGroup,
        closeGroupPopup,
        onOverlayEscape,
        onOverlayTab,
        onOverlayClickSelf,
        handlePopupDragOutOfGroup,
        shouldHidePopupOrigin,
        setPopupOverlayEl,
        setPopupDragging,
    };
}
