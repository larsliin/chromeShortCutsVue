import { useBookmarksStore } from '@stores/bookmarks';
import { FOLDER } from '@/constants';
import type { BookmarkNode } from '@/types/bookmark';

export function useUtils() {
    const bookmarksStore = useBookmarksStore();

    function getDomainFromUrl(url: string): string | null {
        const regex = /(?<=:\/\/)([^/]+)/;
        const domain = url.match(regex);
        if (domain) {
            return domain[0];
        }
        return null;
    }

    function isValidURL(str: string): boolean {
        const urlRegex = /(https?:\/\/(www\.)?[a-zA-Z0-9@:%._+~#=])/;
        return urlRegex.test(str);
    }

    async function getBase64ImageFromUrl(url: string): Promise<string> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Image download failed. Response status: ${response.status}`);
            }

            const blob = await response.blob();

            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    resolve(base64data);
                };
                reader.onerror = () => {
                    reject(new Error('Failed to read the image file.'));
                };
                reader.readAsDataURL(blob);
            });
        } catch {
            return 'error';
        }
    }

    async function setSliderIndex(index: number, setLocalStorage: boolean): Promise<void> {
        let indexAdjusted = index;
        if (bookmarksStore.bookmarks && bookmarksStore.bookmarks.length > 0) {
            indexAdjusted = Math.min(indexAdjusted, bookmarksStore.bookmarks.length - 1);
        }
        indexAdjusted = Math.max(indexAdjusted, 0);

        bookmarksStore.sliderIndex = indexAdjusted;

        if (setLocalStorage) {
            await bookmarksStore.set_syncStorage({ sliderIndex: bookmarksStore.sliderIndex });
        }
    }

    async function deleteLocalStoreImages(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const localStorageItems = await bookmarksStore.get_localStorageAll() as Record<string, any>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imageItems = Object.values(localStorageItems).filter((e: any) => e.image);

        await Promise.all(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            imageItems.map((item: any) => bookmarksStore.delete_localStorageItem(item.id)),
        );
    }

    async function deleteBookmarkFolder(bookmark: BookmarkNode): Promise<void> {
        const bookmarksInFolder = bookmarksStore.bookmarks?.find((e) => e.id === bookmark.id);
        const bookmarksIdMap = bookmarksInFolder?.children?.map((e) => e.id) ?? [];

        bookmarksIdMap.forEach((elemId) => {
            bookmarksStore.delete_localStorageItem(elemId);
        });

        bookmarksStore.remove_bookmarkFolder(bookmark.id);
    }

    async function getBookmarksAsFlatArr(): Promise<BookmarkNode[] | null> {
        if (!bookmarksStore.rootId) {
            return null;
        }

        const bookmarksResponse = await bookmarksStore.get_bookmarks(bookmarksStore.rootId);

        if (!bookmarksResponse) {
            return null;
        }

        return bookmarksResponse.flatMap(
            (item) => item.children?.flatMap((child) => (child.children ?? [])) ?? [],
        ) as BookmarkNode[];
    }

    async function deleteAllBookmarks(): Promise<void> {
        if (!bookmarksStore.rootId) {
            return;
        }

        const bookmarksResponse = await bookmarksStore.get_bookmarks(bookmarksStore.rootId);

        const bookmarksFlatArray = bookmarksResponse
            .flatMap((item) => item.children?.flatMap((child) => child) ?? []);

        await Promise.all(
            bookmarksFlatArray.map((item) => bookmarksStore.remove_bookmarkFolder(item.id)),
        );

        await setSliderIndex(0, true);

        bookmarksStore.bookmarks = [];
    }

    function getStoredBookmarkById(id: string): BookmarkNode | null {
        if (!bookmarksStore.bookmarks) {
            return null;
        }

        return bookmarksStore.bookmarks.reduce<BookmarkNode | null>((result, item) => {
            const child = item.children && item.children.find((bookmark) => bookmark.id === id);
            return child || result;
        }, null);
    }

    async function buildRootFolder(): Promise<void> {
        const rootFolderResponse = await bookmarksStore
            .get_bookmarks(bookmarksStore.bookmarksBarId as string);

        const rootFolder = rootFolderResponse[0]
            .children?.find((e) => e.title === FOLDER.ROOT.label) as BookmarkNode | undefined;

        if (rootFolder) {
            bookmarksStore.rootId = rootFolder.id;

            await bookmarksStore.set_localStorage({ [FOLDER.ROOT.name]: rootFolder.id });
        } else {
            const createRootResponse = await bookmarksStore
                .create_bookmark(bookmarksStore.bookmarksBarId as string, FOLDER.ROOT.label);
            bookmarksStore.rootId = createRootResponse.id;

            await bookmarksStore.set_localStorage({ [FOLDER.ROOT.name]: createRootResponse.id });

            bookmarksStore.accordionModel = [0];
            bookmarksStore.set_syncStorage({ accordion: [...bookmarksStore.accordionModel] });

            await setSliderIndex(0, true);
        }
    }

    async function updateAccordionModel(index: number): Promise<void> {
        if (!bookmarksStore.accordionModel) {
            return;
        }

        const indexInAccordionModel = bookmarksStore.accordionModel.indexOf(index);

        if (indexInAccordionModel > -1) {
            bookmarksStore.accordionModel.splice(indexInAccordionModel, 1);
        }

        bookmarksStore.accordionModel = bookmarksStore
            .accordionModel.map((value) => ((value > index) ? value - 1 : value));

        bookmarksStore.set_syncStorage({ accordion: [...bookmarksStore.accordionModel] });
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
        deleteBookmarkFolder,
        updateAccordionModel,
    };
}
