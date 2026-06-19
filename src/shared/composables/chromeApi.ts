// Pure Chrome API wrappers — no store state dependencies.
// Each function wraps exactly one Chrome API call, checks lastError,
// and returns a Promise. Import with: import * as chromeApi from '@cmp/chromeApi'

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export function getBookmarkSubTree(
    id: string,
): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    return new Promise((resolve, reject) => {
        chrome.bookmarks.getSubTree(id, (result) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve(result);
        });
    });
}

export function getBookmarkById(
    id: string,
): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return new Promise((resolve, reject) => {
        chrome.bookmarks.get(id, (result) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            if (result && result.length > 0) {
                resolve(result[0]);
            } else {
                reject(new Error('Bookmark not found'));
            }
        });
    });
}

export function getBookmarkByIdOrNull(
    id: string,
): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
    return new Promise((resolve) => {
        chrome.bookmarks.get(id, (result) => {
            if (chrome.runtime.lastError) {
                resolve(null);
                return;
            }
            resolve(result && result.length > 0 ? result[0] : null);
        });
    });
}

export function getBookmarkTree(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    return new Promise((resolve, reject) => {
        chrome.bookmarks.getTree((result) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve(result);
        });
    });
}

export function createBookmark(
    parentId: string,
    title: string,
    url?: string,
    index?: number,
): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return new Promise((resolve, reject) => {
        const bookmarkData: chrome.bookmarks.CreateDetails = {
            parentId: parentId.toString(),
            title,
            url,
        };

        if (index !== undefined) {
            bookmarkData.index = index;
        }

        chrome.bookmarks.create(bookmarkData, (bookmark) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve(bookmark);
        });
    });
}

export function updateBookmark(
    id: string,
    data: { title?: string; url?: string },
): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return new Promise((resolve, reject) => {
        chrome.bookmarks.update(id, { title: data.title, url: data.url }, (bookmark) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve(bookmark);
        });
    });
}

export function moveBookmark(
    id: string,
    destination: { parentId?: string; index?: number },
): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.bookmarks.move(id, destination, () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve();
        });
    });
}

export function removeBookmark(id: string): Promise<string> {
    return new Promise((resolve, reject) => {
        chrome.bookmarks.remove(id, () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve(id);
        });
    });
}

export function removeBookmarkTree(id: string): Promise<string> {
    return new Promise((resolve, reject) => {
        chrome.bookmarks.removeTree(id, () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve(id);
        });
    });
}

// ─── Storage: Local ──────────────────────────────────────────────────────────

export function setLocalStorage(storageObj: Record<string, unknown>): Promise<void> {
    return chrome.storage.local.set(storageObj);
}

export function getLocalStorage(key: string): Promise<unknown> {
    return chrome.storage.local.get(key.toString()).then((result) => result[key]);
}

export function getAllLocalStorage(): Promise<Record<string, unknown>> {
    return chrome.storage.local.get(null);
}

export function deleteLocalStorageItem(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.storage.local.remove([id], () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve();
        });
    });
}

// ─── Storage: Sync ───────────────────────────────────────────────────────────

export function setSyncStorage(storageObj: Record<string, unknown>): Promise<void> {
    return chrome.storage.sync.set(storageObj);
}

export function getSyncStorage(key: string): Promise<unknown> {
    return chrome.storage.sync.get(key.toString()).then((result) => result[key]);
}

export function deleteSyncStorageItem(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.remove([id], () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve();
        });
    });
}

// ─── Pure Utilities ───────────────────────────────────────────────────────────

export function searchFolder(
    nodes: chrome.bookmarks.BookmarkTreeNode[],
    folderName: string,
): chrome.bookmarks.BookmarkTreeNode | false {
    return nodes.reduce<chrome.bookmarks.BookmarkTreeNode | false>((found, node) => {
        if (found) return found;
        if (node.title === folderName && node.children) return node;
        if (node.children) return searchFolder(node.children, folderName);
        return false;
    }, false);
}

export function toBase64(file: File): Promise<string | ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });
}
