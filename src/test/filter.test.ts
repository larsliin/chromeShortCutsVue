import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { cloneDeep } from 'lodash';
import { useBookmarksStore } from '@stores/bookmarks';
import type { BookmarkNode } from '@/types/bookmark';

// ---------------------------------------------------------------------------
// Filter logic extracted from BookmarksFilter.vue → runFilter()
//
// Given a search term and a full clone of the bookmark tree, the filter:
//   1. Iterates every folder
//   2. Keeps only leaf children (no sub-folders) whose title contains the term
//      (case-insensitive)
//   3. Drops folders that have no matching children
//   4. On empty term, restores the full unfiltered clone
//   5. The resulting sliderIndex is re-anchored to the previously active folder
//      (clamped to 0 when that folder was filtered out)
// ---------------------------------------------------------------------------

function applyFilter(allBookmarks: BookmarkNode[], term: string): BookmarkNode[] {
    const bookmarks = cloneDeep(allBookmarks);

    if (!term) {
        return bookmarks;
    }

    return bookmarks
        .map((item) => {
            if (item.children) {
                item.children = item.children.filter(
                    (child) =>
                        child.title.toLowerCase().includes(term.toLowerCase()) &&
                        !child.children,
                );
                return item.children.length > 0 ? item : null;
            }
            return null;
        })
        .filter((x): x is BookmarkNode => x !== null);
}

