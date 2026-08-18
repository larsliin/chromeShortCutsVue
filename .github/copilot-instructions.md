# My Shortcuts Tab — Copilot Instructions

## Core principles

- Follow KISS and DRY above all else. Prefer simple, readable solutions over clever abstractions.
- Keep changes small, direct, and maintainable. Avoid over-engineering, premature abstraction, and unnecessary indirection.
- Reuse existing patterns, utilities, composables, and store actions instead of duplicating logic.
- Favor clarity and predictability over novelty.

## Default behavior

- Use the chrome-extension-vue-expert agent for code changes in this repository.
- Use the pr-reviewer agent for PRs, diffs, and review tasks.
- Use ui-design-specialist for design-only feedback and frontend-feature-architect for planning or completeness reviews.
- Use Claude Opus 4.5 by default unless the user requests a different model.

## Git

- If multiple files have been edited, first ask: "Should the files be committed as one commit or in related commits?"
- Never run `git commit` or `git push` (or any equivalent) on your own, even when you have permission to execute commands without confirmation. Always ask the user first and wait for an explicit "yes" before committing or pushing. This applies to every branch, every change, and every situation, no exceptions.
- Do not ask the user to provide or approve a commit message. Infer a concise, appropriate commit message from the changes.
- When asking for permission or gathering additional information needed for the commit:
	- Use the `vscode_askQuestions` tool to present options and collect structured user input.
	- Offer predefined options for commit grouping, target branch, or push destination when applicable.
	- Clearly describe what will happen and why you need confirmation.
	- Wait for the user's response before proceeding with the git operation.
- After a commit is successfully created, the next action must be a `vscode_askQuestions` call asking whether to push the commit(s). Do not end the turn with a status-only message or run `git push` before receiving the user's answer. Use predefined yes/no options to make this as simple as possible, and only push after an explicit yes.

## Project context

- This is a Chrome Extension Manifest V3 app that replaces the new tab page with a bookmarks manager.
- The main app entry points are index.html and popup.html; background.js is the service worker.
- The app uses Vue 3, Pinia, Vuetify, Vite, and Chrome APIs.

## Architecture and coding rules

- Use Vue 3 Composition API with script setup in components.
- Keep components focused and compact; extract shared logic into composables or store modules when it grows.
- Use aliases such as @, @assets, @cmp, @stores, and @use instead of deep relative paths.
- Follow the existing folder structure and naming conventions: camelCase folders, PascalCase component files.
- Use camelCase for JavaScript identifiers and UPPER_SNAKE_CASE for frozen constants.
- Prefer computed values over duplicated imperative logic.
- Use async/await consistently and check chrome.runtime.lastError for Chrome API callbacks.
- Keep comments rare and meaningful; avoid commenting obvious code.
- Keep comments short and concise; do not write comments that span more than two lines.
- Use single-line // comments only; never use /* */ or /** */ block comments.

## State and shared logic

- Keep shared strings and config in src/constants.
- Keep Pinia state in the store index, actions in _actions.js, and derived values in _getters.js.
- Add new store logic to the appropriate store module instead of scattering it across components.
- Use mitt with EMITS constants for cross-component events.
- Avoid custom event systems or ad-hoc state patterns when an existing solution already fits.
- Keep the store usage simple: call useBookmarksStore() once per file and keep derived state in getters instead of components.

## Chrome extension patterns

- Treat service worker state as ephemeral; persist anything that must survive reloads with chrome.storage.local or chrome.storage.sync.
- Register Chrome listeners at the top level and clean them up in onUnmounted.
- Centralize Chrome callback-to-promise wrapping in the shared chrome API utility instead of duplicating wrappers.

## UI and implementation rules

- Use Vuetify theming via useTheme() and the theme prop on v-app.
- Avoid direct DOM manipulation in components. Prefer reactive state and Vue bindings.
- Keep styles scoped and use existing design patterns instead of introducing one-off styling approaches.
- Prefer accessible, simple UI behavior that is easy to understand and maintain.

## Quality bar

- Write the smallest change that solves the problem well.
- Reuse existing utilities and conventions before introducing new abstractions.
- Keep comments rare and meaningful; avoid commenting obvious code.
- Follow the project’s linting and formatting rules.

## Testing and docs

- Add or update tests alongside behavior changes.
- Keep README in sync whenever tests are added, removed, or changed.
- Prefer existing test patterns and real behavior over brittle mock-heavy tests.

## Commands

- npm run dev for development
- npm run build for production
- npm run lint for linting and auto-fixes

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
| `@import` in SCSS files | Deprecated in Dart Sass 3 — use `@use` or `@forward` instead |