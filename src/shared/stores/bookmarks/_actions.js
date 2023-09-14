export default {
    async get_bookmarks(id) {
        return new Promise((resolve, reject) => {
            try {
                chrome.bookmarks.getSubTree(
                    id,
                    (event) => {
                        resolve(event);
                    }
                );
            } catch (error) {
                reject(error);
            }
        });
    },

    async get_bookmarkById(id) {
        return new Promise((resolve, reject) => {
            try {
                chrome.bookmarks.get(id, (event) => {
                    resolve(event[0]);
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    searchFolder(bookmarkTreeNodes, folderName) {
        const t = this;
        for (let node of bookmarkTreeNodes) {
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
    },

    async get_folderByTitle(parentFolderId, title) {
        const t = this;
        return new Promise((resolve, reject) => {
            try {
                chrome.bookmarks.getSubTree(parentFolderId, function (result) {
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
                chrome.bookmarks.create(
                    { parentId: parentId.toString(), title, url },
                    (bookmark) => {
                        resolve(bookmark);
                    }
                );
            } catch (error) {
                reject(error);
            }
        });
    },

    async update_bookmark(id, data) {
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
                    }
                );
            } catch (error) {
                reject(error);
            }
        });
    },


    async move_bookmark(id, targetId) {
        return new Promise((resolve, reject) => {
            try {
                chrome.bookmarks.move(
                    id,
                    targetId,
                    () => {
                        resolve();
                    },
                )
            } catch (error) {
                reject(error);
            }
        });
    },



    async remove_bookmark(id) {
        return new Promise((resolve, reject) => {
            try {
                chrome.bookmarks.remove(
                    id,
                    (bookmark) => {
                        resolve(bookmark);
                    }
                );
            } catch (error) {
                reject(error);
            }
        });
    },

    async set_localStorage(storageObj) {
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

    async get_localStorage(id) {
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

    async delete_localStorageItem(id) {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.remove([id], function () {
                    var error = chrome.runtime.lastError;
                    if (error) {
                        console.error(error);
                    }
                    resolve();
                })
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
    }
};
