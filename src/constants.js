import { UiFolder } from './models/Folder';

export const FOLDER = Object.freeze({
    ROOT: new UiFolder(
        'MyShortcuts',
        'root',
    ),
    HOME: new UiFolder(
        'Home',
        'home',
    ),
});

export const EMITS = Object.freeze({
    CLOSE: 'close',
    SAVE: 'save',
    EDIT: 'edit',
    CHANGED: 'changed',
    IMAGES_IMPORT: 'imagesImport',
    ICON_UPDATE: 'iconUpdate',
});
