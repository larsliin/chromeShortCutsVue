export interface BookmarkNode extends chrome.bookmarks.BookmarkTreeNode {
    color?: string;
    image?: string | null;
    children?: BookmarkNode[];
    // Set by the exporter to mark a folder as a bookmark group so the importer
    // can register the newly created folder ID in the groupIds map without
    // relying on the legacy title prefix.
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
    icon: string;
    event: string;
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
