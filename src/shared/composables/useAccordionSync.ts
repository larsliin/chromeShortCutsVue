// Manage accordion state and the extension root folder.
// Keeps sync storage and the UI in step.
import { useBookmarksStore } from '@stores/bookmarks';
import { FOLDER, STORAGE_KEYS } from '@/constants';
import type { BookmarkNode } from '@/types/bookmark';

export function useAccordionSync() {
    const bookmarksStore = useBookmarksStore();

    function findRootFolder(
        children: BookmarkNode[] | undefined,
    ): BookmarkNode | undefined {
        return children?.find((e) => e.title === FOLDER.ROOT.label);
    }

    async function buildRootFolder(): Promise<void> {
        const response = await bookmarksStore.getBookmarks(bookmarksStore.bookmarksBarId as string);
        let rootFolder = findRootFolder(response[0].children as BookmarkNode[] | undefined);

        // Re-check the bookmarks bar before creating the root folder.
        // This closes a race between concurrent creation events.
        if (!rootFolder) {
            const recheck = await bookmarksStore
                .getBookmarks(bookmarksStore.bookmarksBarId as string);
            rootFolder = findRootFolder(recheck[0].children as BookmarkNode[] | undefined);
        }

        if (rootFolder) {
            bookmarksStore.rootId = rootFolder.id;
            await bookmarksStore.setLocalStorage({ [FOLDER.ROOT.name]: rootFolder.id });
            return;
        }

        const created = await bookmarksStore
            .createBookmark(bookmarksStore.bookmarksBarId as string, FOLDER.ROOT.label);
        bookmarksStore.rootId = created.id;
        await bookmarksStore.setLocalStorage({ [FOLDER.ROOT.name]: created.id });

        bookmarksStore.accordionModel = [0];
        await bookmarksStore.setSyncStorage({
            [STORAGE_KEYS.ACCORDION]: [...bookmarksStore.accordionModel],
        });
    }

    async function updateAccordionModel(index: number): Promise<void> {
        if (!bookmarksStore.accordionModel) {
            return;
        }

        const indexInModel = bookmarksStore.accordionModel.indexOf(index);

        if (indexInModel > -1) {
            bookmarksStore.accordionModel.splice(indexInModel, 1);
        }

        bookmarksStore.accordionModel = bookmarksStore.accordionModel
            .map((value) => (value > index ? value - 1 : value));

        await bookmarksStore.setSyncStorage({
            [STORAGE_KEYS.ACCORDION]: [...bookmarksStore.accordionModel],
        });
    }

    return { buildRootFolder, updateAccordionModel };
}
