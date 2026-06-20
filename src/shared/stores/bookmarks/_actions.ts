import type { BookmarkNode } from '@/types/bookmark';
import { GROUPING, STORAGE_KEYS } from '@/constants';
import * as chromeApi from '@cmp/chromeApi';
import {
    hasLegacyGroupPrefix,
    isBookmarkLink,
    isGroupFolder,
} from '@utils/bookmarkGroups';

function applyBookmarkColors(
    nodes: BookmarkNode[],
    bookmarkColors: Record<string, string>,
): void {
    nodes.forEach((node) => {
        if (bookmarkColors[node.id]) {
            node.color = bookmarkColors[node.id];
        }

        if (node.children?.length) {
            applyBookmarkColors(node.children, bookmarkColors);
        }
    });
}

// Recursively walk a Chrome bookmark tree and invoke the callback for every
// folder (non-URL node) encountered. Used by the legacy-group migration.
function forEachFolder(
    nodes: chrome.bookmarks.BookmarkTreeNode[],
    cb: (folder: chrome.bookmarks.BookmarkTreeNode) => void,
): void {
    nodes.forEach((node) => {
        if (!node.url) {
            cb(node);
        }
        if (node.children?.length) {
            forEachFolder(node.children, cb);
        }
    });
}

function isGroupCandidateFolder(node: chrome.bookmarks.BookmarkTreeNode): boolean {
    if (node.url) {
        return false;
    }

    const children = node.children ?? [];

    if (children.length === 0 || children.length > GROUPING.MAX_ITEMS) {
        return false;
    }

    return children.every((child) => !!child.url);
}

function collectGroupCandidateIds(
    rootChildren: chrome.bookmarks.BookmarkTreeNode[],
): Record<string, true> {
    const next: Record<string, true> = {};

    rootChildren.forEach((folder) => {
        if (folder.url) {
            return;
        }

        (folder.children ?? []).forEach((child) => {
            if (isGroupCandidateFolder(child)) {
                next[child.id] = true;
            }
        });
    });

    return next;
}

function areGroupIdMapsEqual(
    left: Record<string, true>,
    right: Record<string, true>,
): boolean {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);

    if (leftKeys.length !== rightKeys.length) {
        return false;
    }

    return leftKeys.every((key) => right[key] === true);
}

