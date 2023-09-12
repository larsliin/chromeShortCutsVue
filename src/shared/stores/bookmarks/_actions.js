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

    async create_bookmark(parentId, title, url) {
        return new Promise((resolve) => {
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
};
