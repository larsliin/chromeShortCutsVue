import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'url';

export default defineConfig({
    plugins: [
        vue(),
        // Stub .css side-effect imports so that Vuetify component CSS files do
        // not throw "Unknown file extension" errors in the Node.js ESM test runner.
        // This plugin runs when Vuetify is processed through the Vite pipeline
        // (enabled by test.server.deps.inline below).
        {
            name: 'stub-css',
            load(id) {
                if (id.endsWith('.css')) {
                    return { code: '' };
                }
                return undefined;
            },
        },
    ],
    resolve: {
        alias: [
            { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
            { find: '@assets', replacement: fileURLToPath(new URL('./src/shared/assets', import.meta.url)) },
            { find: '@cmp', replacement: fileURLToPath(new URL('./src/shared/composables', import.meta.url)) },
            { find: '@stores', replacement: fileURLToPath(new URL('./src/shared/stores', import.meta.url)) },
            { find: '@use', replacement: fileURLToPath(new URL('./src/shared/use', import.meta.url)) },
        ],
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/test/**/*.test.ts'],
        // Verbose output locally; dot reporter on CI to keep logs clean
        reporters: process.env.CI ? ['dot'] : ['verbose'],
        // Process Vuetify through Vite's plugin pipeline so that the stub-css
        // plugin above can intercept its .css side-effect imports.
        server: {
            deps: {
                inline: ['vuetify'],
            },
        },
        coverage: {
            provider: 'v8',
            reporter: ['text'],
            include: [
                'src/shared/stores/bookmarks/_actions.ts',
                'src/shared/stores/bookmarks/_getters.ts',
                'src/shared/composables/utils.ts',
                'background.js',
            ],
            thresholds: {
                lines: 60,
                functions: 60,
            },
        },
    },
});