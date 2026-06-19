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

export enum ARGS {
    CREATED = 'created',
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
});

export const STORAGE_KEYS = Object.freeze({
    GROUP_IDS: 'groupIds',
    FOLDER_COLORS: 'folderColors',
    BOOKMARK_COLORS: 'bookmarkColors',
    ACCORDION: 'accordion',
});

export const GROUPING = Object.freeze({
    // Legacy prefix used by older versions to identify group folders by their
    // Chrome bookmark title. Kept only for one-time migration of pre-existing
    // groups and as a fallback when importing legacy export files. Runtime
    // group identification now uses the STORAGE_KEYS.GROUP_IDS sync map.
    LEGACY_FOLDER_PREFIX: '__mst_group__:',
    DEFAULT_NAME: 'Group',
    MAX_ITEMS: 9,
    PREVIEW_COLUMNS: 3,
    PREVIEW_ITEMS: 9,
    MAX_NESTED_LEVEL: 1,
    // Depth offset for the root + top-level bookmarks-bar folder when
    // measuring a node's depth via findDepth. Added to MAX_NESTED_LEVEL
    // to derive the maximum allowed depth value.
    ROOT_DEPTH_OFFSET: 2,
    // Border radii applied to the group card thumbnail per icon size.
    // Mirror the SCSS values in BookmarkGroupCard.vue.
    RADIUS_SMALL: '5.36%',
    RADIUS_MEDIUM: '11.11%',
    RADIUS_LARGE: '12.96%',
});

export enum ICON_SIZE {
    SMALL = 'small',
    MEDIUM = 'medium',
    LARGE = 'large',
}
