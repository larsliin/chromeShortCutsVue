# My Shortcuts Tab — Copilot Instructions

---

## Project Overview

**My Shortcuts Tab** is a Chrome Extension (Manifest V3) that replaces the browser's new tab page with a fully customizable bookmarks manager. Users can organize bookmarks into color-coded, icon-enriched folders, drag-and-drop to reorder, search and filter, import/export, and configure appearance.

**Two entry points:**
- `index.html` — new tab page override (full app)
- `popup.html` — browser action popup (lightweight)

**Background:**
- `background.js` — MV3 service worker for Chrome API event handling

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI framework | Vue 3 (Composition API, `<script setup>`) |
| State management | Pinia |
| Component library | Vuetify 3 |
| Build tool | Vite 5 + `@crxjs/vite-plugin` |
| Drag and drop | `vuedraggable` |
| Form validation | `@vuelidate/core` + `@vuelidate/validators` |
| Reactive utilities | `@vueuse/core` |
| Event bus | `mitt` |
| ID generation | `uuid` |
| Utilities | `lodash` (prefer native JS where possible) |
| Icons | `@mdi/js`, `bootstrap-icons-vue` |
| Styling | SCSS (modern-compiler) + scoped component styles |
| Linter | ESLint (Airbnb + Vue 3 rules) |

---

## Project Structure

```
src/
├── App.vue                          # New tab root component
├── AppPopup.vue                     # Popup root component
├── main.js                          # App bootstrap (Vue + Pinia + Vuetify)
├── constants.js                     # All shared constants (FOLDER, EMITS, FILE_NAMES, LOGO_GENERATOR, ARGS)
├── style.css                        # Global base styles
├── models/
│   └── Folder.js                    # UiFolder class (label, name, parentFolderType)
├── views/
│   └── BookmarksView.vue            # Main view — Chrome event listeners, bookmark tree rendering
├── components/
│   ├── bookmarks/
│   │   ├── accordion/               # Folder accordion (expand/collapse, drag-and-drop)
│   │   └── sharedComponents/        # BookmarkLink, tooltip, shared bookmark UI
│   ├── fields/                      # Reusable input fields
│   ├── forms/                       # BookmarkCreateForm, BookmarkSettingsForm, etc.
│   ├── navigation/                  # Navigation bar components
│   └── toolbar/                     # Top toolbar components
└── shared/
    ├── assets/                      # Images, icons
    ├── composables/                 # Shared composables (utils.js, eventBus.js)
    ├── stores/
    │   └── bookmarks/
    │       ├── index.js             # Store definition + state
    │       ├── _actions.js          # All store actions (Chrome API calls, CRUD)
    │       └── _getters.js          # Computed/derived state (keep populated)
    └── use/                         # (reserved for composables)
```

---

## Path Aliases

Always use aliases. Never use relative paths that traverse more than one level.

| Alias | Resolves to |
|-------|-------------|
| `@` | `src/` |
| `@assets` | `src/shared/assets/` |
| `@cmp` | `src/shared/composables/` |
| `@stores` | `src/shared/stores/` |
| `@use` | `src/shared/use/` |

---

## Code Style

### Comments
- Comments must always be on their **own line** — never trailing inline after code
- Only comment non-obvious logic — do not comment self-explanatory code
- Never delete comments that explain magic numbers, config values, or non-obvious constants

### Formatting
- **4-space indentation** (enforced by ESLint)
- `camelCase` for all JavaScript identifiers — no `snake_case` in function or variable names
- `PascalCase` for Vue components and class names
- `UPPER_SNAKE_CASE` for frozen constant objects (e.g. `EMITS`, `FOLDER`, `FILE_NAMES`)

### Vue
- Always use **Composition API with `<script setup>`** — never Options API
- Use `defineProps`, `defineEmits`, `defineExpose` — never `this`
- Prefer `computed()` over methods for derived values
- Keep components under ~150 lines; extract logic to composables or store actions when they grow

### Async
- Use `async/await` throughout — never mix `Promise.then().catch()` chains with `await` in the same function
- Every Chrome API callback must check `chrome.runtime.lastError`

---

## Constants

All shared strings and configuration values live in `src/constants.js`. **Never hardcode** event names, folder type strings, file name strings, or configuration values inline.

Key constants:
- `FOLDER.ROOT` — the root `UiFolder` model (parentFolderType: `'bookmarks-bar'`)
- `EMITS.*` — all event bus and component emit names
- `FILE_NAMES.*` — export file name prefixes
- `LOGO_GENERATOR.*` — logo API domain and token
- `ARGS.*` — shared argument string values

When adding a new string used in more than one place, add it to `constants.js` first.

---

## State Management (Pinia)

### Store location
`src/shared/stores/bookmarks/`

### File responsibilities
| File | Purpose |
|------|---------|
| `index.js` | Store definition (`defineStore`) and **state** only |
| `_actions.js` | All **actions** — Chrome API calls, CRUD, storage operations |
| `_getters.js` | All **getters** — computed/derived values from state |

### Rules
- Declare new state properties in `index.js`
- Add new actions in `_actions.js` — never directly in a component
- Add new computed/derived values in `_getters.js` — never scatter `computed()` logic across components
- Call `useBookmarksStore()` **once per file**, at the top of the setup function — never call it multiple times in the same file

