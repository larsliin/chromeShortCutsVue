import UiFolder from '@/models/Folder';

export const FOLDER = Object.freeze({
    ROOT: new UiFolder(
        'My Shortcuts Tab',
        'root',
        'bookmarks-bar',
    ),
});

export enum EMITS {
    BOOKMARK_ADD = 'bookmarkAdd',
    BOOKMARKS_IMPORT = 'bookmarksImport',
    BOOKMARKS_UPDATED = 'bookmarksUpdated',
    OPEN_COLOR_EDITOR = 'openColorEditor',
    CLEAR_COLOR = 'clearColor',
    CANCEL = 'cancel',
    CHANGED = 'changed',
    CLEARBIT_ERROR = 'clearbitError',
    CLICK_BACKGROUND = 'clickBackground',
    CLOSE = 'close',
    CONFIRM = 'confirm',
    BEFORE_DELETE = 'beforeDelete',
    DELETE = 'delete',
    DELETE_ALL = 'deleteAll',
    DRAG_START = 'dragStart',
    DRAG_OUT_OF_GROUP = 'dragOutOfGroup',
    EDIT = 'edit',
    FILTER_UPDATED = 'filterUpdated',
    ICON_UPDATE = 'iconUpdate',
    UPDATE = 'update',
    IMAGES_IMPORT = 'imagesImport',
    POPUP_DRAG_END = 'popupDragEnd',
    RENAME = 'rename',
    SAVE = 'save',
    TOGGLE = 'toggle',
}

// Payload types for EMITS.BOOKMARKS_UPDATED.
export enum ARGS {
    COLOR = 'color',
    CREATED = 'created',
    IMPORT = 'import',
    MOVED = 'moved',
    REMOVED = 'removed',
    UPDATED = 'update',
}

export enum FILE_NAMES {
    BOOKMARKS_EXPORT = 'my-shortcuts-tab-bookmarks-exported',
    BOOKMARK_ICONS_EXPORT = 'my-shortcuts-tab-icons-exported',
}

export const LOGO_GENERATOR = Object.freeze({
    LOGO_GENERATOR_DOMAIN: 'https://img.logo.dev',
    LOGO_GENERATOR_TOKEN: 'pk_PdnB3t3aTiqenIQ-fVCWpA',
});

export const TIMEOUTS = Object.freeze({
    DIALOG_CLOSE_MS: 1000,
    FILTER_DEBOUNCE_MS: 150,
    FILTER_TRANSITION_RESET_MS: 500,
});

export const STORAGE_KEYS = Object.freeze({
    GROUP_IDS: 'groupIds',
    FOLDER_COLORS: 'folderColors',
    BOOKMARK_COLORS: 'bookmarkColors',
    ACCORDION: 'accordion',
    STATISTICS: 'statistics',
    DARK_MODE: 'darkMode',
    SYSTEM_DARK_MODE: 'systemDarkMode',
    ICON_SIZE: 'iconSize',
});

export const GROUPING = Object.freeze({
    // Legacy prefix for older group folders.
    // Kept for migration and legacy import fallback.
    LEGACY_FOLDER_PREFIX: '__mst_group__:',
    DEFAULT_NAME: 'Group',
    MAX_ITEMS: 9,
    PREVIEW_ITEMS: 9,
    MAX_NESTED_LEVEL: 1,
    // Depth offset for the root and top-level bookmarks bar.
    // Used when calculating the max allowed nesting depth.
    ROOT_DEPTH_OFFSET: 2,
    // Border radii applied to the group card thumbnail per icon size.
    // Mirror the SCSS values in BookmarkGroupCard.vue.
    RADIUS_SMALL: '5.36%',
    RADIUS_MEDIUM: '11.11%',
    RADIUS_LARGE: '12.96%',
    POPUP_OVERLAY_BLUR: '6px',
    FOCUSABLE_SELECTOR: 'a[href], button, [tabindex]:not([tabindex="-1"])',
});

export enum ICON_SIZE {
    SMALL = 'small',
    MEDIUM = 'medium',
    LARGE = 'large',
}
