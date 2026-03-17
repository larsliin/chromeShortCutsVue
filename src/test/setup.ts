import { beforeEach, vi } from 'vitest';
import { chromeMock } from './mocks/chrome';

// Install the Chrome API mock on globalThis so all modules that reference
// the `chrome` global will use our controllable stubs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).chrome = chromeMock;

// Reset every mock's call history and implementation between tests so that
// one test's setup never leaks into another.
beforeEach(() => {
    vi.clearAllMocks();

    // Reset lastError to a clean state before each test
    chromeMock.runtime.lastError = undefined;

    // Re-apply safe defaults for the Promise-based storage APIs
    chromeMock.storage.local.get.mockResolvedValue({});
    chromeMock.storage.local.set.mockResolvedValue(undefined);
    chromeMock.storage.sync.get.mockResolvedValue({});
    chromeMock.storage.sync.set.mockResolvedValue(undefined);
});
