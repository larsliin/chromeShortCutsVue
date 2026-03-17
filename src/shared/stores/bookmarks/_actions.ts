/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BookmarkNode } from '@/types/bookmark';

export default {
    async get_bookmarks(this: any, id: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
        return new Promise((resolve, reject) => {
            try {
                chrome.bookmarks.getSubTree(
                    id,
                    (event) => {
                        resolve(event);
                    },
                );
            } catch (error) {
                reject(error);
            }
        });
    },

    async get_colorizedBookmarks(this: any, id: string): Promise<BookmarkNode[]> {
        return new Promise((resolve, reject) => {
            try {
                const promiseArr = [];
                promiseArr.push(this.get_bookmarks(id));
                promiseArr.push(this.get_syncStorage('folderColors'));
                promiseArr.push(this.get_syncStorage('bookmarkColors'));

                Promise.all(promiseArr)
                    .then((responses: any[]) => {
                        const [response1, response2, response3] = responses;
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
                        resolve(returnObj);
                    })
                    .catch((error) => {
                        throw (error);
                    });
            } catch (error) {
                reject(error);
            }
        });
    },

    async get_bookmarkById(this: any, id: string): Promise<chrome.bookmarks.BookmarkTreeNode> {
        return new Promise((resolve, reject) => {
            try {
                chrome.bookmarks.get(id, (event) => {
                    if (event && event.length > 0) {
                        resolve(event[0]);
                    } else {
                        reject(new Error('Bookmark not found'));
                    }
                });
            } catch (error) {
                reject(error);
            }
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
            try {
                chrome.bookmarks.getSubTree(parentFolderId, (result) => {
                    const bookmarkTreeNodes = result[0].children ?? [];
                    const folder = this.searchFolder(bookmarkTreeNodes, title);
                    const folderResult = folder ? [folder] : [];
                    resolve(folderResult);
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    async create_bookmark(
        this: any,
        parentId: string,
        title: string,
        url?: string,
    ): Promise<chrome.bookmarks.BookmarkTreeNode> {
        return new Promise((resolve, reject) => {
            try {
                chrome.bookmarks.create(
                    { parentId: parentId.toString(), title, url },
                    (bookmark) => {
                        resolve(bookmark);
                    },
                );
            } catch (error) {
                reject(error);
            }
        });
    },

    async update_bookmark(
        this: any,
        id: string,
        data: { title?: string; url?: string },
    ): Promise<chrome.bookmarks.BookmarkTreeNode> {
        return new Promise((resolve, reject) => {
            try {
                chrome.bookmarks.update(
                    id,
                    {
                        title: data.title,
                        url: data.url,
                    },
                    (bookmark) => {
                        resolve(bookmark);
                    },
                );
            } catch (error) {
                reject(error);
            }
        });
    },

    async move_bookmark(
        this: any,
        id: string,
        targetId: { parentId?: string; index?: number },
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                chrome.bookmarks.move(
                    id,
                    targetId,
                    () => {
                        resolve();
                    },
                );
            } catch (error) {
                reject(error);
            }
        });
    },

    async reorder_bookmark(this: any, id: string, index: number): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                chrome.bookmarks.move(
                    id,
                    { index },
                    () => {
                        resolve();
                    },
                );
            } catch (error) {
                reject(error);
            }
        });
    },

    async remove_bookmark(this: any, id: string): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                chrome.bookmarks.remove(
                    id,
                    () => {
                        resolve(id);
                    },
                );
            } catch (error) {
                reject(error);
            }
        });
    },

    async remove_bookmarkFolder(this: any, id: string): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                chrome.bookmarks.removeTree(
                    id,
                    () => {
                        resolve(id);
                    },
                );
            } catch (error) {
                reject(error);
            }
        });
    },

    async get_tree(this: any): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
        return new Promise((resolve, reject) => {
            try {
                chrome.bookmarks.getTree((event) => {
                    resolve(event);
                });
            } catch (error) {
                reject(error);
            }
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
