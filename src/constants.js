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
    BOOKMARK_CREATED: 'bookmarkCreated',
    BOOKMARKS_UPDATED: 'bookmarksUpdated',
    CANCEL: 'cancel',
    CHANGED: 'changed',
    CLEARBIT_ERROR: 'clearbitError',
    CLOSE: 'close',
    CONFIRM: 'confirm',
    DELETE: 'delete',
    EDIT: 'edit',
    ICON_UPDATE: 'iconUpdate',
    IMAGES_IMPORT: 'imagesImport',
    BOOKMARKS_IMPORT: 'bookmarksImport',
    RENAME: 'rename',
    SAVE: 'save',
});

export const ARGS = Object.freeze({
    CREATED: 'created',
});
