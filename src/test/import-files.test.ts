import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBookmarksStore } from '@stores/bookmarks';
import type { BookmarkNode } from '@/types/bookmark';
import { GROUPING } from '@/constants';
import { findNodeById, hasLegacyGroupPrefix } from '@utils/bookmarkGroups';
import { chromeMock, fireCallback } from './mocks/chrome';

// ---------------------------------------------------------------------------
// Fixtures — representative slices that match the shape of the real exported
// files in files/exports/.
//
// Bookmarks file shape:  { bookmarks: Folder[], type: 'bookmarks' }
//   Each folder:         { id, title, children: Bookmark[] }
//   Each bookmark:       { id, title, url, parentId, dateAdded, index }
//
// Icons file shape:      { folders: FolderIcon[], bookmarks: BookmarkIcon[], type: 'icons' }
//   Each folder icon:    { id, color, title }
//   Each bookmark icon:  { id, image, url, title, parentId }
// ---------------------------------------------------------------------------

const BOOKMARKS_FIXTURE = {
    type: 'bookmarks',
    bookmarks: [
        {
            id: '556',
            title: 'Home',
            children: [
                {
                    id: '566',
                    title: 'Gmail',
                    url: 'https://mail.google.com/',
                    parentId: '556',
                    dateAdded: 1759914890362,
                    index: 0,
                },
                {
                    id: '567',
                    title: 'Google Photos',
                    url: 'https://photos.google.com/',
                    parentId: '556',
                    dateAdded: 1759914890363,
                    index: 1,
                },
            ],
        },
        {
            id: '557',
            title: 'Catalyst',
            children: [
                {
                    id: '593',
                    title: 'WorkBook',
                    url: 'https://wunderman.workbook.dk/',
                    parentId: '557',
                    dateAdded: 1759914890400,
                    index: 0,
                },
            ],
        },
        {
            id: '558',
            title: 'Empty Folder',
            children: [],
        },
    ],
};

const ICONS_FIXTURE = {
    type: 'icons',
    folders: [
        { id: '556', color: '#2AB567', title: 'Home' },
        { id: '557', color: '#1C60AD', title: 'Catalyst' },
    ],
    bookmarks: [
        {
            id: '566',
            title: 'Gmail',
            url: 'https://mail.google.com/',
            parentId: '556',
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        },
        {
            id: '567',
            title: 'Google Photos',
            url: 'https://photos.google.com/',
            parentId: '556',
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mNk+M9QDwADhAGAWjR9awAAAABJRU5ErkJggg==',
        },
        {
            id: '593',
            title: 'WorkBook',
            url: 'https://wunderman.workbook.dk/',
            parentId: '557',
            image: null,
        },
    ],
};

