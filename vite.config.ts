import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'url';
import { resolve } from 'path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: [
            {
                find: '@',
                replacement: fileURLToPath(new URL('./src', import.meta.url)),
            },
            {
                find: '@assets',
                replacement: fileURLToPath(new URL('./src/shared/assets', import.meta.url)),
            },
            {
                find: '@cmp',
                replacement: fileURLToPath(new URL('./src/shared/composables', import.meta.url)),
            },
            {
                find: '@stores',
                replacement: fileURLToPath(new URL('./src/shared/stores', import.meta.url)),
            },
            {
                find: '@use',
                replacement: fileURLToPath(new URL('./src/shared/use', import.meta.url)),
            },
            {
                find: '@utils',
                replacement: fileURLToPath(new URL('./src/shared/utils', import.meta.url)),
            },
        ],
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
            },
        },
    },
    build: {
        outDir: 'dist-extension',
        emptyOutDir: true,
        minify: true,
        chunkSizeWarningLimit: 1600,
        rollupOptions: {
            input: {
                newtab: resolve(__dirname, 'index.html'),
                popup: resolve(__dirname, 'popup.html'),
                background: resolve(__dirname, 'background.js'),
            },
            output: {
                // The manifest references the service worker by a fixed file name
                entryFileNames: (chunk) => (chunk.name === 'background'
                    ? 'background.js'
                    : 'assets/[name]-[hash].js'),
            },
        },
    },
    define: {
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(true),
    },
});
