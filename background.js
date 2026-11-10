import { FOLDER } from './src/constants';
import { searchFolder } from './src/shared/composables/chromeApi';

/* eslint-disable */
chrome.runtime.onInstalled.addListener(async (details) => {
    const title = FOLDER.ROOT.label;
    const { reason } = details;

    if (reason === 'install') {
        const tree = await chrome.bookmarks.getTree();
        const bookmarksBar = tree[0].children.find((node) => node.folderType === FOLDER.ROOT.parentFolderType);

        if (!bookmarksBar) {
            return;
        }

        const bookmarksBarId = bookmarksBar.id;

        chrome.bookmarks.getSubTree(bookmarksBarId, (result) => {
            if (chrome.runtime.lastError) {
                console.error('getSubTree error:', chrome.runtime.lastError);
                return;
            }

            const bookmarkTreeNodes = result[0].children;
            const folder = searchFolder(bookmarkTreeNodes, title);

            if (!folder) {
                chrome.bookmarks.create({ parentId: bookmarksBarId, title }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('create bookmark error:', chrome.runtime.lastError);
                    }
                });
            }
        });
    }
});

const ICON_SIZES = [16, 32, 48, 128];

function getIconPaths(suffix = '') {
    return Object.fromEntries(ICON_SIZES.map((size) => [size, `icons/${size}${suffix}.png`]));
}

// Only http(s) pages are enabled; chrome://, chrome-extension://, about:, file: etc. are disabled
function isPageSupported(url = '') {
    return ['http', 'https'].some((protocol) => url.startsWith(`${protocol}:`));
}

async function syncActionButton() {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const supported = isPageSupported(tab?.url);

    chrome.action.setPopup({ popup: supported ? 'popup.html' : '' });
    chrome.action.setIcon({ path: getIconPaths(supported ? '' : '-disabled') });
}

chrome.tabs.onActivated.addListener(syncActionButton);
chrome.windows.onFocusChanged.addListener(syncActionButton);
chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
    if (changeInfo.url) {
        syncActionButton();
    }
});

// Service worker state is ephemeral, so re-sync whenever it starts
syncActionButton();