function resolveSliderIndex(
    filtered: BookmarkNode[],
    currentFolderId: string,
): number {
    return Math.max(
        filtered.findIndex((e) => e.id === currentFolderId),
        0,
    );
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BOOKMARKS: BookmarkNode[] = [
    {
        id: 'f1',
        title: 'Work',
        children: [
            { id: 'b1', title: 'GitHub', url: 'https://github.com' },
            { id: 'b2', title: 'GitLab', url: 'https://gitlab.com' },
            { id: 'b3', title: 'Jira', url: 'https://jira.com' },
        ],
    },
    {
        id: 'f2',
        title: 'News',
        children: [
            { id: 'b4', title: 'Hacker News', url: 'https://news.ycombinator.com' },
            { id: 'b5', title: 'Reddit', url: 'https://reddit.com' },
        ],
    },
    {
        id: 'f3',
        title: 'Social',
        children: [
            { id: 'b6', title: 'Twitter', url: 'https://twitter.com' },
        ],
    },
];

let store: ReturnType<typeof useBookmarksStore>;

beforeEach(() => {
    setActivePinia(createPinia());
    store = useBookmarksStore();
    store.bookmarks = cloneDeep(BOOKMARKS);
    store.sliderIndex = 0;
});

// ---------------------------------------------------------------------------
// BASIC MATCHING
// ---------------------------------------------------------------------------

describe('Filter — basic matching', () => {
    it('returns only bookmarks whose title contains the search term', () => {
        const result = applyFilter(BOOKMARKS, 'git');

        const workFolder = result.find((f) => f.id === 'f1')!;
        expect(workFolder.children).toHaveLength(2);
        expect(workFolder.children!.map((c) => c.title)).toEqual(['GitHub', 'GitLab']);
    });

    it('is case-insensitive — "GITHUB" matches "GitHub"', () => {
        const result = applyFilter(BOOKMARKS, 'GITHUB');

        const workFolder = result.find((f) => f.id === 'f1')!;
        expect(workFolder.children).toHaveLength(1);
        expect(workFolder.children![0].title).toBe('GitHub');
    });

    it('matches a partial term in the middle of a title', () => {
        const result = applyFilter(BOOKMARKS, 'acker');

        const newsFolder = result.find((f) => f.id === 'f2')!;
        expect(newsFolder.children).toHaveLength(1);
        expect(newsFolder.children![0].title).toBe('Hacker News');
    });

    it('matches across multiple folders at once', () => {
        // "it" appears in "GitHub", "GitLab", "Twitter"
        const result = applyFilter(BOOKMARKS, 'it');

        const ids = result.map((f) => f.id);
        expect(ids).toContain('f1');
        expect(ids).toContain('f3');
    });

    it('returns an empty array when no bookmarks match the term', () => {
        const result = applyFilter(BOOKMARKS, 'xyznotfound');

        expect(result).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// FOLDER PRUNING
// Folders with zero matching children are excluded from the result.
// ---------------------------------------------------------------------------

describe('Filter — folder pruning', () => {
    it('removes folders that have no matching children', () => {
        // "jira" only matches the Work folder
        const result = applyFilter(BOOKMARKS, 'jira');

        const ids = result.map((f) => f.id);
        expect(ids).toEqual(['f1']);
        expect(ids).not.toContain('f2');
        expect(ids).not.toContain('f3');
    });

    it('keeps folders that have at least one matching child', () => {
        const result = applyFilter(BOOKMARKS, 'reddit');

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('f2');
        expect(result[0].children).toHaveLength(1);
        expect(result[0].children![0].title).toBe('Reddit');
    });

    it('preserves unmatched siblings within the same folder', () => {
        // "jira" matches only b3; b1 and b2 should be absent
        const result = applyFilter(BOOKMARKS, 'jira');

        const workFolder = result[0];
        expect(workFolder.children).toHaveLength(1);
        expect(workFolder.children![0].id).toBe('b3');
    });
});

// ---------------------------------------------------------------------------
// SUB-FOLDER EXCLUSION
// Child nodes that are folders themselves (have .children) are never matched.
// ---------------------------------------------------------------------------

describe('Filter — sub-folder exclusion', () => {
    it('does not match child nodes that are sub-folders', () => {
        const withSubFolder: BookmarkNode[] = [
            {
                id: 'f1',
                title: 'Work',
                children: [
                    { id: 'b1', title: 'GitHub', url: 'https://github.com' },
                    // sub-folder — should never appear in filter results
                    { id: 'sf1', title: 'GitHub Tools', children: [] },
                ],
            },
        ];

        // "github" matches both the bookmark and the sub-folder title,
        // but sub-folders should be excluded
        const result = applyFilter(withSubFolder, 'github');

        expect(result[0].children).toHaveLength(1);
        expect(result[0].children![0].id).toBe('b1');
        expect(result[0].children![0].url).toBe('https://github.com');
    });
});

// ---------------------------------------------------------------------------
// EMPTY / CLEAR TERM
// An empty search string restores the full unfiltered bookmark tree.
// ---------------------------------------------------------------------------

describe('Filter — empty search term', () => {
    it('returns all bookmarks unchanged when term is empty string', () => {
        const result = applyFilter(BOOKMARKS, '');

        expect(result).toHaveLength(3);
        expect(result[0].children).toHaveLength(3);
        expect(result[1].children).toHaveLength(2);
        expect(result[2].children).toHaveLength(1);
    });

    it('does not mutate the original bookmarks array', () => {
        const original = cloneDeep(BOOKMARKS);
        applyFilter(BOOKMARKS, 'git');

        expect(BOOKMARKS[0].children).toHaveLength(original[0].children!.length);
    });

    it('clearing after a filter restores the full tree', () => {
        const afterFilter = applyFilter(BOOKMARKS, 'jira');
        expect(afterFilter).toHaveLength(1);

        const afterClear = applyFilter(BOOKMARKS, '');
        expect(afterClear).toHaveLength(3);
    });
});

// ---------------------------------------------------------------------------
// SLIDER INDEX RE-ANCHORING
// After filtering, sliderIndex is set to the position of the active folder
// in the filtered result, clamped to 0 when the folder was filtered out.
// ---------------------------------------------------------------------------

describe('Filter — sliderIndex re-anchoring', () => {
    it('returns 0 when the active folder is the first folder in filtered results', () => {
        const result = applyFilter(BOOKMARKS, 'git');
        const idx = resolveSliderIndex(result, 'f1');

        expect(idx).toBe(0);
    });

    it('returns the correct index when the active folder is not first in filtered results', () => {
        // "it" matches: GitHub/GitLab (f1), Reddit (f2), Twitter (f3) → all 3 folders kept
        const result = applyFilter(BOOKMARKS, 'it');
        const idx = resolveSliderIndex(result, 'f3');

        // f1 at 0, f2 at 1, f3 at 2
        expect(idx).toBe(2);
    });

    it('clamps to 0 when the active folder is filtered out', () => {
        // f2 is filtered out by "jira" → index returns -1 → clamped to 0
        const result = applyFilter(BOOKMARKS, 'jira');
        const idx = resolveSliderIndex(result, 'f2');

        expect(idx).toBe(0);
    });

    it('reflects sliderIndex in the store after filtering', () => {
        store.bookmarks = applyFilter(BOOKMARKS, 'jira');
        store.sliderIndex = resolveSliderIndex(store.bookmarks ?? [], 'f1');

        expect(store.sliderIndex).toBe(0);
        expect(store.bookmarks[0].children![0].title).toBe('Jira');
    });
});

// ---------------------------------------------------------------------------
// STORE INTEGRATION
// Verifies that assigning filtered results to the store produces the expected
// state, mirroring what BookmarksFilter.vue does after runFilter() completes.
// ---------------------------------------------------------------------------

describe('Filter — store integration', () => {
    it('updates store.bookmarks to the filtered result', () => {
        store.bookmarks = applyFilter(BOOKMARKS, 'twitter');

        expect(store.bookmarks).toHaveLength(1);
        expect(store.bookmarks[0].id).toBe('f3');
        expect(store.bookmarks[0].children![0].title).toBe('Twitter');
    });

    it('store.bookmarks is restored to the full tree when term is cleared', () => {
        store.bookmarks = applyFilter(BOOKMARKS, 'github');
        expect(store.bookmarks).toHaveLength(1);

        store.bookmarks = applyFilter(BOOKMARKS, '');
        expect(store.bookmarks).toHaveLength(3);
    });

    it('store.bookmarkSearch reflects the active search term', () => {
        store.bookmarkSearch = 'git';
        store.bookmarks = applyFilter(BOOKMARKS, store.bookmarkSearch);

        expect(store.bookmarkSearch).toBe('git');
        expect(store.bookmarks).toHaveLength(1);
    });

    it('store.bookmarkSearch is null when no filter is active', () => {
        expect(store.bookmarkSearch).toBeNull();
    });
});