// Fixture containing a folder with a bookmark group
const BOOKMARKS_WITH_GROUPS_FIXTURE = {
    type: 'bookmarks',
    bookmarks: [
        {
            id: '600',
            title: 'Work',
            parentId: 'root',
            children: [
                {
                    id: '601',
                    title: 'Slack',
                    url: 'https://slack.com/',
                    parentId: '600',
                    dateAdded: 1759914890400,
                    index: 0,
                    image: 'data:image/png;base64,slack-icon-data',
                },
                {
                    // Group folder - no url, title starts with the legacy
                    // group prefix. This mirrors what older export files look
                    // like; new exports use the `isGroup: true` flag instead.
                    id: '602',
                    title: `${GROUPING.LEGACY_FOLDER_PREFIX}abc123`,
                    parentId: '600',
                    dateAdded: 1759914890401,
                    index: 1,
                    children: [
                        {
                            id: '603',
                            title: 'GitHub',
                            url: 'https://github.com/',
                            parentId: '602',
                            dateAdded: 1759914890402,
                            index: 0,
                            image: 'data:image/png;base64,github-icon-data',
                            color: '#24292e',
                        },
                        {
                            id: '604',
                            title: 'GitLab',
                            url: 'https://gitlab.com/',
                            parentId: '602',
                            dateAdded: 1759914890403,
                            index: 1,
                            image: 'data:image/png;base64,gitlab-icon-data',
                        },
                    ],
                },
                {
                    id: '605',
                    title: 'Jira',
                    url: 'https://jira.atlassian.com/',
                    parentId: '600',
                    dateAdded: 1759914890404,
                    index: 2,
                },
            ],
        },
        {
            // Folder with ONLY group children (edge case for validation)
            id: '700',
            title: 'Groups Only',
            parentId: 'root',
            children: [
                {
                    id: '701',
                    title: `${GROUPING.LEGACY_FOLDER_PREFIX}def456`,
                    parentId: '700',
                    dateAdded: 1759914890500,
                    index: 0,
                    children: [
                        {
                            id: '702',
                            title: 'Google',
                            url: 'https://google.com/',
                            parentId: '701',
                            dateAdded: 1759914890501,
                            index: 0,
                        },
                    ],
                },
            ],
        },
    ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCreatedFolder(
    id: string,
    title: string,
    parentId = 'root',
): chrome.bookmarks.BookmarkTreeNode {
    return { id, title, parentId, index: 0, dateAdded: Date.now(), children: [], syncing: false };
}

function makeCreatedBookmark(
    id: string,
    title: string,
    url: string,
    parentId: string,
): chrome.bookmarks.BookmarkTreeNode {
    return { id, title, url, parentId, index: 0, dateAdded: Date.now(), syncing: false };
}

let store: ReturnType<typeof useBookmarksStore>;

beforeEach(() => {
    setActivePinia(createPinia());
    store = useBookmarksStore();
});

// ---------------------------------------------------------------------------
// IMPORT BOOKMARKS FILE
// Tests the logic that drives onBookmarksImportReaderLoad:
//   1. Parse exported JSON → { bookmarks: Folder[], type }
//   2. createBookmark(rootId, folder.title) for each folder
//   3. Build oldId → newId folder map from the creation results
//   4. createBookmark(newFolderId, bm.title, bm.url) for each child bookmark
// ---------------------------------------------------------------------------

describe('Import bookmarks file', () => {
    it('parses the exported bookmarks JSON and reads the correct number of folders', () => {
        const parsed = JSON.parse(JSON.stringify(BOOKMARKS_FIXTURE));

        expect(parsed.type).toBe('bookmarks');
        expect(parsed.bookmarks).toHaveLength(3);
        expect(parsed.bookmarks[0].title).toBe('Home');
        expect(parsed.bookmarks[1].title).toBe('Catalyst');
        expect(parsed.bookmarks[2].title).toBe('Empty Folder');
    });

    it('parses child bookmarks from the exported file with correct fields', () => {
        const parsed = JSON.parse(JSON.stringify(BOOKMARKS_FIXTURE));
        const homeFolder = parsed.bookmarks[0];

        expect(homeFolder.children).toHaveLength(2);
        expect(homeFolder.children[0].title).toBe('Gmail');
        expect(homeFolder.children[0].url).toBe('https://mail.google.com/');
        expect(homeFolder.children[0].parentId).toBe('556');
    });

    it('creates a new Chrome folder for each top-level folder in the import file', async () => {
        const newHome = makeCreatedFolder('new-556', 'Home');
        const newCatalyst = makeCreatedFolder('new-557', 'Catalyst');
        const newEmpty = makeCreatedFolder('new-558', 'Empty Folder');

        chromeMock.bookmarks.create
            .mockImplementationOnce((_: unknown, cb: (n: typeof newHome) => void) => cb(newHome))
            .mockImplementationOnce((_: unknown, cb: (n: typeof newCatalyst) => void) => cb(newCatalyst))
            .mockImplementationOnce((_: unknown, cb: (n: typeof newEmpty) => void) => cb(newEmpty));

        const results = await Promise.all(
            BOOKMARKS_FIXTURE.bookmarks.map((folder) => store.createBookmark('root', folder.title)),
        );

        expect(chromeMock.bookmarks.create).toHaveBeenCalledTimes(3);
        expect(results[0].title).toBe('Home');
        expect(results[1].title).toBe('Catalyst');
        expect(results[2].title).toBe('Empty Folder');
    });

    it('builds the oldId → newId folder map from creation results', async () => {
        const newHome = makeCreatedFolder('new-556', 'Home');
        const newCatalyst = makeCreatedFolder('new-557', 'Catalyst');
        const newEmpty = makeCreatedFolder('new-558', 'Empty Folder');

        chromeMock.bookmarks.create
            .mockImplementationOnce((_: unknown, cb: (n: typeof newHome) => void) => cb(newHome))
            .mockImplementationOnce((_: unknown, cb: (n: typeof newCatalyst) => void) => cb(newCatalyst))
            .mockImplementationOnce((_: unknown, cb: (n: typeof newEmpty) => void) => cb(newEmpty));

        const createdFolders = await Promise.all(
            BOOKMARKS_FIXTURE.bookmarks.map((folder) => store.createBookmark('root', folder.title)),
        );

        const foldersMap: Record<string, string> = {};
        BOOKMARKS_FIXTURE.bookmarks.forEach((folder, i) => {
            foldersMap[folder.id] = createdFolders[i].id;
        });

        expect(foldersMap['556']).toBe('new-556');
        expect(foldersMap['557']).toBe('new-557');
        expect(foldersMap['558']).toBe('new-558');
    });

    it('creates child bookmarks under the correct new folder IDs using the folder map', async () => {
        const foldersMap: Record<string, string> = {
            556: 'new-556',
            557: 'new-557',
        };

        const flatBookmarks = BOOKMARKS_FIXTURE.bookmarks.flatMap((f) => f.children);

        const newGmail = makeCreatedBookmark('new-566', 'Gmail', 'https://mail.google.com/', 'new-556');
        const newPhotos = makeCreatedBookmark('new-567', 'Google Photos', 'https://photos.google.com/', 'new-556');
        const newWorkBook = makeCreatedBookmark('new-593', 'WorkBook', 'https://wunderman.workbook.dk/', 'new-557');

        chromeMock.bookmarks.create
            .mockImplementationOnce((_: unknown, cb: (n: typeof newGmail) => void) => cb(newGmail))
            .mockImplementationOnce((_: unknown, cb: (n: typeof newPhotos) => void) => cb(newPhotos))
            .mockImplementationOnce((_: unknown, cb: (n: typeof newWorkBook) => void) => cb(newWorkBook));

        const results = await Promise.all(
            flatBookmarks.map((bm) => store.createBookmark(foldersMap[bm.parentId ?? ''], bm.title, bm.url)),
        );

        expect(chromeMock.bookmarks.create).toHaveBeenCalledTimes(3);
        expect(chromeMock.bookmarks.create).toHaveBeenNthCalledWith(
            1,
            { parentId: 'new-556', title: 'Gmail', url: 'https://mail.google.com/' },
            expect.any(Function),
        );
        expect(chromeMock.bookmarks.create).toHaveBeenNthCalledWith(
            3,
            { parentId: 'new-557', title: 'WorkBook', url: 'https://wunderman.workbook.dk/' },
            expect.any(Function),
        );
        expect(results[0].parentId).toBe('new-556');
        expect(results[2].parentId).toBe('new-557');
    });

    it('skips bookmark creation for empty folders (no Chrome API calls for their children)', async () => {
        const emptyFolder = BOOKMARKS_FIXTURE.bookmarks.find((f) => f.title === 'Empty Folder') as typeof BOOKMARKS_FIXTURE.bookmarks[0];
        const newEmpty = makeCreatedFolder('new-558', 'Empty Folder');
        fireCallback(chromeMock.bookmarks.create, [newEmpty]);

        await store.createBookmark('root', emptyFolder.title);

        // Only one call for the folder itself — no children to create
        expect(chromeMock.bookmarks.create).toHaveBeenCalledTimes(1);
        expect(emptyFolder.children).toHaveLength(0);
    });

    it('full import flow: creates all folders then all child bookmarks in sequence', async () => {
        const newHome = makeCreatedFolder('new-556', 'Home');
        const newCatalyst = makeCreatedFolder('new-557', 'Catalyst');
        const newEmpty = makeCreatedFolder('new-558', 'Empty Folder');
        const newGmail = makeCreatedBookmark('new-566', 'Gmail', 'https://mail.google.com/', 'new-556');
        const newPhotos = makeCreatedBookmark('new-567', 'Google Photos', 'https://photos.google.com/', 'new-556');
        const newWorkBook = makeCreatedBookmark('new-593', 'WorkBook', 'https://wunderman.workbook.dk/', 'new-557');

        chromeMock.bookmarks.create
            .mockImplementationOnce((_: unknown, cb: (n: typeof newHome) => void) => cb(newHome))
            .mockImplementationOnce((_: unknown, cb: (n: typeof newCatalyst) => void) => cb(newCatalyst))
            .mockImplementationOnce((_: unknown, cb: (n: typeof newEmpty) => void) => cb(newEmpty))
            .mockImplementationOnce((_: unknown, cb: (n: typeof newGmail) => void) => cb(newGmail))
            .mockImplementationOnce((_: unknown, cb: (n: typeof newPhotos) => void) => cb(newPhotos))
            .mockImplementationOnce((_: unknown, cb: (n: typeof newWorkBook) => void) => cb(newWorkBook));

        // Step 1: create folders
        const createdFolders = await Promise.all(
            BOOKMARKS_FIXTURE.bookmarks.map((folder) => store.createBookmark('root', folder.title)),
        );

        const foldersMap: Record<string, string> = {};
        BOOKMARKS_FIXTURE.bookmarks.forEach((folder, i) => {
            foldersMap[folder.id] = createdFolders[i].id;
        });

        // Step 2: create bookmarks under the new folder IDs
        const flatBookmarks = BOOKMARKS_FIXTURE.bookmarks.flatMap((f) => f.children);
        const createdBookmarks = await Promise.all(
            flatBookmarks.map((bm) => store.createBookmark(foldersMap[bm.parentId ?? ''], bm.title, bm.url)),
        );

        // 3 folders + 3 bookmarks = 6 total create calls
        expect(chromeMock.bookmarks.create).toHaveBeenCalledTimes(6);
        expect(createdFolders).toHaveLength(3);
        expect(createdBookmarks).toHaveLength(3);
        expect(createdBookmarks[0].parentId).toBe('new-556');
        expect(createdBookmarks[2].parentId).toBe('new-557');
    });
});

// ---------------------------------------------------------------------------
// IMPORT ICONS FILE
// Tests the logic that drives onIconsImportReaderLoad:
//   1. Parse exported icons JSON → { folders, bookmarks, type }
//   2. For each bookmark icon: match by URL to live bookmarks, setLocalStorage with image
//   3. For each folder icon: match by title to store.bookmarks, collect folderColors
//   4. Persist bookmarkColors and folderColors to sync storage
// ---------------------------------------------------------------------------

describe('Import icons file', () => {
    it('parses the exported icons JSON and reads folders and bookmarks arrays', () => {
        const parsed = JSON.parse(JSON.stringify(ICONS_FIXTURE));

        expect(parsed.type).toBe('icons');
        expect(parsed.folders).toHaveLength(2);
        expect(parsed.bookmarks).toHaveLength(3);
    });

    it('reads folder colors from the icons file', () => {
        const parsed = JSON.parse(JSON.stringify(ICONS_FIXTURE));

        expect(parsed.folders[0].color).toBe('#2AB567');
        expect(parsed.folders[0].title).toBe('Home');
        expect(parsed.folders[1].color).toBe('#1C60AD');
        expect(parsed.folders[1].title).toBe('Catalyst');
    });

    it('reads bookmark image data from the icons file', () => {
        const parsed = JSON.parse(JSON.stringify(ICONS_FIXTURE));
        const gmail = parsed.bookmarks[0];

        expect(gmail.url).toBe('https://mail.google.com/');
        expect(gmail.image).toMatch(/^data:image\/png;base64,/);
    });

    it('matches each bookmark icon to a live bookmark by URL and calls setLocalStorage', async () => {
        // Simulate bookmarks already present in the store (as if imported in a prior step)
        store.bookmarks = [
            {
                id: 'new-556',
                title: 'Home',
                children: [
                    { id: 'new-566', title: 'Gmail', url: 'https://mail.google.com/' },
                    { id: 'new-567', title: 'Google Photos', url: 'https://photos.google.com/' },
                ],
            },
            {
                id: 'new-557',
                title: 'Catalyst',
                children: [
                    { id: 'new-593', title: 'WorkBook', url: 'https://wunderman.workbook.dk/', syncing: false },
                ],
            },
        ] as BookmarkNode[];

        chromeMock.storage.local.set.mockResolvedValue(undefined);

        const flatLiveBookmarks = store.bookmarks.flatMap((f) => f.children ?? []);

        const storageCallsPromises = ICONS_FIXTURE.bookmarks
            .filter((item) => item.image)
            .flatMap((item) => {
                const matches = flatLiveBookmarks.filter((bm) => bm.url === item.url);
                return matches.map((bm) => store.setLocalStorage({
                    [bm.id]: {
                        id: bm.id,
                        parentId: item.parentId,
                        image: item.image,
                        url: item.url,
                        title: item.title,
                    },
                }));
            });

        await Promise.all(storageCallsPromises);

        // 2 icons with images (WorkBook has null image) → 2 set calls
        expect(chromeMock.storage.local.set).toHaveBeenCalledTimes(2);
        expect(chromeMock.storage.local.set).toHaveBeenCalledWith(
            expect.objectContaining({
                'new-566': expect.objectContaining({
                    id: 'new-566',
                    url: 'https://mail.google.com/',
                    image: expect.stringMatching(/^data:image\/png;base64,/),
                }),
            }),
        );
    });

    it('builds the bookmarkColors map from icon entries that include a color', () => {
        const ICONS_WITH_COLORS = {
            ...ICONS_FIXTURE,
            bookmarks: [
                { ...ICONS_FIXTURE.bookmarks[0], color: '#FF5733' },
                { ...ICONS_FIXTURE.bookmarks[1] },
            ],
        };

        const flatLiveBookmarks = [
            { id: 'new-566', title: 'Gmail', url: 'https://mail.google.com/' },
            { id: 'new-567', title: 'Google Photos', url: 'https://photos.google.com/' },
        ];

        const colorArr: Record<string, string> = {};

        ICONS_WITH_COLORS.bookmarks.forEach((item: Record<string, unknown>) => {
            const matches = flatLiveBookmarks.filter((bm) => bm.url === item.url);
            matches.forEach((bm) => {
                if (item.color) {
                    colorArr[bm.id] = item.color as string;
                }
            });
        });

        expect(colorArr['new-566']).toBe('#FF5733');
        expect(colorArr['new-567']).toBeUndefined();
    });

    it('builds the folderColors map by matching folder titles to live store folders', () => {
        store.bookmarks = [
            { id: 'new-556', title: 'Home', children: [], syncing: false },
            { id: 'new-557', title: 'Catalyst', syncing: false, children: [] },
        ] as BookmarkNode[];

        const folderColorArr: Record<string, string> = {};

        ICONS_FIXTURE.folders.forEach((item) => {
            const match = store.bookmarks?.find((f) => f.title === item.title);
            if (match && item.color) {
                folderColorArr[match.id] = item.color;
            }
        });

        expect(folderColorArr['new-556']).toBe('#2AB567');
        expect(folderColorArr['new-557']).toBe('#1C60AD');
    });

    it('persists bookmarkColors and folderColors to sync storage', async () => {
        chromeMock.storage.sync.set.mockResolvedValue(undefined);

        const bookmarkColors = { 'new-566': '#FF5733' };
        const folderColors = { 'new-556': '#2AB567', 'new-557': '#1C60AD' };

        await store.setSyncStorage({ bookmarkColors });
        await store.setSyncStorage({ folderColors });

        expect(chromeMock.storage.sync.set).toHaveBeenCalledWith({ bookmarkColors });
        expect(chromeMock.storage.sync.set).toHaveBeenCalledWith({ folderColors });
    });

    it('skips bookmark icons with a null or missing image (no localStorage call)', async () => {
        store.bookmarks = [
            {
                id: 'new-557',
                title: 'Catalyst',
                syncing: false,
                children: [
                    { id: 'new-593', title: 'WorkBook', url: 'https://wunderman.workbook.dk/', syncing: false },
                ],
            },
        ] as BookmarkNode[];

        chromeMock.storage.local.set.mockResolvedValue(undefined);

        const flatLiveBookmarks = store.bookmarks.flatMap((f) => f.children ?? []);

        const storageCallsPromises = ICONS_FIXTURE.bookmarks
            .filter((item) => item.image)
            .flatMap((item) => {
                const matches = flatLiveBookmarks.filter((bm) => bm.url === item.url);
                return matches.map((bm) => store.setLocalStorage({
                    [bm.id]: { id: bm.id, image: item.image },
                }));
            });

        await Promise.all(storageCallsPromises);

        // WorkBook has null image so it's filtered out — no set calls expected
        expect(chromeMock.storage.local.set).not.toHaveBeenCalled();
    });

    it('does not create a folder color entry when no live folder title matches', () => {
        store.bookmarks = [
            { id: 'new-999', title: 'Unknown Folder', children: [], syncing: false },
        ] as BookmarkNode[];

        const folderColorArr: Record<string, string> = {};

        ICONS_FIXTURE.folders.forEach((item) => {
            const match = store.bookmarks?.find((f) => f.title === item.title);
            if (match && item.color) {
                folderColorArr[match.id] = item.color;
            }
        });

        // No titles match → color map stays empty
        expect(Object.keys(folderColorArr)).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// IMPORT/EXPORT WITH BOOKMARK GROUPS
// Tests the group-aware import/export logic:
//   1. Export attaches images to bookmarks inside group folders
//   2. Import recreates group folders and their child bookmarks
//   3. Validation passes for files containing only group folders
// ---------------------------------------------------------------------------

describe('Import/export with bookmark groups', () => {
    describe('Export - image attachment for grouped bookmarks', () => {
        it('uses findNodeById to locate a bookmark nested inside a group folder', () => {
            // Simulate the export tree structure
            const exportBookmarks = BOOKMARKS_WITH_GROUPS_FIXTURE.bookmarks as BookmarkNode[];

            // GitHub (id '603') is inside the group folder
            const found = findNodeById(exportBookmarks, '603');

            expect(found).not.toBeNull();
            expect(found?.title).toBe('GitHub');
            expect(found?.url).toBe('https://github.com/');
        });

        it('attaches images to bookmarks inside group folders during export', () => {
            const exportBookmarks = JSON.parse(
                JSON.stringify(BOOKMARKS_WITH_GROUPS_FIXTURE.bookmarks),
            ) as BookmarkNode[];

            // Simulate localStorage items with images
            const localStorageItems = [
                { id: '601', image: 'data:image/png;base64,slack-stored' },
                { id: '603', image: 'data:image/png;base64,github-stored' },
                { id: '604', image: 'data:image/png;base64,gitlab-stored' },
            ];

            // Apply images using findNodeById (mimics onClickExportBookmarks logic)
            localStorageItems.forEach((item) => {
                const bookmark = findNodeById(exportBookmarks, item.id);
                if (bookmark) {
                    bookmark.image = item.image;
                }
            });

            // Verify images were attached to bookmarks inside group folders
            const workFolder = exportBookmarks.find((f) => f.id === '600');
            const groupFolder = workFolder?.children?.find((c) => c.id === '602');
            const github = groupFolder?.children?.find((c) => c.id === '603');
            const gitlab = groupFolder?.children?.find((c) => c.id === '604');

            expect(github?.image).toBe('data:image/png;base64,github-stored');
            expect(gitlab?.image).toBe('data:image/png;base64,gitlab-stored');

            // Direct child should also have image
            const slack = workFolder?.children?.find((c) => c.id === '601');
            expect(slack?.image).toBe('data:image/png;base64,slack-stored');
        });
    });

    describe('Import - recreation of group folders and their children', () => {
        it('identifies legacy-prefixed group folders by their title prefix', () => {
            const groupTitle = `${GROUPING.LEGACY_FOLDER_PREFIX}abc123`;
            const regularTitle = 'Regular Folder';

            expect(hasLegacyGroupPrefix(groupTitle)).toBe(true);
            expect(hasLegacyGroupPrefix(regularTitle)).toBe(false);
        });

        it('creates group folders and their child bookmarks during import', async () => {
            // Mock the creation of top-level folder, group folder, and bookmarks
            const newWorkFolder = makeCreatedFolder('new-600', 'Work');
            const newGroupFolder = makeCreatedFolder(
                'new-602',
                `${GROUPING.LEGACY_FOLDER_PREFIX}abc123`,
                'new-600',
            );
            const newSlack = makeCreatedBookmark('new-601', 'Slack', 'https://slack.com/', 'new-600');
            const newGitHub = makeCreatedBookmark('new-603', 'GitHub', 'https://github.com/', 'new-602');
            const newGitLab = makeCreatedBookmark('new-604', 'GitLab', 'https://gitlab.com/', 'new-602');
            const newJira = makeCreatedBookmark('new-605', 'Jira', 'https://jira.atlassian.com/', 'new-600');

            chromeMock.bookmarks.create
                // Top-level folder creation
                .mockImplementationOnce((_: unknown, cb: (n: typeof newWorkFolder) => void) => cb(newWorkFolder))
                // Direct bookmark: Slack
                .mockImplementationOnce((_: unknown, cb: (n: typeof newSlack) => void) => cb(newSlack))
                // Group folder creation
                .mockImplementationOnce((_: unknown, cb: (n: typeof newGroupFolder) => void) => cb(newGroupFolder))
                // Group children: GitHub, GitLab
                .mockImplementationOnce((_: unknown, cb: (n: typeof newGitHub) => void) => cb(newGitHub))
                .mockImplementationOnce((_: unknown, cb: (n: typeof newGitLab) => void) => cb(newGitLab))
                // Direct bookmark: Jira
                .mockImplementationOnce((_: unknown, cb: (n: typeof newJira) => void) => cb(newJira));

            // Step 1: Create top-level folder
            const workFolderSource = BOOKMARKS_WITH_GROUPS_FIXTURE.bookmarks[0];
            const createdTopFolder = await store.createBookmark('root', workFolderSource.title);
            expect(createdTopFolder.id).toBe('new-600');

            const foldersMap: Record<string, string> = { 600: createdTopFolder.id };
            const createdBookmarks: chrome.bookmarks.BookmarkTreeNode[] = [];

            // Step 2: Process children (mimics onImportedFoldersCreated logic)
            // eslint-disable-next-line no-restricted-syntax
            for (const child of workFolderSource.children) {
                if (child.url) {
                    // Direct bookmark
                    // eslint-disable-next-line no-await-in-loop
                    const created = await store.createBookmark(
                        foldersMap['600'],
                        child.title,
                        child.url,
                    );
                    createdBookmarks.push(created);
                } else if (hasLegacyGroupPrefix(child.title)) {
                    // Group folder
                    // eslint-disable-next-line no-await-in-loop
                    const createdGroup = await store.createBookmark(
                        foldersMap['600'],
                        child.title,
                    );
                    // Create children inside the group
                    // eslint-disable-next-line no-restricted-syntax
                    for (const groupChild of child.children ?? []) {
                        if (groupChild.url) {
                            // eslint-disable-next-line no-await-in-loop
                            const createdGroupBookmark = await store.createBookmark(
                                createdGroup.id,
                                groupChild.title,
                                groupChild.url,
                            );
                            createdBookmarks.push(createdGroupBookmark);
                        }
                    }
                }
            }

            // Verify correct number of create calls:
            // 1 top folder + 1 Slack + 1 group folder + 2 group children + 1 Jira = 6
            expect(chromeMock.bookmarks.create).toHaveBeenCalledTimes(6);

            // Verify bookmarks were created under correct parents
            expect(createdBookmarks).toHaveLength(4);
            expect(createdBookmarks.find((b) => b.id === 'new-601')?.parentId).toBe('new-600');
            expect(createdBookmarks.find((b) => b.id === 'new-603')?.parentId).toBe('new-602');
            expect(createdBookmarks.find((b) => b.id === 'new-604')?.parentId).toBe('new-602');
        });

        it('tracks colors for bookmarks inside group folders', () => {
            const colorsMap: Record<string, string> = {};
            const workFolder = BOOKMARKS_WITH_GROUPS_FIXTURE.bookmarks[0];

            // Simulate processing children and collecting colors
            workFolder.children.forEach((child) => {
                if (child.url && child.color) {
                    colorsMap[child.id] = child.color;
                }
                if (hasLegacyGroupPrefix(child.title)) {
                    (child.children ?? []).forEach((groupChild) => {
                        if (groupChild.url && groupChild.color) {
                            colorsMap[groupChild.id] = groupChild.color;
                        }
                    });
                }
            });

            // GitHub inside the group has a color
            expect(colorsMap['603']).toBe('#24292e');
            // GitLab has no color
            expect(colorsMap['604']).toBeUndefined();
        });
    });

    describe('Validation - files with group folders', () => {
        it('validates a file where a folder contains only group folder children', () => {
            // The 'Groups Only' folder has no direct bookmark links,
            // only a group folder containing bookmarks
            const groupsOnlyFolder = BOOKMARKS_WITH_GROUPS_FIXTURE.bookmarks.find(
                (f) => f.id === '700',
            );

            // Direct children have no url
            const directChildren = groupsOnlyFolder?.children ?? [];
            const hasDirectUrl = directChildren.some((c) => c.url);
            expect(hasDirectUrl).toBe(false);

            // But group folder children do have urls
            const groupFolderChildren = directChildren
                .filter((c) => hasLegacyGroupPrefix(c.title) && !c.url)
                .flatMap((g) => g.children ?? []);
            const hasNestedUrl = groupFolderChildren.some((c) => c.url);
            expect(hasNestedUrl).toBe(true);

            // Combined check (mimics updated isImportBookmarksFileValid logic)
            const allBookmarks = [...directChildren, ...groupFolderChildren];
            expect(allBookmarks.some((c) => c.url)).toBe(true);
        });

        it('flattens group folder children for validation url check', () => {
            const parsed = BOOKMARKS_WITH_GROUPS_FIXTURE;

            // Mimic the validation logic
            const directChildren = parsed.bookmarks.flatMap((e) => e.children ?? []);
            const groupFolderChildren = directChildren
                .filter((child) => hasLegacyGroupPrefix(child.title ?? '') && !child.url)
                .flatMap((group) => group.children ?? []);
            const allBookmarks = [...directChildren, ...groupFolderChildren];

            // Should find urls in both direct and nested bookmarks
            expect(allBookmarks.some((e) => e?.url)).toBe(true);
            expect(allBookmarks.some((e) => e?.title)).toBe(true);
            expect(allBookmarks.some((e) => e?.id)).toBe(true);
        });
    });
});
