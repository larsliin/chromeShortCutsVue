import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { vi } from 'vitest';
import type { Component } from 'vue';

// ---------------------------------------------------------------------------
// Shared Vuetify instance
// Created once per test-file run — cheaper than instantiating per test.
// ---------------------------------------------------------------------------

const vuetify = createVuetify({ components, directives });

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
