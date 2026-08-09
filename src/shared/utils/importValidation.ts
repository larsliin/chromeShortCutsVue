import type { ImportFileData } from '@/types/bookmark';
import { hasLegacyGroupPrefix } from '@utils/bookmarkGroups';

// Treat a folder as a group when the export marked it as such.
// Fall back to the legacy title prefix for older exports.
function looksLikeGroupForImport(child: { isGroup?: boolean; title?: string; url?: string }): boolean {
    if (child.url) {
        return false;
    }
    return child.isGroup === true || hasLegacyGroupPrefix(child.title ?? '');
}

// Validate the exported bookmarks JSON before import.
// The file must include at least one navigable bookmark.
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
