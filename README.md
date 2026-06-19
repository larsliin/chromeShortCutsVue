# My Shortcuts Tab

A Chrome Extension (Manifest V3) that replaces your new tab page with a fully customizable bookmarks manager. Organize bookmarks into color-coded, icon-enriched folders, drag-and-drop to reorder, search and filter your links, and import/export your entire setup — all without leaving the browser.

---

## Features

- **Custom new tab page** — your bookmarks are always one tab away
- **Folders with colors & icons** — visually distinguish your bookmark groups
- **Drag-and-drop reordering** — rearrange folders and bookmarks with ease
- **Instant search/filter** — find bookmarks and folder names across all folders in real time
- **Import / Export** — back up and restore your full bookmark set as JSON
- **Dark mode** — follows system preference or can be toggled manually
- **Accordion layout** — compact, collapsible folder view
- **Popup action** — lightweight browser action popup for quick access (only on http/https pages)
- **Auto favicon fetching** — icons are automatically resolved for bookmarked sites

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | Vue 3 (Composition API, `<script setup>`) |
| State Management | Pinia |
| Component Library | Vuetify 3 |
| Build Tool | Vite 5 + `@crxjs/vite-plugin` |
| Drag and Drop | `vuedraggable` |
| Form Validation | `@vuelidate/core` + `@vuelidate/validators` |
| Reactive Utilities | `@vueuse/core` |
| Styling | SCSS + scoped component styles |
| Unit Tests | Vitest + jsdom |
| E2E Tests | Playwright (Chromium) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Development build with hot reload (via CRXJS)
npm run dev

# Production build → dist/
npm run build

# Lint and auto-fix
npm run lint
```

Load the extension in Chrome: open `chrome://extensions`, enable **Developer Mode**, click **Load unpacked**, and select the `dist/` folder.

---

## Running Tests

```bash
# Unit tests (watch mode)
npm test

# Unit tests (single run)
npm run test:run

# Unit tests with coverage report
npm run test:coverage

# E2E tests (requires built extension in dist/)
npm run test:e2e

# Full suite (unit + E2E)
npm run test:all
```

---

## Test Suite

The project uses two testing layers to ensure reliability:

### Unit Tests — Vitest + jsdom (`src/test/`)

