import type { ImportFileData } from '@/types/bookmark';
import { hasLegacyGroupPrefix } from '@utils/bookmarkGroups';

// Treat a folder as a group during import validation when the export marked
// it with isGroup, or as a fallback when the legacy title prefix is present
// (for backwards compatibility with older export files).
function looksLikeGroupForImport(child: { isGroup?: boolean; title?: string; url?: string }): boolean {
    if (child.url) {
        return false;
    }
    return child.isGroup === true || hasLegacyGroupPrefix(child.title ?? '');
}

// Validates the JSON shape of an exported bookmarks file before import.
// The file must declare type 'bookmarks' and carry a bookmarks array; every
// non-empty folder needs at least one navigable bookmark anywhere in its
// direct or grouped descendants.
export function isImportBookmarksFileValid(args: ImportFileData): boolean {
    if (args.type !== 'bookmarks' || !Array.isArray(args.bookmarks)) {
        return false;
    }

    const arr: boolean[] = [
        args.bookmarks.some((e) => e.title),
        args.bookmarks.some((e) => e.children),
        args.bookmarks.some((e) => e.id),
        args.bookmarks.some((e) => e.parentId),
    ];

    if (args.bookmarks.some((b) => b.children?.length)) {
        const directChildren = args.bookmarks.flatMap((e) => e.children ?? []);
        const groupFolderChildren = directChildren
            .filter((child) => looksLikeGroupForImport(child))
            .flatMap((group) => group.children ?? []);
        const allBookmarks = [...directChildren, ...groupFolderChildren];

        if (allBookmarks.length) {
            arr.push(allBookmarks.some((e) => e?.url));
            arr.push(allBookmarks.some((e) => e?.title));
            arr.push(allBookmarks.some((e) => e?.parentId));
            arr.push(allBookmarks.some((e) => e?.id));
        }
    }

    return !arr.includes(false);
}

// Validates the JSON shape of an exported icons file before import.
export function isImportIconsFileValid(args: ImportFileData): boolean {
    return !!(args.type === 'icons' && args.bookmarks && args.folders);
}
