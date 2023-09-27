import { useBookmarksStore } from '@stores/bookmarks';
import { FOLDER } from '@/constants';

// eslint-disable-next-line import/prefer-default-export
export function useUtils() {
    function getDomainFromUrl(url) {
        const regex = /(?<=:\/\/)([^/]+)/;
        const domain = url.match(regex);
        if (domain) {
            return domain[0];
        }
        return null;
    }

    function isValidURL(str) {
        // eslint-disable-next-line max-len, no-useless-escape
        const expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
        const regex = new RegExp(expression);

        return !!str.match(regex);
    }

    async function getBase64ImageFromUrl(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Image download failed. Response status: ${response.status}`);
            }

            const blob = await response.blob();

            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result;
                    resolve(base64data);
                };
                reader.onerror = () => {
                    reject(new Error('Failed to read the image file.'));
                };
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            return 'error';
            // throw new Error('Failed to fetch the image URL: ' + error.message);
        }
    }

    async function deleteLocalStoreImages() {
        const bookmarksStore = useBookmarksStore();

        // delete all images from local storage
        const promiseLocalStorageArr = [];
        const localStorageItems = await bookmarksStore.get_localStorageAll(null);
        const localStorageItemsImageArr = Object.values(localStorageItems).filter((e) => e.image);

        localStorageItemsImageArr.forEach((item) => {
            promiseLocalStorageArr.push(bookmarksStore.delete_localStorageItem(item.id));
        });

        Promise.all(promiseLocalStorageArr)
            .then(() => {})
            .catch((error) => {
                console.error(error);
            });
    }

    async function getBookmarksAsFlatArr() {
        const bookmarksStore = useBookmarksStore();

        if (!bookmarksStore.rootId) {
            return null;
        }

        // fetch all bookmarks
        const bookmarksResponse = await bookmarksStore.get_bookmarks(bookmarksStore.rootId);

        if (!bookmarksResponse) {
            return null;
        }

        // put all bookmarks folders in flat array for easier iteration
        const bookmarksFlatArray = bookmarksResponse
            .flatMap((item) => item.children.flatMap((child) => child.children));

        return bookmarksFlatArray;
    }

    async function deleteAllBookmarks() {
        const bookmarksStore = useBookmarksStore();

        const that = this;

        // fetch all bookmarks
        if (!bookmarksStore.rootId) {
            return;
        }
        const bookmarksResponse = await bookmarksStore.get_bookmarks(bookmarksStore.rootId);

        // put all bookmarks folders in flat array for easier iteration
        const bookmarksFlatArray = bookmarksResponse
            .flatMap((item) => item.children.flatMap((child) => child));

        // delete all bookmarks folders and bookmarks inside
        const promiseArr = [];
        bookmarksFlatArray.forEach((item) => {
            promiseArr.push(bookmarksStore.remove_bookmarkFolder(item.id));
        });

        Promise.all(promiseArr)
            .then(() => {
                that.setSliderIndex(0, true);

                bookmarksStore.bookmarks = [];
            })
            .catch((error) => {
                console.error(error);
            });
    }

    function getStoredBookmarkById(id) {
        const bookmarksStore = useBookmarksStore();

        return bookmarksStore.bookmarks.reduce((result, item) => {
            const child = item.children && item.children.find((bookmark) => bookmark.id === id);
            return child || result;
        }, null);
    }

    async function buildRootFolder() {
        const bookmarksStore = useBookmarksStore();

        const rootFolderResponse = await bookmarksStore.get_bookmarks('2');

        const rootFolder = rootFolderResponse[0]
            .children.find((e) => e.title === FOLDER.ROOT.label);

        if (rootFolder) {
            bookmarksStore.rootId = rootFolder.id;

            await bookmarksStore.set_localStorage({ [FOLDER.ROOT.id]: rootFolder.id });
        } else {
            // if root folder does not exist then create root and home folders
            const createRootResponse = await bookmarksStore
                .create_bookmark(2, FOLDER.ROOT.label);
            bookmarksStore.rootId = createRootResponse.id;

            await bookmarksStore.set_localStorage({ [FOLDER.ROOT.id]: createRootResponse.id });

            this.setSliderIndex(0, true);
        }
    }

    async function setSliderIndex(index, setLocalStorage) {
        const bookmarksStore = useBookmarksStore();

        let indexAdjusted;
        if (bookmarksStore.bookmarks && bookmarksStore.bookmarks.length > 0) {
            indexAdjusted = Math.min(indexAdjusted, bookmarksStore.bookmarks.length - 1);
        }
        indexAdjusted = Math.max(index, 0);

        bookmarksStore.sliderIndex = indexAdjusted;

        if (setLocalStorage) {
            await bookmarksStore.set_syncStorage({ sliderIndex: bookmarksStore.sliderIndex });
        }
    }

    return {
        buildRootFolder,
        deleteAllBookmarks,
        deleteLocalStoreImages,
        getBase64ImageFromUrl,
        getBookmarksAsFlatArr,
        getDomainFromUrl,
        getStoredBookmarkById,
        isValidURL,
        setSliderIndex,
    };
}