**[Vitest](https://vitest.dev/)** with a **jsdom** environment for fast, isolated tests that run without a browser. Chrome extension APIs (`chrome.bookmarks`, `chrome.storage`, `chrome.runtime`, etc.) are fully mocked via a shared mock in `src/test/mocks/chrome.ts`, reset between each test.

**Why Vitest?** It integrates natively with the Vite build toolchain, supports ESM out of the box, and provides near-instant feedback during development. Components are mounted with **Vue Test Utils** and **`createTestingPinia`** via a shared `mountWithPlugins` helper that pre-wires Vuetify and Pinia, keeping test files free of boilerplate.

**What's covered:** store actions, composable utilities, bookmark and folder-name filtering logic, bookmark grouping lifecycle (create group, add to group, ungroup), import/export workflows including grouped bookmark handling, the MV3 service worker (`background.js`), and component rendering.

#### `actions.test.ts` — Pinia Store Action Tests

| Test Group | Description |
|---|---|
| **getBookmarks** | Resolves with the bookmark tree for a given id, propagating Chrome API errors |
| **getBookmarkById / getBookmarkByIdOrNull** | Returns a single bookmark by id; the OrNull variant resolves with `null` instead of rejecting when the id is missing |
| **createBookmark / updateBookmark** | CRUD wrappers around `chrome.bookmarks.create` and `update` |
| **moveBookmark / reorderBookmark** | Move bookmarks between folders or within a folder, asserting the Chrome destination payload |
| **createBookmarkGroup** | Group-creation lifecycle: link-vs-folder constraints, same-id guard, mismatched-parent rejection, nested-group rejection |
| **addBookmarkToGroup** | MAX_ITEMS cap, target-is-not-group rejection, dragged-is-folder rejection, no-op when already in the same group |
| **ungroupBookmarkGroup** | Re-inserts group's link children at the original index then removes the group folder; unregisters the id from the `groupIds` map; no-op when target is not a registered group, missing parentId, or has non-link children |
| **renameBookmarkGroup** | Updates the Chrome folder title for a registered group id; trims input and falls back to the default name when empty; no-op (returns `null`) when the id is not in `groupIds` |
| **migrateLegacyGroupFolders** | One-time migration: registers any folder whose title starts with the legacy `__mst_group__:` prefix in the `groupIds` map and renames it to the default name; no-op when no legacy folders are present or `rootId` is unset |
| **collapseEmptyGroups** | Walks the in-memory tree and ungroups any group folder whose link children have all been removed, leaving populated groups alone; tolerates empty/null bookmarks |
| **Storage wrappers** | Local and sync storage get/set/delete pass-throughs forward errors from `chrome.runtime.lastError` |

#### `bookmarkGroups.util.test.ts` — Group Utility Tests

| Test Group | Description |
|---|---|
| **isGroupFolder** | Identifies group folders by membership in the `groupIds` map and the absence of a url; rejects links even when their id is registered |
| **isBookmarkLink** | Treats any node with a non-empty url as a link; rejects empty-string urls |
| **defaultGroupName** | Returns `GROUPING.DEFAULT_NAME` for new and rename-fallback paths |
| **hasLegacyGroupPrefix** | Legacy-only predicate for detecting old `__mst_group__:` titles during import and migration |
| **getGroupPreviewItems** | Caps preview to `GROUPING.PREVIEW_ITEMS`, drops non-link children, tolerates undefined children |
| **flattenBookmarkLinks** | Recursively collects link descendants from nested folders and groups |
| **findNodeById** | Locates nodes anywhere in the tree (including inside group folders); returns null when absent; stops at first match |

#### `dragIntent.test.ts` — Drag-and-Drop Intent Tests

| Test Group | Description |
|---|---|
| **create group** | Produces a `create` intent when a link is dragged onto another link sharing the parent; rejects when the dragged item is a group, the parent is itself a group, or the siblings have mismatched parents |
| **add to group** | Produces an `add-to-group` intent when a link is dragged onto a group folder; respects `GROUPING.MAX_ITEMS` cap; counts only link children towards the cap |
| **guards** | Returns null when group mode is disabled, when ids are identical, when ids are missing from the visible items, or when the dragged id is empty |

#### `importValidation.test.ts` — Import File Validation Tests

| Test Group | Description |
|---|---|
| **isImportBookmarksFileValid — type/shape gate** | Accepts well-formed bookmarks exports; rejects mismatched `type`, non-array `bookmarks`, empty arrays, or folders missing the title field |
| **isImportBookmarksFileValid — group-aware descendant check** | Accepts files where the only navigable bookmarks live inside group folders; rejects folders with children that have no url anywhere; does not descend into nodes that look like groups but carry a url |
| **isImportIconsFileValid** | Accepts well-formed icons exports; rejects mismatched type, missing `bookmarks`, missing `folders`; accepts presence-only with empty arrays |
| **cross-validation** | A bookmarks file does not pass icon validation and vice-versa |

#### `import-files.test.ts` — Import/Export Workflow Tests

| Test Group | Description |
|---|---|
| **Import bookmarks file** | Tests parsing exported bookmark JSON, creating Chrome folders, building old→new ID maps, and creating child bookmarks under correct parents |
| **Import icons file** | Tests parsing icons JSON, matching bookmarks by URL, setting localStorage for images, and persisting folder/bookmark colors to sync storage |
| **Import/export with bookmark groups** | Tests group-aware export (using `findNodeById` to attach images to nested bookmarks), import (recreating group folders and their children), and validation for files containing only group folder children |

### E2E Tests — Playwright (`e2e/`)

**[Playwright](https://playwright.dev/)** loads the built extension into a real Chromium browser to test user-facing behaviour end-to-end. Tests run sequentially (single worker) to avoid Chrome storage conflicts. A global setup step builds the extension automatically if `dist/` is missing.

**Why Playwright?** It supports loading unpacked Chrome extensions in a real browser context — essential for testing Chrome API interactions (bookmarks, storage, popups) that can't be simulated in jsdom.

**What's covered:** page loading, toolbar interactions, dialog open/close flows, bookmark creation via the UI, and bookmark display from injected Chrome API data.