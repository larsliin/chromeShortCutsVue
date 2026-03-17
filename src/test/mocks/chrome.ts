import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Helpers to build Chrome-style callback-based mocks.
// Each mock exposes a `.mockImplementation` compatible stub so tests can
// control return values and trigger callbacks.
// ---------------------------------------------------------------------------

function makeCallbackMock() {
    return vi.fn();
}

// ---------------------------------------------------------------------------
// chrome.bookmarks
// ---------------------------------------------------------------------------
export const chromeMock = {
    bookmarks: {
        getSubTree: makeCallbackMock(),
        get: makeCallbackMock(),
        getTree: makeCallbackMock(),
        create: makeCallbackMock(),
        update: makeCallbackMock(),
        move: makeCallbackMock(),
        remove: makeCallbackMock(),
        removeTree: makeCallbackMock(),
        onCreated: { addListener: vi.fn(), removeListener: vi.fn() },
        onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
        onMoved: { addListener: vi.fn(), removeListener: vi.fn() },
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },

    storage: {
        local: {
            get: vi.fn().mockResolvedValue({}),
            set: vi.fn().mockResolvedValue(undefined),
            remove: makeCallbackMock(),
        },
        sync: {
            get: vi.fn().mockResolvedValue({}),
            set: vi.fn().mockResolvedValue(undefined),
            remove: makeCallbackMock(),
        },
    },

    runtime: {
        lastError: undefined as chrome.runtime.LastError | undefined,
        onInstalled: { addListener: vi.fn() },
    },

    tabs: {
        get: makeCallbackMock(),
        query: vi.fn().mockResolvedValue([]),
        onActivated: { addListener: vi.fn() },
        onUpdated: { addListener: vi.fn() },
    },

    action: {
        setPopup: vi.fn(),
    },
};

// ---------------------------------------------------------------------------
// Convenience: make a bookmark API callback fire with given data, optionally
// with a chrome.runtime.lastError set.
// Usage:
//   fireCallback(chrome.bookmarks.getSubTree, [result], 'optional error msg')
// ---------------------------------------------------------------------------
export function fireCallback(
    mockFn: ReturnType<typeof vi.fn>,
    callbackArgs: unknown[],
    lastErrorMessage?: string,
) {
    chromeMock.runtime.lastError = lastErrorMessage
        ? { message: lastErrorMessage }
        : undefined;

    mockFn.mockImplementation((_arg: unknown, cb: (...args: unknown[]) => void) => {
        cb(...callbackArgs);
    });
}

// Variant for three-arg callbacks (e.g. update/move: id, data, callback)
export function fireThreeArgCallback(
    mockFn: ReturnType<typeof vi.fn>,
    callbackArgs: unknown[],
    lastErrorMessage?: string,
) {
    chromeMock.runtime.lastError = lastErrorMessage
        ? { message: lastErrorMessage }
        : undefined;

    mockFn.mockImplementation((_arg1: unknown, _arg2: unknown, cb: (...args: unknown[]) => void) => {
        cb(...callbackArgs);
    });
}
export function fireNoArgCallback(
    mockFn: ReturnType<typeof vi.fn>,
    callbackArgs: unknown[],
    lastErrorMessage?: string,
) {
    chromeMock.runtime.lastError = lastErrorMessage
        ? { message: lastErrorMessage }
        : undefined;

    mockFn.mockImplementation((cb: (...args: unknown[]) => void) => {
        cb(...callbackArgs);
    });
}
