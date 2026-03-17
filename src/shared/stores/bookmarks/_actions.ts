/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BookmarkNode } from '@/types/bookmark';

export default {
    async get_bookmarks(this: any, id: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.getSubTree(id, (event) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                resolve(event);
            });
        });
    },

    async get_colorizedBookmarks(this: any, id: string): Promise<BookmarkNode[]> {
        const [response1, response2, response3]: any[] = await Promise.all([
            this.get_bookmarks(id),
            this.get_syncStorage('folderColors'),
            this.get_syncStorage('bookmarkColors'),
        ]);

        const returnObj = [...response1];

        if (response2) {
            Object.entries(response2).forEach((item) => {
                const bookmarkFolder = returnObj[0].children
                    .find((e: any) => e.id === item[0]);
                if (bookmarkFolder) {
                    const [, bookmarkFolderColor] = item;
                    bookmarkFolder.color = bookmarkFolderColor;
                }
            });
        }
        if (response3) {
            Object.entries(response3).forEach((item) => {
                const bookmarksFlatArr = returnObj[0].children
                    .flatMap((obj: any) => obj.children);
                const bookmark = bookmarksFlatArr
                    .find((e: any) => e.id === item[0]);
                if (bookmark) {
                    const [, bookmarkColor] = item;
                    (bookmark as any).color = bookmarkColor;
                }
            });
        }

        return returnObj;
    },

    async get_bookmarkById(this: any, id: string): Promise<chrome.bookmarks.BookmarkTreeNode> {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.get(id, (event) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                if (event && event.length > 0) {
                    resolve(event[0]);
                } else {
                    reject(new Error('Bookmark not found'));
                }
            });
        });
    },

    searchFolder(
        this: any,
        bookmarkTreeNodes: chrome.bookmarks.BookmarkTreeNode[],
        folderName: string,
    ): chrome.bookmarks.BookmarkTreeNode | false {
        // eslint-disable-next-line no-restricted-syntax
        for (const node of bookmarkTreeNodes) {
            if (node.title === folderName && node.children) {
                return node;
            }
            if (node.children) {
                const result = this.searchFolder(node.children, folderName);
                if (result) {
                    return result;
                }
            }
        }
        return false;
    },

    async get_folderByTitle(
        this: any,
        parentFolderId: string,
        title: string,
    ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.getSubTree(parentFolderId, (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                const bookmarkTreeNodes = result[0].children ?? [];
                const folder = this.searchFolder(bookmarkTreeNodes, title);
                const folderResult = folder ? [folder] : [];
                resolve(folderResult);
            });
        });
    },

    async create_bookmark(
        this: any,
        parentId: string,
        title: string,
        url?: string,
    ): Promise<chrome.bookmarks.BookmarkTreeNode> {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.create(
                { parentId: parentId.toString(), title, url },
                (bookmark) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    resolve(bookmark);
                },
            );
        });
    },

    async update_bookmark(
        this: any,
        id: string,
        data: { title?: string; url?: string },
    ): Promise<chrome.bookmarks.BookmarkTreeNode> {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.update(
                id,
                { title: data.title, url: data.url },
                (bookmark) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    resolve(bookmark);
                },
            );
        });
    },

    async move_bookmark(
        this: any,
        id: string,
        targetId: { parentId?: string; index?: number },
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.move(id, targetId, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                resolve();
            });
        });
    },

    async reorder_bookmark(this: any, id: string, index: number): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.move(id, { index }, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                resolve();
            });
        });
    },

    async remove_bookmark(this: any, id: string): Promise<string> {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.remove(id, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                resolve(id);
            });
        });
    },

    async remove_bookmarkFolder(this: any, id: string): Promise<string> {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.removeTree(id, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                resolve(id);
            });
        });
    },

    async get_tree(this: any): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.getTree((event) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                resolve(event);
            });
        });
    },

    async set_localStorage(this: any, storageObj: Record<string, unknown>): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.set(storageObj).then((event) => {
                    resolve(event);
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    async get_localStorage(this: any, id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.get(id.toString()).then((event) => {
                    resolve(event[id]);
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    async set_syncStorage(this: any, storageObj: Record<string, unknown>): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.set(storageObj).then((event) => {
                    resolve(event);
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    async get_syncStorage(this: any, id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get(id.toString()).then((event) => {
                    resolve(event[id]);
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    async get_localStorageAll(this: any): Promise<Record<string, unknown>> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.get(null).then((event) => {
                    resolve(event);
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    async delete_localStorageItem(this: any, id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.remove([id], () => {
                    const error = chrome.runtime.lastError;
                    if (error) {
                        throw (error);
                    }
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    async delete_syncStorageItem(this: any, id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.remove([id], () => {
                    const error = chrome.runtime.lastError;
                    if (error) {
                        throw (error);
                    }
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    async toBase64(this: any, file: File): Promise<string | ArrayBuffer | null> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
        });
    },

    setBookmarksBarId(this: any, id: string): void {
        this.bookmarksBarId = id;
    },
};
