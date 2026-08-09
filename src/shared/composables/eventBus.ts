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

// Shared event bus for the app.
// Use it for cross-component notifications and cleanup.
const emitter = mitt<AppEventMap>();

export default emitter;
