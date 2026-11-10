// Pure Chrome API wrappers with no store dependency.
// Each helper wraps one API call and checks lastError.

// ─── Bookmarks ────────────────────────────────────────────────────────────────

// Wraps a callback-style Chrome API call and rejects on chrome.runtime.lastError.
function callChrome<T>(invoke: (callback: (result: T) => void) => void): Promise<T> {
    return new Promise((resolve, reject) => {
        invoke((result) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve(result);
        });
    });
}

export function getBookmarkSubTree(
    id: string,
): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    return callChrome((callback) => chrome.bookmarks.getSubTree(id, callback));
}

export function getBookmarkById(
    id: string,
): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return callChrome<chrome.bookmarks.BookmarkTreeNode[]>(
        (callback) => chrome.bookmarks.get(id, callback),
    ).then((result) => {
        if (!result?.length) {
            throw new Error('Bookmark not found');
        }
        return result[0];
    });
}

export function getBookmarkByIdOrNull(
    id: string,
): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
    return getBookmarkById(id).catch(() => null);
}

export function getBookmarkTree(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    return callChrome((callback) => chrome.bookmarks.getTree(callback));
}

export function createBookmark(
    parentId: string,
    title: string,
    url?: string,
    index?: number,
): Promise<chrome.bookmarks.BookmarkTreeNode> {
    const bookmarkData: chrome.bookmarks.CreateDetails = { parentId, title, url };

    if (index !== undefined) {
        bookmarkData.index = index;
    }

    return callChrome((callback) => chrome.bookmarks.create(bookmarkData, callback));
}

export function updateBookmark(
    id: string,
    data: { title?: string; url?: string },
): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return callChrome((callback) => chrome.bookmarks.update(
        id,
        { title: data.title, url: data.url },
        callback,
    ));
}

export function moveBookmark(
    id: string,
    destination: { parentId?: string; index?: number },
): Promise<void> {
    return callChrome<unknown>((callback) => chrome.bookmarks.move(id, destination, callback))
        .then(() => undefined);
}

export async function removeBookmark(id: string): Promise<string> {
    await callChrome<void>((callback) => chrome.bookmarks.remove(id, callback));
    return id;
}

export async function removeBookmarkTree(id: string): Promise<string> {
    await callChrome<void>((callback) => chrome.bookmarks.removeTree(id, callback));
    return id;
}

// ─── Storage: Local ──────────────────────────────────────────────────────────

export function setLocalStorage(storageObj: Record<string, unknown>): Promise<void> {
    return chrome.storage.local.set(storageObj);
}

export function getLocalStorage(key: string): Promise<unknown> {
    return chrome.storage.local.get(key).then((result) => result[key]);
}

export function getAllLocalStorage(): Promise<Record<string, unknown>> {
    return chrome.storage.local.get(null);
}

export function deleteLocalStorageItem(id: string): Promise<void> {
    return callChrome<void>((callback) => chrome.storage.local.remove([id], callback));
}

// ─── Storage: Sync ───────────────────────────────────────────────────────────

export function setSyncStorage(storageObj: Record<string, unknown>): Promise<void> {
    return chrome.storage.sync.set(storageObj);
}

export function getSyncStorage(key: string): Promise<unknown> {
    return chrome.storage.sync.get(key).then((result) => result[key]);
}

export function deleteSyncStorageItem(id: string): Promise<void> {
    return callChrome<void>((callback) => chrome.storage.sync.remove([id], callback));
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
