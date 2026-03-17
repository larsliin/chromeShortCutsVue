# My Shortcuts Tab

A Chrome Extension (Manifest V3) that replaces your new tab page with a fully customizable bookmarks manager. Organize bookmarks into color-coded, icon-enriched folders, drag-and-drop to reorder, search and filter your links, and import/export your entire setup — all without leaving the browser.

---

## Features

- **Custom new tab page** — your bookmarks are always one tab away
- **Folders with colors & icons** — visually distinguish your bookmark groups
- **Drag-and-drop reordering** — rearrange folders and bookmarks with ease
- **Instant search/filter** — find any bookmark across all folders in real time
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

# E2E tests (requires built extension in dist/)
npm run test:e2e

# Full suite (unit + E2E)
npm run test:all
```

---

## Test Suite

The project has two test suites: **unit tests** (Vitest) covering store actions, getters, and utilities, and **end-to-end tests** (Playwright) that run the full extension in a real Chromium browser.

### Unit Tests (`src/test/`)

All unit tests mock the Chrome extension APIs via a shared mock in `src/test/mocks/chrome.ts`, which simulates `chrome.bookmarks`, `chrome.storage`, `chrome.runtime`, `chrome.tabs`, and `chrome.action`. Mocks are reset between each test.

---

#### `utils.test.ts` — Composable Utilities

Tests the shared utility functions in `src/shared/composables/utils.ts`.

| Test Group | What it covers |
|---|---|
| **setSliderIndex** | Sets the active folder index; clamps negative or out-of-bounds values; conditionally persists to sync storage |
| **getStoredBookmarkById** | Finds a bookmark by ID in nested folder structures; returns `null` for missing IDs or null state |
| **getBookmarksAsFlatArr** | Returns a flat array of all bookmarks; returns `null` when `rootId` is not set |
| **updateAccordionModel** | Removes a panel index and shifts higher indices down; handles null accordion state |
| **buildRootFolder** | Locates the root folder in the bookmarks bar or creates it if missing |
| **isValidURL** | Validates `http` and `https` URLs; rejects plain strings and empty input |

---

#### `getters.test.ts` — Pinia Store Getters

Tests the computed getters in `src/shared/stores/bookmarks/_getters.ts`.

| Test Group | What it covers |
|---|---|
| **currentFolder** | Returns the folder at the current `sliderIndex`; returns `null` for null bookmarks, null index, or out-of-bounds index |

---

#### `actions.test.ts` — Pinia Store Actions (Chrome API wrappers)

Tests every Chrome API wrapper action in `src/shared/stores/bookmarks/_actions.ts`. Each action is tested for both the happy path (resolves with data) and the error path (`chrome.runtime.lastError` set).

| Action | What it covers |
|---|---|
| `get_bookmarks` | Fetches bookmark subtree by ID |
| `get_bookmarkById` | Fetches a single bookmark; rejects with "Bookmark not found" on empty result |
| `get_folderByTitle` | Searches for a folder by title; resolves with empty array when not found |
| `create_bookmark` | Creates a bookmark or folder node |
| `update_bookmark` | Updates bookmark title or URL |
| `remove_bookmark` | Removes a single bookmark node |
| `remove_bookmarkFolder` | Removes an entire folder tree |
| `move_bookmark` | Moves a bookmark to a new parent or position |
| `get_tree` | Fetches the full Chrome bookmark tree |
| `get_colorizedBookmarks` | Merges stored folder/bookmark colors into the tree; propagates rejections |
| `set_localStorage` | Writes a value to `chrome.storage.local` |
| `get_localStorage` | Reads a value; resolves `undefined` when key absent |
| `get_syncStorage` | Reads a value from `chrome.storage.sync` |
| `delete_localStorageItem` | Removes an item from local storage; rejects on error |

---

#### `bookmark-features.test.ts` — High-Level Bookmark Workflows

Tests the end-to-end flows that compose multiple store actions together.

| Test Group | What it covers |
|---|---|
| **Add bookmark** | Creates a folder without a URL; creates a bookmark with URL inside a folder; full create-folder-then-add-bookmark sequence |
| **Delete bookmark** | Calls `chrome.bookmarks.remove` for a leaf bookmark; calls `chrome.bookmarks.removeTree` for a folder; removes bookmark/folder from local state; rejects on Chrome API errors |
| **Reorder bookmark** | Calls `chrome.bookmarks.move` with the correct index for same-folder reordering; rejects on error |
| **Export bookmarks** | Resolves all stored items; produces correctly structured export JSON `{ bookmarks, type: 'bookmarks' }`; merges icon images from local storage; rejects on storage errors |
| **Import bookmarks** | Parses import JSON; creates a new Chrome folder for every entry; maps old folder IDs to new IDs and places bookmarks correctly; handles empty folders; rejects on Chrome API errors |

---

#### `background.test.ts` — Service Worker

Tests the MV3 service worker in `background.js`.

| Test Group | What it covers |
|---|---|
| **Listener registration** | Verifies `onInstalled`, `onActivated`, and `onUpdated` are registered at the top level of the module (not nested inside callbacks — validates a specific bug fix) |
| **onInstalled handler** | Skips folder creation when the bookmarks bar node is missing; does nothing on `"update"` reason; skips creation when root folder already exists; creates the root folder on fresh install |
| **Tab popup toggling** | Disables the action popup for non-http/https URLs; enables `popup.html` for `https` URLs via `onActivated`; disables popup on `onUpdated` when new URL is non-http; does nothing when `changeInfo` has no URL |

---

#### `import-files.test.ts` — Import Bookmarks & Icons Files

Tests the logic that processes the two exported file formats produced by the app: a bookmarks JSON file and an icons JSON file. Fixtures are representative slices that match the exact shape of the real files in `files/exports/`.

**Import bookmarks file** (`{ bookmarks: Folder[], type: 'bookmarks' }`)

| Test | What it covers |
|---|---|
| Parses folder count and structure | Reads 3 folders from the fixture and verifies `type`, folder titles |
| Parses child bookmark fields | Verifies `title`, `url`, and `parentId` on bookmark children |
| Creates a Chrome folder per top-level folder | Calls `create_bookmark` once per folder; verifies titles on results |
| Builds the `oldId → newId` folder map | Maps each old folder ID to the newly assigned Chrome ID |
| Creates bookmarks under the correct new folder IDs | Uses the folder map to route each child to the right new parent; asserts correct `parentId` on created nodes |
| Skips creation for empty folders | Confirms no extra `create_bookmark` calls when a folder has no children |
| Full end-to-end import flow | 3 folders + 3 bookmarks = 6 total `create_bookmark` calls; verifies all parent assignments |

**Import icons file** (`{ folders: FolderIcon[], bookmarks: BookmarkIcon[], type: 'icons' }`)

| Test | What it covers |
|---|---|
| Parses folder and bookmark icon arrays | Reads 2 folder icons and 3 bookmark icons from the fixture |
| Reads folder colors | Verifies `color` and `title` on each folder icon entry |
| Reads bookmark image data | Verifies `url` and `data:image/png;base64,…` image string |
| Matches bookmark icons to live store bookmarks by URL | Calls `set_localStorage` with image data for each URL match; asserts correct payload shape |
| Builds `bookmarkColors` map | Only adds color entries for bookmark icons that include a `color` field |
| Builds `folderColors` map | Matches folder icons to live store folders by title; maps new folder ID to color |
| Persists both color maps to sync storage | Calls `set_syncStorage` with `bookmarkColors` and `folderColors` |
| Skips icons with null image | No `set_localStorage` call when the bookmark icon's `image` is `null` |
| Handles unmatched folder titles | No color entry created when no live folder title matches the icon entry |

---

### E2E Tests (`e2e/`)

E2E tests load the built extension into a real Chromium browser using Playwright. Tests run sequentially (non-parallel) to avoid shared Chrome storage conflicts. A global setup step builds the extension before any test runs.

#### `newtab.spec.ts` — New Tab Page

| Test Group | What it covers |
|---|---|
| **Loading** | Page loads without console errors; document title is set correctly |
| **Toolbar** | Add-bookmark button, settings button, and filter input are all visible |
| **Add-bookmark dialog** | Opens when the add button is clicked; closes when Cancel is clicked |
| **Settings dialog** | Opens when the settings button is clicked; closes when Close is clicked; dark mode switch and accordion layout switch are present |
| **Bookmark creation via UI** | Creates a new folder and bookmark through the form UI; verifies the folder appears in the accordion headers after saving |
| **Bookmarks display** | Injects a folder and bookmark directly via the Chrome bookmarks API; reloads the page and verifies the folder title is rendered in the accordion |

