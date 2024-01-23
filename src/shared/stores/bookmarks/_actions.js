export default {
    async get_bookmarks(id) {
        return new Promise((resolve, reject) => {
            try {
                // eslint-disable-next-line no-undef
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

    async get_coloredBookmarks(id) {
        return new Promise((resolve, reject) => {
            try {
                const promiseArr = [];

                promiseArr.push(this.get_bookmarks(id));
                promiseArr.push(this.get_syncStorage('folderColors'));
                promiseArr.push(this.get_syncStorage('bookmarkColors'));

                Promise.all(promiseArr)
                    .then(([response1, response2, response3]) => {
                        const returnObj = [...response1];

                        if (response2) {
                            Object.entries(response2).forEach((item) => {
                                const bookmarkFolder = returnObj[0].children
                                    .find((e) => e.id === item[0]);
                                if (bookmarkFolder) {
                                    const [, bookmarkFolderColor] = item;
                                    bookmarkFolder.color = bookmarkFolderColor;
                                }
                            });
                        }
                        if (response3) {
                            Object.entries(response3).forEach((item) => {
                                const bookmarksFlatArr = returnObj[0].children
                                    .flatMap((obj) => obj.children);
                                const bookmark = bookmarksFlatArr
                                    .find((e) => e.id === item[0]);
                                if (bookmark) {
                                    const [, bookmarkColor] = item;
                                    bookmark.color = bookmarkColor;
                                }
                            });
                        }
                        resolve(returnObj);
                    })
                    .catch((error) => {
                        console.error(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    },
    async get_bookmarkById(id) {
        return new Promise((resolve, reject) => {
            try {
                // eslint-disable-next-line no-undef
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

    searchFolder(bookmarkTreeNodes, folderName) {
        const t = this;
        // eslint-disable-next-line no-restricted-syntax
        for (const node of bookmarkTreeNodes) {
            if (node.title === folderName && node.children) {
                return node;
            }
            if (node.children) {
                const result = t.searchFolder(node.children, folderName);
                if (result) {
                    return result;
                }
            }
        }
        return false;
    },

    async get_folderByTitle(parentFolderId, title) {
        const t = this;
        return new Promise((resolve, reject) => {
            try {
                // eslint-disable-next-line no-undef
                chrome.bookmarks.getSubTree(parentFolderId, (result) => {
                    const bookmarkTreeNodes = result[0].children;
                    const folder = t.searchFolder(bookmarkTreeNodes, title);
                    const folderResult = folder ? [folder] : [];
                    resolve(folderResult);
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    async create_bookmark(parentId, title, url) {
        return new Promise((resolve, reject) => {
            try {
                // eslint-disable-next-line no-undef
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

    async update_bookmark(id, data) {
        return new Promise((resolve, reject) => {
            try {
                // eslint-disable-next-line no-undef
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

    async move_bookmark(id, targetId) {
        return new Promise((resolve, reject) => {
            try {
                // eslint-disable-next-line no-undef
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

    async reorder_bookmark(id, index) {
        return new Promise((resolve, reject) => {
            try {
                // eslint-disable-next-line no-undef
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

    async remove_bookmark(id) {
        return new Promise((resolve, reject) => {
            try {
                // eslint-disable-next-line no-undef
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

    async remove_bookmarkFolder(id) {
        return new Promise((resolve, reject) => {
            try {
                // eslint-disable-next-line no-undef
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

    async set_localStorage(storageObj) {
        return new Promise((resolve, reject) => {
            try {
                // eslint-disable-next-line no-undef
                chrome.storage.local.set(storageObj).then((event) => {
                    resolve(event);
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    async get_localStorage(id) {
        return new Promise((resolve, reject) => {
            try {
                // eslint-disable-next-line no-undef
                chrome.storage.local.get(id.toString()).then((event) => {
                    resolve(event[id]);
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    async set_syncStorage(storageObj) {
        return new Promise((resolve, reject) => {
            try {
                // eslint-disable-next-line no-undef
                chrome.storage.sync.set(storageObj).then((event) => {
                    resolve(event);
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    async get_syncStorage(id) {
        return new Promise((resolve, reject) => {
            try {
                // eslint-disable-next-line no-undef
                chrome.storage.sync.get(id.toString()).then((event) => {
                    resolve(event[id]);
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    async get_localStorageAll() {
        return new Promise((resolve, reject) => {
            try {
                // eslint-disable-next-line no-undef
                chrome.storage.local.get(null).then((event) => {
                    resolve(event);
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    async delete_localStorageItem(id) {
        return new Promise((resolve, reject) => {
            try {
                // eslint-disable-next-line no-undef
                chrome.storage.local.remove([id], () => {
                    // eslint-disable-next-line no-undef
                    const error = chrome.runtime.lastError;
                    if (error) {
                        console.error(error);
                    }
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    async delete_syncStorageItem(id) {
        return new Promise((resolve, reject) => {
            try {
                // eslint-disable-next-line no-undef
                chrome.storage.sync.remove([id], () => {
                    // eslint-disable-next-line no-undef
                    const error = chrome.runtime.lastError;
                    if (error) {
                        console.error(error);
                    }
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    async toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
        });
    },
};
