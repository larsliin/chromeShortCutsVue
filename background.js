import { FOLDER } from './src/constants';

/* eslint-disable */
function searchFolder(bookmarkTreeNodes, folderName) {
    // eslint-disable-next-line no-restricted-syntax
    for (const node of bookmarkTreeNodes) {
        if (node.title === folderName && node.children) {
            return node;
        }
        if (node.children) {
            const result = searchFolder(node.children, folderName);
            if (result) {
                return result;
            }
        }
    }
    return false;
}

chrome.runtime.onInstalled.addListener(async (details) => {
    const title = FOLDER.ROOT.label;
    const { reason } = details;

    if (reason === 'install') {
        const tree = await chrome.bookmarks.getTree();
        const bookmarksBar = tree[0].children.find((node) => node.folderType  === FOLDER.ROOT.parentFolderType );
        const bookmarksBarId = bookmarksBar.id;
        
        if(!bookmarksBar) {
            return;
        }

        chrome.bookmarks.getSubTree(bookmarksBarId, (result) => {
            const bookmarkTreeNodes = result[0].children;
            const folder = searchFolder(bookmarkTreeNodes, title);

            if (!folder) {
                chrome.bookmarks.create(
                    { parentId: bookmarksBarId, title },
                );
            }
        });
    }
});

function disableActionButton(tabId, url) {
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
        disableActionButton(activeInfo.tabId, tab.url);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (activeInfo.tabId === tabId && changeInfo.url) {
            disableActionButton(tabId, changeInfo.url);
        }
    });
});