### Store state reference
```js
accordionModel       // active open accordion panels
accordionNavigation  // accordion keyboard nav enabled
bookmarks            // flat/tree bookmark data
bookmarkSearch       // active filter string
dialogOpen           // global dialog visibility
dragStart            // drag-and-drop in progress
editBase64Image      // image data for icon editor
enableDarkMode       // user dark mode preference
enablePreferDarkMode // prefer-dark-mode toggle
enableSystemDarkMode // follow system dark mode
folderColors         // folder color feature enabled
icons                // icon map keyed by bookmark ID
isImporting          // import operation in progress
popup                // running in popup context
rootElem             // root DOM element ref
rootId               // Chrome bookmarks root node ID
sliderIndex          // active slider/tab index
statistics           // bookmark usage statistics
titleInputActive     // folder title input is focused
transition           // animations enabled
transitionDisabled   // animations force-disabled
bookmarksBarId       // Chrome bookmarks bar folder ID
```

---

## Event Bus

The event bus uses **`mitt`** (already installed). Use it for cross-component communication that does not belong in the store.

All event names must come from `EMITS` in `src/constants.js` — never hardcode event name strings.

The emitter instance is injected globally in `main.js` as `app.config.globalProperties.$emitter`. In composables or setup functions, inject it via `inject('emitter')` or import the instance directly.

**Do not** roll a custom event bus using `Map`, `ref`, or raw watchers. Use `mitt`.

---

## Chrome Extension Patterns

### Manifest V3 constraints
- Background scripts are **service workers** — they can be suspended; never rely on module-level variables surviving across events
- Use `chrome.storage.local` or `chrome.storage.sync` for any state that must persist across worker restarts
- Register **all** Chrome event listeners at the **top level** of `background.js` — never nest a listener registration inside another listener callback

### Listener cleanup in Vue components
Every `chrome.*` event listener added in `onMounted` must be removed in `onUnmounted`:

```js
onMounted(() => {
    chrome.bookmarks.onCreated.addListener(onCreated)
    chrome.bookmarks.onRemoved.addListener(onRemoved)
})

onUnmounted(() => {
    chrome.bookmarks.onCreated.removeListener(onCreated)
    chrome.bookmarks.onRemoved.removeListener(onRemoved)
})
```

### Chrome API error handling
Always check `chrome.runtime.lastError` inside every Chrome API callback — failures are silently swallowed otherwise:

```js
chrome.storage.sync.get(['key'], (result) => {
    if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError)
        return
    }
    // use result
})
```

### Chrome API promise wrappers
Wrap Chrome callbacks in promises in a **single shared utility** (e.g. `src/shared/composables/chromeApi.js`) — never inline `new Promise` wrappers repeatedly in `_actions.js`.

---

## Vuetify & Theming

- Set dark/light mode via the `theme` prop on `<v-app>` using Vuetify's `useTheme()` composable
- **Never** toggle dark mode with direct `document.documentElement.classList` or `document.body.classList` manipulation
- When checking color contrast (luminance calculations), cache the `getComputedStyle(el)` result — do not call it on every keystroke or focus event

---

## Component Conventions

### Folder naming
- **Component folders**: camelCase (e.g. `bookmarks/accordion/`, `forms/`)
- **Component files**: PascalCase (e.g. `BookmarksAccordion.vue`, `BookmarkLink.vue`)

### DOM manipulation
**Never** use `document.querySelector`, `document.getElementsByTagName`, or direct `classList` manipulation inside Vue components. Use reactive state and Vue class/style bindings instead.

### Props & emits
- Define all props with `defineProps`
- Define all emits with `defineEmits`
- All emit names must reference `EMITS` constants — never raw strings

---

## Commands

```bash
# Development (hot reload via CRXJS)
npm run dev

# Production build → dist/
npm run build

# Lint and auto-fix
npm run lint
```

Load the extension in Chrome: open `chrome://extensions`, enable Developer Mode, click **Load unpacked**, select the `dist/` folder.

---

## Known Patterns to Follow

| Pattern | How to do it |
|---------|-------------|
| Shared string/config | Add to `src/constants.js` |
| Derived state | Add getter to `_getters.js` |
| Chrome API call | Add action to `_actions.js`, check `lastError` |
| Chrome callback → Promise | Wrap once in `src/shared/composables/chromeApi.js` |
| Cross-component event | Use `mitt` with an `EMITS.*` constant |
| Repeated folder traversal | One `searchFolder()` utility, imported everywhere |
| Color management | One store action, called from all components |
| Dark mode toggle | `useTheme()` from Vuetify |
| Magic number / timeout | Named constant in `constants.js` |

## Known Anti-Patterns to Avoid

| Anti-pattern | Why |
|-------------|-----|
| `snake_case` function names in JS | Violates ESLint Airbnb + project convention |
| `useBookmarksStore()` called multiple times per file | Creates redundant store subscriptions |
| `new Promise` wrappers inlined in `_actions.js` | Duplicate code — extract to shared utility |
| `_getters.js` left empty | Derived state ends up scattered in components |
| Chrome listeners without `onUnmounted` cleanup | Memory leak — listeners accumulate on each mount |
| Nested listener registration in `background.js` | Listeners re-register on every event, causing duplicates |
| Direct `classList`/`querySelector` in components | Bypasses Vue reactivity |
| `Promise.then().catch()` mixed with `await` | Inconsistent async style |
| Hardcoded event name strings | Use `EMITS.*` constants |
| Hardcoded timeouts (e.g. `setTimeout(..., 1000)`) | Use named constants |
