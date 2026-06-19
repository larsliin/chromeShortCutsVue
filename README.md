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
| **createBookmarkGroup / addBookmarkToGroup** | Group-creation lifecycle: validates link-vs-folder constraints, parent matching, nested-group rejection, and the MAX_ITEMS cap |
| **ungroupBookmarkGroup** | Re-inserts a group's link children at the group folder's original index then removes the now-empty group folder |
| **collapseEmptyGroups** | Walks the in-memory tree and ungroups any group folder whose link children have all been removed |
| **Storage wrappers** | Local and sync storage get/set/delete pass-throughs forward errors from `chrome.runtime.lastError` |

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