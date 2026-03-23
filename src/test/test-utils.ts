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
 * Runs a composable inside a minimal Vue app so that lifecycle hooks
 * (onMounted, onUnmounted) and inject() work correctly.
 *
 * Based on the Vue.js Testing Guide:
 * https://vuejs.org/guide/scaling-up/testing#testing-composables
 *
 * Usage:
 *   const [result, app] = withSetup(() => useMyComposable())
 *   afterEach(() => app.unmount())  // triggers onUnmounted cleanup
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
 * Mount a Vue component with Vuetify + a pre-configured testing Pinia.
 * Pass this as the standard mounting helper in all component tests so that
 * plugin boilerplate stays out of individual test files.
 *
 * @param component    Vue SFC or component definition to mount
 * @param options      Vue Test Utils MountingOptions (props, slots, stubs, etc.)
 * @param piniaState   Optional initial Pinia state, keyed by store name.
 *                     Defaults to `{}` (empty state; store initial values apply).
 *
 * Example:
 *   mountWithPlugins(MyComponent, { props: { label: 'Click me' } })
 *   mountWithPlugins(MyComponent, {}, { bookmarksStore: { rootId: 'abc' } })
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