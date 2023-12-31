import UiFolder from './models/Folder';

export const FOLDER = Object.freeze({
    ROOT: new UiFolder(
        'MyShortcuts',
        'root',
        '2',
    ),
    HOME: new UiFolder(
        'Home',
        'home',
    ),
});

export const EMITS = Object.freeze({
    BOOKMARK_ADD: 'bookmarkAdd',
    BOOKMARK_CREATED: 'bookmarkCreated',
    BOOKMARKS_IMPORT: 'bookmarksImport',
    BOOKMARKS_UPDATED: 'bookmarksUpdated',
    OPEN_COLOR_EDITOR: 'openColorEditor',
    CANCEL: 'cancel',
    CHANGED: 'changed',
    CLEARBIT_ERROR: 'clearbitError',
    CLICK_BACKGROUND: 'clickBackground',
    CLOSE: 'close',
    CONFIRM: 'confirm',
    BEFORE_DELETE: 'beforeDelete',
    DELETE: 'delete',
    DRAG_START: 'dragStart',
    EDIT: 'edit',
    FILTER_UPDATED: 'filterUpdated',
    ICON_UPDATE: 'iconUpdate',
    UPDATE: 'update',
    IMAGES_IMPORT: 'imagesImport',
    RENAME: 'rename',
    SAVE: 'save',
    TOGGLE: 'toggle',
});

export const ARGS = Object.freeze({
    CREATED: 'created',
});
