
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
