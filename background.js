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

chrome.runtime.onInstalled.addListener((details) => {
    const title = 'MyShortcuts';
    const { reason } = details;

    if (reason === 'install') {
        chrome.bookmarks.getSubTree('2', (result) => {
            const bookmarkTreeNodes = result[0].children;
            const folder = searchFolder(bookmarkTreeNodes, title);

            if (!folder) {
                chrome.bookmarks.create(
                    { parentId: '2', title },
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
        chrome.action.setIcon({path: 'icons/128-disabled.png'});
    } else {
        chrome.action.setPopup({ popup: 'popup.html' });
        chrome.action.setIcon({path: 'icons/128-bw.png'});
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