export default {
    async getBookmarks(id: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
        return chromeApi.getBookmarkSubTree(id);
    },

    async getColorizedBookmarks(id: string): Promise<BookmarkNode[]> {
        const [tree, folderColors, bookmarkColors]: [
            chrome.bookmarks.BookmarkTreeNode[],
            Record<string, string> | null,
            Record<string, string> | null,
        ] = await Promise.all([
            chromeApi.getBookmarkSubTree(id),
            chromeApi.getSyncStorage('folderColors') as Promise<Record<string, string> | null>,
            chromeApi.getSyncStorage('bookmarkColors') as Promise<Record<string, string> | null>,
        ]);

        const result = [...tree] as BookmarkNode[];

        if (folderColors) {
            Object.entries(folderColors).forEach(([folderId, color]) => {
                const folder = (result[0].children ?? [])
                    .find((e) => e.id === folderId) as BookmarkNode | undefined;
                if (folder) {
                    folder.color = color;
                }
            });
        }

        if (bookmarkColors) {
            applyBookmarkColors((result[0].children ?? []) as BookmarkNode[], bookmarkColors);
        }

        return result;
    },

    async getBookmarkById(id: string): Promise<chrome.bookmarks.BookmarkTreeNode> {
        return chromeApi.getBookmarkById(id);
    },

    async getBookmarkByIdOrNull(id: string): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
        return chromeApi.getBookmarkByIdOrNull(id);
    },

    searchFolder(
        nodes: chrome.bookmarks.BookmarkTreeNode[],
        folderName: string,
    ): chrome.bookmarks.BookmarkTreeNode | false {
        return chromeApi.searchFolder(nodes, folderName);
    },

    async getFolderByTitle(
        parentFolderId: string,
        title: string,
    ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
        const result = await chromeApi.getBookmarkSubTree(parentFolderId);
        const nodes = result[0].children ?? [];
        const folder = chromeApi.searchFolder(nodes, title);
        return folder ? [folder] : [];
    },

    async createBookmark(
        parentId: string,
        title: string,
        url?: string,
        index?: number,
    ): Promise<chrome.bookmarks.BookmarkTreeNode> {
        return chromeApi.createBookmark(parentId, title, url, index);
    },

    async updateBookmark(
        id: string,
        data: { title?: string; url?: string },
    ): Promise<chrome.bookmarks.BookmarkTreeNode> {
        return chromeApi.updateBookmark(id, data);
    },

    async moveBookmark(
        id: string,
        targetId: { parentId?: string; index?: number },
    ): Promise<void> {
        return chromeApi.moveBookmark(id, targetId);
    },

    async reorderBookmark(id: string, index: number): Promise<void> {
        return chromeApi.moveBookmark(id, { index });
    },

    async createBookmarkGroup(
        this: { groupIds: Record<string, true>; registerGroupId: (id: string) => Promise<void> },
        parentId: string,
        draggedBookmarkId: string,
        targetBookmarkId: string,
    ): Promise<chrome.bookmarks.BookmarkTreeNode> {
        if (draggedBookmarkId === targetBookmarkId) {
            throw new Error('Cannot group the same bookmark');
        }

        const [parentNode, draggedNode, targetNode] = await Promise.all([
            chromeApi.getBookmarkById(parentId),
            chromeApi.getBookmarkById(draggedBookmarkId),
            chromeApi.getBookmarkById(targetBookmarkId),
        ]);

        if (!isBookmarkLink(draggedNode) || !isBookmarkLink(targetNode)) {
            throw new Error('Only bookmark links can be grouped');
        }

        if (draggedNode.parentId !== parentId || targetNode.parentId !== parentId) {
            throw new Error('Bookmarks must have the same parent folder');
        }

        if (isGroupFolder(parentNode as BookmarkNode, this.groupIds)) {
            throw new Error('Nested groups are not allowed');
        }

        const groupFolder = await chromeApi.createBookmark(
            parentId,
            GROUPING.DEFAULT_NAME,
            undefined,
            targetNode.index,
        );

        await this.registerGroupId(groupFolder.id);

        await chromeApi.moveBookmark(targetBookmarkId, { parentId: groupFolder.id, index: 0 });
        await chromeApi.moveBookmark(draggedBookmarkId, { parentId: groupFolder.id, index: 1 });

        return groupFolder;
    },

    async addBookmarkToGroup(
        this: { groupIds: Record<string, true> },
        groupFolderId: string,
        bookmarkId: string,
    ): Promise<void> {
        const [groupFolder, bookmark] = await Promise.all([
            chromeApi.getBookmarkById(groupFolderId),
            chromeApi.getBookmarkById(bookmarkId),
        ]);

        if (!isGroupFolder(groupFolder as BookmarkNode, this.groupIds)) {
            throw new Error('Target is not a bookmark group');
        }

        if (!isBookmarkLink(bookmark)) {
            throw new Error('Only bookmark links can be grouped');
        }

        if (bookmark.parentId === groupFolderId) {
            return;
        }

        if (groupFolder.children && groupFolder.children.length >= GROUPING.MAX_ITEMS) {
            throw new Error('Bookmark group is full');
        }

        await chromeApi.moveBookmark(bookmarkId, {
            parentId: groupFolderId,
            index: groupFolder.children?.length ?? 0,
        });
    },

    async ungroupBookmarkGroup(
        this: { groupIds: Record<string, true>; unregisterGroupId: (id: string) => Promise<void> },
        groupFolderId: string,
    ): Promise<void> {
        // chrome.bookmarks.get (used by getBookmarkById) does not populate
        // `children`, so we need getSubTree to read the group's contents
        // before moving them out. Without this, the move loop runs over an
        // empty list and removeBookmarkTree below deletes every bookmark.
        const subTree = await chromeApi.getBookmarkSubTree(groupFolderId);
        const groupFolder = subTree?.[0];

        if (!groupFolder || !isGroupFolder(groupFolder as BookmarkNode, this.groupIds)) {
            return;
        }

        const { parentId } = groupFolder;

        if (!parentId) {
            return;
        }

        // Re-insert each child sequentially at the group folder's original
        // index plus the child's offset. Chrome's move(index) inserts BEFORE the
        // target index, so sequential inserts at (origIndex + 0), (origIndex + 1),
        // ... lay the children out in order at the position the group folder
        // occupied. parentId is asserted above to be defined.
        const groupChildren = (groupFolder.children ?? []).filter((child) => !!child.url);

        await groupChildren.reduce<Promise<void>>((chain, child, index) => chain
            .then(() => chromeApi.moveBookmark(child.id, {
                parentId,
                index: (groupFolder.index ?? 0) + index,
            })), Promise.resolve());

        await chromeApi.removeBookmarkTree(groupFolderId);
        await this.unregisterGroupId(groupFolderId);
    },

    async renameBookmarkGroup(
        this: { groupIds: Record<string, true> },
        groupFolderId: string,
        name: string,
    ): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
        if (!this.groupIds[groupFolderId]) {
            return null;
        }
        const trimmed = (name ?? '').trim();
        const finalName = trimmed.length ? trimmed : GROUPING.DEFAULT_NAME;
        return chromeApi.updateBookmark(groupFolderId, { title: finalName });
    },

    async loadGroupIds(
        this: { groupIds: Record<string, true> },
    ): Promise<void> {
        const stored = await chromeApi.getSyncStorage(STORAGE_KEYS.GROUP_IDS) as
            Record<string, true> | null;
        this.groupIds = stored && typeof stored === 'object' ? { ...stored } : {};
    },

    async reconcileGroupIdsFromTree(
        this: {
            groupIds: Record<string, true>;
            persistGroupIds: () => Promise<void>;
        },
        rootChildren: chrome.bookmarks.BookmarkTreeNode[],
    ): Promise<void> {
        const next = collectGroupCandidateIds(rootChildren);

        if (areGroupIdMapsEqual(this.groupIds, next)) {
            return;
        }

        this.groupIds = next;
        await this.persistGroupIds();
    },

    async persistGroupIds(
        this: { groupIds: Record<string, true> },
    ): Promise<void> {
        if (Object.keys(this.groupIds).length === 0) {
            await chromeApi.deleteSyncStorageItem(STORAGE_KEYS.GROUP_IDS);
            return;
        }
        await chromeApi.setSyncStorage({ [STORAGE_KEYS.GROUP_IDS]: this.groupIds });
    },

    async registerGroupId(
        this: { groupIds: Record<string, true>; persistGroupIds: () => Promise<void> },
        id: string,
    ): Promise<void> {
        if (this.groupIds[id]) {
            return;
        }
        this.groupIds = { ...this.groupIds, [id]: true };
        await this.persistGroupIds();
    },

    async unregisterGroupId(
        this: { groupIds: Record<string, true>; persistGroupIds: () => Promise<void> },
        id: string,
    ): Promise<void> {
        if (!this.groupIds[id]) {
            return;
        }
        const next = { ...this.groupIds };
        delete next[id];
        this.groupIds = next;
        await this.persistGroupIds();
    },

    // One-time migration: any folder whose Chrome title starts with the
    // legacy __mst_group__: prefix is registered in the new groupIds map and
    // renamed to GROUPING.DEFAULT_NAME so the underlying Chrome bookmark
    // becomes human-readable in Chrome's native bookmark manager.
    async migrateLegacyGroupFolders(
        this: {
            rootId: string | null;
            groupIds: Record<string, true>;
            persistGroupIds: () => Promise<void>;
        },
    ): Promise<void> {
        if (!this.rootId) {
            return;
        }

        const tree = await chromeApi.getBookmarkSubTree(this.rootId);
        const legacyFolders: chrome.bookmarks.BookmarkTreeNode[] = [];

        forEachFolder(tree, (folder) => {
            if (hasLegacyGroupPrefix(folder.title)) {
                legacyFolders.push(folder);
            }
        });

        if (legacyFolders.length === 0) {
            return;
        }

        const nextIds: Record<string, true> = { ...this.groupIds };
        legacyFolders.forEach((folder) => {
            nextIds[folder.id] = true;
        });
        this.groupIds = nextIds;
        await this.persistGroupIds();

        // Rename each legacy folder sequentially to avoid hammering Chrome's
        // bookmarks API with a parallel storm of updates.
        await legacyFolders.reduce<Promise<void>>((chain, folder) => chain.then(async () => {
            await chromeApi.updateBookmark(folder.id, { title: GROUPING.DEFAULT_NAME });
        }), Promise.resolve());
    },

    // Drop entries from groupIds whose Chrome folder no longer exists (or is
    // no longer a folder). Runs after the tree has been loaded.
    async cleanupGroupIds(
        this: {
            groupIds: Record<string, true>;
            persistGroupIds: () => Promise<void>;
        },
    ): Promise<void> {
        const ids = Object.keys(this.groupIds);
        if (ids.length === 0) {
            return;
        }

        const liveIds = new Set<string>();
        await Promise.all(ids.map(async (id) => {
            const node = await chromeApi.getBookmarkByIdOrNull(id);
            if (node && !node.url) {
                liveIds.add(id);
            }
        }));

        if (liveIds.size === ids.length) {
            return;
        }

        const next: Record<string, true> = {};
        liveIds.forEach((id) => {
            next[id] = true;
        });
        this.groupIds = next;
        await this.persistGroupIds();
    },

    async collapseEmptyGroups(
        this: {
            bookmarks: BookmarkNode[] | null;
            groupIds: Record<string, true>;
            ungroupBookmarkGroup: (id: string) => Promise<void>;
        },
    ): Promise<void> {
        const groupChildren = (this.bookmarks ?? [])
            .flatMap((folder) => folder.children ?? [])
            .filter((child) => isGroupFolder(child, this.groupIds));

        const groupStates = await Promise.all(groupChildren.map(async (groupChild) => {
            const subTree = await chromeApi.getBookmarkSubTree(groupChild.id);
            const groupFromApi = subTree?.[0];
            const linksInsideGroup = (groupFromApi?.children ?? []).filter((item) => !!item.url);

            return {
                groupId: groupChild.id,
                shouldUngroup: linksInsideGroup.length === 0,
            };
        }));

        await Promise.all(groupStates
            .filter((groupState) => groupState.shouldUngroup)
            .map((groupState) => this.ungroupBookmarkGroup(groupState.groupId)));
    },

    async removeBookmark(id: string): Promise<string> {
        return chromeApi.removeBookmark(id);
    },

    async removeBookmarkFolder(id: string): Promise<string> {
        return chromeApi.removeBookmarkTree(id);
    },

    async getTree(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
        return chromeApi.getBookmarkTree();
    },

    async setLocalStorage(storageObj: Record<string, unknown>): Promise<void> {
        return chromeApi.setLocalStorage(storageObj);
    },

    async getLocalStorage(id: string): Promise<unknown> {
        return chromeApi.getLocalStorage(id);
    },

    async setSyncStorage(storageObj: Record<string, unknown>): Promise<void> {
        return chromeApi.setSyncStorage(storageObj);
    },

    async getSyncStorage(id: string): Promise<unknown> {
        return chromeApi.getSyncStorage(id);
    },

    async getLocalStorageAll(): Promise<Record<string, unknown>> {
        return chromeApi.getAllLocalStorage();
    },

    async deleteLocalStorageItem(id: string): Promise<void> {
        return chromeApi.deleteLocalStorageItem(id);
    },

    async deleteSyncStorageItem(id: string): Promise<void> {
        return chromeApi.deleteSyncStorageItem(id);
    },

    async toBase64(file: File): Promise<string | ArrayBuffer | null> {
        return chromeApi.toBase64(file);
    },

    setBookmarksBarId(this: { bookmarksBarId: string | null }, id: string): void {
        this.bookmarksBarId = id;
    },
};
