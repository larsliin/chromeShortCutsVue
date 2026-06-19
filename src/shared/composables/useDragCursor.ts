// Centralised drag-cursor + pointermove/click bookkeeping so components
// never leak the body class or document listeners if they unmount mid-drag.
import { onUnmounted } from 'vue';

type PointerHandler = (event: PointerEvent) => void;
type ClickHandler = (event: MouseEvent) => void;

const DRAG_CURSOR_CLASS = 'cursor-pointer';

export function useDragCursor() {
    let pointerHandler: PointerHandler | null = null;
    let active = false;

    function start(handler?: PointerHandler): void {
        document.body.classList.add(DRAG_CURSOR_CLASS);
        active = true;

        if (handler) {
            pointerHandler = handler;
            document.addEventListener('pointermove', pointerHandler, true);
        }
    }

    function stop(): void {
        document.body.classList.remove(DRAG_CURSOR_CLASS);
        active = false;

        if (pointerHandler) {
            document.removeEventListener('pointermove', pointerHandler, true);
            pointerHandler = null;
        }
    }

    // Attach a capture-phase click swallower scoped to elements that match
    // `matches`. Auto-removes after `durationMs` or on the first matching
    // click — whichever comes first.
    function swallowClicksFor(matches: (target: EventTarget | null) => boolean, durationMs: number): void {
        let timeoutId = 0;

        const handler: ClickHandler = (event) => {
            if (!matches(event.target)) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            document.removeEventListener('click', handler, true);
            window.clearTimeout(timeoutId);
        };

        document.addEventListener('click', handler, true);

        timeoutId = window.setTimeout(() => {
            document.removeEventListener('click', handler, true);
        }, durationMs);
    }

    onUnmounted(() => {
        if (active) {
            stop();
        }
    });

    return { start, stop, swallowClicksFor };
}
