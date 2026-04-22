import mitt from 'mitt';
import { EMITS } from '@/constants';

export type AppEventMap = {
    [EMITS.BOOKMARK_ADD]: string;
    [EMITS.BOOKMARKS_IMPORT]: void;
    [EMITS.BOOKMARKS_UPDATED]: { type: string; id: string; children?: string[] };
    [EMITS.CHANGED]: string;
    [EMITS.CLICK_BACKGROUND]: void;
    [EMITS.DRAG_START]: void;
    [EMITS.EDIT]: string;
    [EMITS.FILTER_UPDATED]: string;
    [EMITS.ICON_UPDATE]: string;
    [EMITS.IMAGES_IMPORT]: void;
};

// Single shared event bus instance for the entire app.
// Emit: emitter.emit(EMITS.XXX, payload)
// Subscribe: emitter.on(EMITS.XXX, handler)  — call in onMounted
// Unsubscribe: emitter.off(EMITS.XXX, handler) — call in onUnmounted
const emitter = mitt<AppEventMap>();

export default emitter;
