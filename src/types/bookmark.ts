import type { VIcon } from 'vuetify/components';
import type { EMITS } from '@/constants';

export interface BookmarkNode extends chrome.bookmarks.BookmarkTreeNode {
    color?: string;
    image?: string | null;
    children?: BookmarkNode[];
    // Mark folders as groups so the importer can register them without the legacy prefix.
    isGroup?: boolean;
}

export interface BookmarkStat {
    clicks: number;
    id: string[];
    title: string;
    timestamp: number;
    url: string;
}

export interface FoldoutListItem {
    title: string;
    icon: InstanceType<typeof VIcon>['$props']['icon'];
    event: EMITS.DELETE
    | EMITS.DELETE_ALL
    | EMITS.RENAME
    | EMITS.OPEN_COLOR_EDITOR
    | EMITS.EDIT
    | EMITS.BOOKMARK_ADD;
}

export interface BookmarkFormData {
    id?: string;
    title?: string;
    url?: string;
    parentId?: string;
    image?: string | null;
}

export interface FolderColorItem {
    id: string;
    color: string;
    title: string;
}

export interface DragEventInfo {
    newIndex: number;
    oldIndex: number;
}

export interface ImportFileData {
    type: string;
    bookmarks?: BookmarkNode[];
    folders?: FolderColorItem[];
}
