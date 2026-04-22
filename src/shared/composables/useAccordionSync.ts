// Accordion state persistence and root folder management.
// Handles building/finding the extension root folder and keeping
// accordion open/closed state in sync with Chrome sync storage.
import { useBookmarksStore } from '@stores/bookmarks';
import { FOLDER } from '@/constants';
import type { BookmarkNode } from '@/types/bookmark';

export function useAccordionSync() {
    const bookmarksStore = useBookmarksStore();

    async function buildRootFolder(): Promise<void> {
        const response = await bookmarksStore.getBookmarks(bookmarksStore.bookmarksBarId as string);

        const rootFolder = response[0].children
            ?.find((e) => e.title === FOLDER.ROOT.label) as BookmarkNode | undefined;

        if (rootFolder) {
            bookmarksStore.rootId = rootFolder.id;
            await bookmarksStore.setLocalStorage({ [FOLDER.ROOT.name]: rootFolder.id });
        } else {
            const created = await bookmarksStore
                .createBookmark(bookmarksStore.bookmarksBarId as string, FOLDER.ROOT.label);
            bookmarksStore.rootId = created.id;
            await bookmarksStore.setLocalStorage({ [FOLDER.ROOT.name]: created.id });

            bookmarksStore.accordionModel = [0];
            await bookmarksStore.setSyncStorage({ accordion: [...bookmarksStore.accordionModel] });
        }
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

        await bookmarksStore.setSyncStorage({ accordion: [...bookmarksStore.accordionModel] });
    }

    return { buildRootFolder, updateAccordionModel };
}
