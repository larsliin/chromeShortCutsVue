import { useTheme } from 'vuetify';
import { useBookmarksStore } from '@stores/bookmarks';

const systemPrefersDark = (): boolean => window.matchMedia('(prefers-color-scheme: dark)').matches;

export function useDarkMode() {
    const theme = useTheme();
    const bookmarksStore = useBookmarksStore();

    function setThemeName(dark: boolean): void {
        theme.global.name.value = dark ? 'dark' : 'light';
    }

    // Sets store dark mode flags and applies the Vuetify theme.
    // Priority: system setting > preferred dark mode > light.
    function applyDarkMode(darkMode: unknown, systemDarkMode: unknown): void {
        bookmarksStore.enablePreferDarkMode = !!darkMode;
        bookmarksStore.enableSystemDarkMode = !!systemDarkMode;
        bookmarksStore.enableDarkMode = bookmarksStore.enableSystemDarkMode
            ? systemPrefersDark()
            : bookmarksStore.enablePreferDarkMode;

        setThemeName(bookmarksStore.enableDarkMode);
    }

    // Re-applies system color scheme preference when mounting
    function syncSystemTheme(): void {
        if (bookmarksStore.enableSystemDarkMode) {
            setThemeName(systemPrefersDark());
        }
    }

    return { applyDarkMode, syncSystemTheme };
}
