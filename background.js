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
