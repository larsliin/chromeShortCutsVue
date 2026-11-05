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

    async function setRootId(id: string): Promise<void> {
        bookmarksStore.rootId = id;
        await bookmarksStore.setLocalStorage({ [FOLDER.ROOT.name]: id });
    }

    async function persistAccordionModel(model: number[]): Promise<void> {
        bookmarksStore.accordionModel = model;
        await bookmarksStore.setSyncStorage({ [STORAGE_KEYS.ACCORDION]: [...model] });
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
            await setRootId(rootFolder.id);
            return;
        }

        const created = await bookmarksStore
            .createBookmark(bookmarksStore.bookmarksBarId as string, FOLDER.ROOT.label);
        await setRootId(created.id);
        await persistAccordionModel([0]);
    }

    async function updateAccordionModel(index: number): Promise<void> {
        if (!bookmarksStore.accordionModel) {
            return;
        }

        const indexInModel = bookmarksStore.accordionModel.indexOf(index);

        if (indexInModel > -1) {
            bookmarksStore.accordionModel.splice(indexInModel, 1);
        }

        await persistAccordionModel(
            bookmarksStore.accordionModel.map((value) => (value > index ? value - 1 : value)),
        );
    }

    return { buildRootFolder, updateAccordionModel, persistAccordionModel };
}
