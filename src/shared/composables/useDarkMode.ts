import { useTheme } from 'vuetify';
import { useBookmarksStore } from '@stores/bookmarks';

export function useDarkMode() {
    const theme = useTheme();
    const bookmarksStore = useBookmarksStore();

    // Sets store dark mode flags and applies the Vuetify theme
    function applyDarkMode(darkMode: unknown, systemDarkMode: unknown): void {
        bookmarksStore.enablePreferDarkMode = !!darkMode;
        bookmarksStore.enableSystemDarkMode = !!systemDarkMode;

        if (bookmarksStore.enableSystemDarkMode) {
            bookmarksStore.enableDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        } else if (bookmarksStore.enablePreferDarkMode) {
            bookmarksStore.enableDarkMode = true;
        } else {
            bookmarksStore.enableDarkMode = false;
        }

        theme.global.name.value = bookmarksStore.enableDarkMode ? 'dark' : 'light';
    }

    // Re-applies system color scheme preference when mounting
    function syncSystemTheme(): void {
        if (bookmarksStore.enableSystemDarkMode) {
            theme.global.name.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
    }

    return { applyDarkMode, syncSystemTheme };
}
