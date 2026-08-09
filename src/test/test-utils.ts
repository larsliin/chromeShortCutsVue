import { createApp, type App, type Component } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Shared Vuetify instance
// Created once per test-file run — cheaper than instantiating per test.
// Pass it via `global.plugins` when mounting components that use Vuetify UI.
// ---------------------------------------------------------------------------

export const vuetify = createVuetify({ components, directives });

// ---------------------------------------------------------------------------
// withSetup — composable test helper
// ---------------------------------------------------------------------------

/**
 * Runs a composable in a minimal Vue app so lifecycle hooks and inject() work.
 * Use it for composables that need mounted/unmounted support.
 */
export function withSetup<T>(
    composable: () => T,
    options: { provide?: Record<string | symbol, unknown> } = {},
): [T, App] {
    let result!: T;

    const app = createApp({
        setup() {
            result = composable();
            // Suppress "missing template/render function" warning
            return () => {};
        },
    });

    if (options.provide) {
        Object.entries(options.provide).forEach(([key, value]) => {
            app.provide(key, value);
        });
    }

    app.mount(document.createElement('div'));

    return [result, app];
}

// ---------------------------------------------------------------------------
// mountWithPlugins — single mount entry point for component tests
// ---------------------------------------------------------------------------

/**
 * Mount a component with Vuetify and a testing Pinia.
 * Use this helper instead of repeating plugin setup in component tests.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mountWithPlugins(component: Component, options: Record<string, any> = {}) {
    const { piniaState, ...mountOptions } = options;

    return mount(component, {
        ...mountOptions,
        global: {
            ...mountOptions.global,
            plugins: [
                vuetify,
                createTestingPinia({ createSpy: vi.fn, initialState: piniaState ?? {} }),
                ...(mountOptions.global?.plugins ?? []),
            ],
        },
    });
}
