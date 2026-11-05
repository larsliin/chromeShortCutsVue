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

function disableActionButton(url) {
    const protocols = ['http', 'https'];
    const startsWithAny = protocols.some((prefix) => url.startsWith(`${prefix}:`));

    if (!startsWithAny) {
        chrome.action.setPopup({ popup: '' });
    } else {
        chrome.action.setPopup({ popup: 'popup.html' });
    }
 }

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (chrome.runtime.lastError) {
            return;
        }
        disableActionButton(tab.url);
    });
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
    if (changeInfo.url) {
        disableActionButton(changeInfo.url);
    }
});