// chrome.runtime.onInstalled.addListener(details => {
//     chrome.bookmarks.create({ parentId: '2', title: 'MyShortcuts' }, (rootfolder) => {
//         chrome.storage.local.set({ 'root': rootfolder }).then(() => {
//             chrome.bookmarks.create({ parentId: rootfolder.id, title: 'Home' }, (homefolder) => {
//                 chrome.storage.local.set({ 'home': homefolder });
//             });
//         });
//     });
// });
