import { describe, it, expect } from 'vitest';
import { GROUPING } from '@/constants';
import {
    isImportBookmarksFileValid,
    isImportIconsFileValid,
} from '@utils/importValidation';

// ---------------------------------------------------------------------------
// Helper builders
// ---------------------------------------------------------------------------

function buildBookmarksFile(overrides: Record<string, unknown> = {}) {
    return {
        type: 'bookmarks',
        bookmarks: [
            {
                id: 'f1',
                parentId: 'root',
                title: 'Work',
                children: [
                    {
                        id: 'b1',
                        parentId: 'f1',
                        title: 'GitHub',
                        url: 'https://github.com/',
                    },
                ],
            },
        ],
        ...overrides,
    };
}

function buildIconsFile(overrides: Record<string, unknown> = {}) {
    return {
        type: 'icons',
        folders: [{ id: 'f1', color: '#fff', title: 'Work' }],
        bookmarks: [{
            id: 'b1', parentId: 'f1', title: 'GitHub', url: 'https://github.com/', image: null,
        }],
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// isImportBookmarksFileValid
// ---------------------------------------------------------------------------

describe('isImportBookmarksFileValid — type/shape gate', () => {
    it('accepts a well-formed bookmarks export', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(isImportBookmarksFileValid(buildBookmarksFile() as any)).toBe(true);
    });

    it('rejects when the type field is not "bookmarks"', () => {
        const file = buildBookmarksFile({ type: 'icons' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(isImportBookmarksFileValid(file as any)).toBe(false);
    });

    it('rejects when bookmarks is not an array', () => {
        const file = { type: 'bookmarks', bookmarks: 'oops' as unknown as [] };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(isImportBookmarksFileValid(file as any)).toBe(false);
    });

    it('rejects an empty bookmarks array (top-level metadata fields all fail)', () => {
        const file = { type: 'bookmarks', bookmarks: [] };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(isImportBookmarksFileValid(file as any)).toBe(false);
    });

    it('rejects when every folder is missing the title field', () => {
        const file = buildBookmarksFile();
        delete (file.bookmarks[0] as Record<string, unknown>).title;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(isImportBookmarksFileValid(file as any)).toBe(false);
    });
});

describe('isImportBookmarksFileValid — group-aware descendant check', () => {
    it('accepts a folder whose only navigable children live inside a group folder', () => {
        const file = {
            type: 'bookmarks',
            bookmarks: [
                {
                    id: 'f1',
                    parentId: 'root',
                    title: 'Groups Only',
                    children: [
                        {
                            id: 'g1',
                            parentId: 'f1',
                            title: `${GROUPING.FOLDER_PREFIX}only`,
                            children: [
                                {
                                    id: 'b1',
                                    parentId: 'g1',
                                    title: 'GitHub',
                                    url: 'https://github.com/',
                                },
                            ],
                        },
                    ],
                },
            ],
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(isImportBookmarksFileValid(file as any)).toBe(true);
    });

    it('rejects when a folder has children but no child anywhere has a url', () => {
        const file = {
            type: 'bookmarks',
            bookmarks: [
                {
                    id: 'f1',
                    parentId: 'root',
                    title: 'F1',
                    children: [
                        // No url anywhere — should fail validation.
                        { id: 'b1', parentId: 'f1', title: 'GitHub' },
                    ],
                },
            ],
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(isImportBookmarksFileValid(file as any)).toBe(false);
    });

    it('does not descend into a folder that only LOOKS like a group (group-title but has url)', () => {
        // The group descent only treats nodes WITHOUT a url as group folders;
        // a node with a url is treated as a regular bookmark link.
        const file = {
            type: 'bookmarks',
            bookmarks: [
                {
                    id: 'f1',
                    parentId: 'root',
                    title: 'F1',
                    children: [
                        {
                            id: 'fake',
                            parentId: 'f1',
                            title: `${GROUPING.FOLDER_PREFIX}fake`,
                            url: 'https://example.com/',
                            children: [{ id: 'inner', parentId: 'fake' }],
                        },
                    ],
                },
            ],
        };
        // The fake "group" link itself has a url so the validator accepts.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(isImportBookmarksFileValid(file as any)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// isImportIconsFileValid
// ---------------------------------------------------------------------------

describe('isImportIconsFileValid', () => {
    it('accepts a well-formed icons export', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(isImportIconsFileValid(buildIconsFile() as any)).toBe(true);
    });

    it('rejects when the type field is not "icons"', () => {
        const file = buildIconsFile({ type: 'bookmarks' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(isImportIconsFileValid(file as any)).toBe(false);
    });

    it('rejects when bookmarks is missing', () => {
        const file = buildIconsFile();
        delete (file as Record<string, unknown>).bookmarks;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(isImportIconsFileValid(file as any)).toBe(false);
    });

    it('rejects when folders is missing', () => {
        const file = buildIconsFile();
        delete (file as Record<string, unknown>).folders;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(isImportIconsFileValid(file as any)).toBe(false);
    });

    it('accepts even when folders and bookmarks are empty arrays (presence-only check)', () => {
        // The current contract is intentionally lenient: type === 'icons' plus
        // the two array fields being present (even empty) is enough.
        const file = { type: 'icons', folders: [], bookmarks: [] };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(isImportIconsFileValid(file as any)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Cross-validation: a bookmarks file must NOT pass as icons and vice-versa.
// This guards against the two file types accidentally accepting each other.
// ---------------------------------------------------------------------------

describe('cross-validation', () => {
    it('a bookmarks file does not validate as an icons file', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(isImportIconsFileValid(buildBookmarksFile() as any)).toBe(false);
    });

    it('an icons file does not validate as a bookmarks file', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(isImportBookmarksFileValid(buildIconsFile() as any)).toBe(false);
    });
});
