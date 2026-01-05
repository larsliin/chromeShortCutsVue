<template>
    <div class="bookmarks-container"
        v-if="bookmarksStore.bookmarks"
        :class="bookmarksStore.accordionNavigation ? 'accordion' : 'slider'">
        <BookmarksBackground />
        <BookmarkAddLarge />
        <template v-if="bookmarksStore.accordionNavigation">
            <BookmarksAccordion />
        </template>
        <template v-else>
            <BookmarksSlider />
            <NavigationDots
                v-if="bookmarksStore.bookmarks && bookmarksStore.bookmarks.length > 1" />
            <NavigationArrow
                direction="left" />
            <NavigationArrow
                direction="right" />
        </template>
        <BookmarksPopular />
    </div>
</template>

<script setup>
    import { FOLDER, EMITS, ARGS } from '@/constants';
    import { onMounted, watch } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { useTheme } from 'vuetify';
    import { useUtils } from '@/shared/composables/utils';
    import BookmarkAddLarge from '@/components/bookmarks/sharedComponents/BookmarkAddLarge.vue';
    import BookmarksAccordion from '@/components/bookmarks/accordion/BookmarksAccordion.vue';
    import BookmarksBackground
        from '@/components/bookmarks/sharedComponents/BookmarksBackground.vue';
    import BookmarksPopular from '@/components/bookmarks/sharedComponents/BookmarksPopular.vue';
    import BookmarksSlider from '@/components/bookmarks/slider/BookmarksSlider.vue';
    import NavigationArrow from '@/components/navigation/NavigationArrow.vue';
    import NavigationDots from '@/components/navigation/NavigationDots.vue';
    import useEventsBus from '@cmp/eventBus';

    const theme = useTheme();

    const utils = useUtils();

    const { bus, emit } = useEventsBus();

    const bookmarksStore = useBookmarksStore();

    function isBookmarkInScope(id) {
        if (id === bookmarksStore.rootId) {
            return true;
        }
        const flatMapBookmarks = bookmarksStore.bookmarks.flatMap((obj) => obj.children);
        const bookmarkExists = flatMapBookmarks.some((e) => e.id === id);
        const folderExists = bookmarksStore.bookmarks.some((e) => e.id === id);

        return bookmarkExists || folderExists;
    }

    async function update() {
        if (bookmarksStore.dragStart) {
            bookmarksStore.dragStart = false;
            return;
        }

        const getRootResponse = await bookmarksStore.get_localStorage(FOLDER.ROOT.name);

        const bookmarks = await bookmarksStore.get_bookmarks(getRootResponse);

        bookmarksStore.bookmarks = bookmarks[0].children;
    }

    function setChromeEventListeners() {
        /* eslint-disable */
        chrome.bookmarks.onCreated.addListener(onCreated);
        chrome.bookmarks.onRemoved.addListener(onRemoved);
        chrome.bookmarks.onMoved.addListener(onMoved);
        chrome.bookmarks.onChanged.addListener(onChanged);
        /* eslint-disable */
    }

    // clean up local storage bookmarks, that are not in Chrome bookmarks
    async function runCleanup() {
        const localStorageItems = await bookmarksStore.get_localStorageAll(null);
        const bookmarksFlatResponse = await utils.getBookmarksAsFlatArr();

        const bookmarkIds = bookmarksFlatResponse.map(bookmark => bookmark.id);

        const filteredItems = Object.values(localStorageItems).filter(item =>
            item.parentId && !bookmarkIds.includes(item.id)
        );

        filteredItems.forEach(element => {
            bookmarksStore.delete_localStorageItem(element.id);
        });
    }

    async function getBookmarks() {
        const rootResponse = await bookmarksStore.get_localStorage(FOLDER.ROOT.name);

        bookmarksStore.rootId = rootResponse;

        try {
            const bookmarksResponse = await bookmarksStore.get_colorizedBookmarks(rootResponse);

            bookmarksStore.bookmarks = bookmarksResponse[0]?.children ? bookmarksResponse[0].children : [];

            runCleanup();
        } catch (error) {
            bookmarksStore.bookmarks = [];
        }

        setChromeEventListeners();
    }

    async function isNewBookmarkInScope(bookmark) {
        if (!bookmarksStore.rootId && bookmark.parentId !== bookmarksStore.bookmarksBarId) {
            return false;
        }

        return new Promise((resolve, reject) => {
            try {
                bookmarksStore.get_bookmarks(bookmarksStore.rootId).then((event) => {
                    const inScope = event[0].children.some(item => {
                        return item.id.toString() === bookmark.id.toString() ||
                            (item.children && item.children.some(child => child.id.toString() === bookmark.id.toString()))
                    });
                    resolve(inScope);
                });
            } catch (error) {
                reject(error);
            }
        });
     }

    async function onCreated(event) {
        const bookmarkResponse = await bookmarksStore.get_bookmarkById(event);

        if (bookmarksStore.isImporting) {
            return;
        }

        const scope = await isNewBookmarkInScope(bookmarkResponse);
        // ensure that bookmark is ours in ROOT folder
        if (!scope) {
            return;
        }

        await utils.buildRootFolder();

        const folder = bookmarksStore.bookmarks.find(e => e.id === bookmarkResponse.parentId);

        if (bookmarkResponse.parentId === bookmarksStore.rootId) {

            if (bookmarksStore.bookmarks.length) {
                // if folder bookmark is a folder in root directory
                bookmarksStore.bookmarks.splice(bookmarkResponse.index, 0, bookmarkResponse);
            } else {
                bookmarksStore.bookmarks.push(bookmarkResponse)
            }
        } else if (folder){
            // if bookmark event is bookmark and not folder
            if (!folder.children) {
                // create bookmarks children object if folder is empty
                folder.children = [];
            }
            folder.children.splice(bookmarkResponse.index, 0, bookmarkResponse);

            const index = bookmarksStore.bookmarks
                .findIndex(e => e.id === folder.id);
            utils.setSliderIndex(index, true);
        }

        emit(EMITS.BOOKMARKS_UPDATED, { type: ARGS.CREATED, id: event });
    }

    async function onRemoved(event) {
        if (!isBookmarkInScope(event)) {
            return;
        }

        const bookmark = utils.getStoredBookmarkById(event);
        let children;

        // if root folder is deleted then simply delete everything
        if (bookmarksStore.rootId === event) {
            const promiseArr = [
                bookmarksStore.delete_localStorageItem(FOLDER.ROOT.name),
                bookmarksStore.delete_localStorageItem('root'),
                bookmarksStore.delete_syncStorageItem('accordion'),
                bookmarksStore.delete_syncStorageItem('folderColors'),
                bookmarksStore.delete_syncStorageItem('bookmarkColors'),
                bookmarksStore.delete_syncStorageItem('statistics'),
                utils.deleteLocalStoreImages(),
            ];

            Promise.all(promiseArr)
            .then(async () => {
                    bookmarksStore.rootId = null;

                    bookmarksStore.bookmarks = [];

                    utils.setSliderIndex(0, true);

                    bookmarksStore.accordionModel = null;
                    bookmarksStore.delete_syncStorageItem('accordion');

                    emit(EMITS.BOOKMARKS_UPDATED, { type: 'removed', id: event });

                    return;
                })
                .catch((error) => {
                    console.error(error);
                });

        } else {

            if (bookmark) { // if is type bookmark

                // Filter away child object with the specified ID
                bookmarksStore.bookmarks = bookmarksStore.bookmarks.map(parent => ({
                    ...parent,
                    children: parent.children.filter(child => child.id !== event)
                }));

                // delete image in local storage
                bookmarksStore.delete_localStorageItem(event);
            } else { // if is type folder
                const index = bookmarksStore.bookmarks.findIndex(e => e.id === event);
                const folder = bookmarksStore.bookmarks.find(e => e.id === event)

                children = folder ? folder.children.flatMap(e => e.id) : [];

                children.forEach(element => {
                    bookmarksStore.delete_localStorageItem(element);
                });
                utils.updateAccordionModel(index);

                bookmarksStore.bookmarks = bookmarksStore.bookmarks.filter(e => e.id !== event);
            }

            if (bookmarksStore.sliderIndex >= bookmarksStore.bookmarks.length) {
                utils.setSliderIndex(bookmarksStore.bookmarks.length - 1, true);
            }

            emit(EMITS.BOOKMARKS_UPDATED, { type: 'removed', id: event, children });
        }
    }
    async function onChanged(event) {
        // ensure that bookmark is ours in ROOT folder
        if (!isBookmarkInScope(event)) {
            return;
        }

        // if bookmark does not have an image icon
        // then delete applied icon image from bookmark
        if (!bookmarksStore.editBase64Image) {
            bookmarksStore.delete_localStorageItem(event);
        }
        const promiseArr = [
            bookmarksStore.get_bookmarkById(event),
            bookmarksStore.get_localStorage(event),
        ];

        Promise.all(promiseArr)
            .then(async(results) => {
                if (results[0]) {
                    await bookmarksStore.set_localStorage({
                        [event]: {
                            parentId: results[0].parentId,
                            id: event,
                            image: bookmarksStore.editBase64Image,
                            url: results[0].url,
                            title: results[0].title,
                        },
                    });

                    emit(EMITS.ICON_UPDATE, event);
                }
            })
            .catch((error) => {
                console.error(error);
            });

        const bookmarkResponse = await bookmarksStore.get_bookmarkById(event);

        // update UI titles
        // find folder with id
        const folder = bookmarksStore.bookmarks.find(e => e.id === event);

        if (folder) {
            // if is a folder
            folder.title = bookmarkResponse.title;
        } else {
            const bookmark = utils.getStoredBookmarkById(event);
            // if not a folder then this is a bookmark
            // update bookmark title/url/parent id
            bookmark.parentId = bookmarkResponse.parentId;
            bookmark.url = bookmarkResponse.url;
            bookmark.title = bookmarkResponse.title;
        }

        emit(EMITS.BOOKMARKS_UPDATED,  { type: 'update', id: event });
    }

    async function onMoved(event) {
        // ensure that bookmark is ours in ROOT folder
        if (!isBookmarkInScope(event)) {
            return;
        }

        await update();

        const index = bookmarksStore.bookmarks.findIndex(a => a.id === event.toString());

        if (index) {
            utils.setSliderIndex(index, true);
        }

        emit(EMITS.BOOKMARKS_UPDATED,  { type: 'moved', id: event });
    }

    // force event trigger if bookmark data is not updated
    // but image has changed while editing bookmark
    watch(() => bus.value.get(EMITS.CHANGED), (id) => {
        onChanged(id[0]);
    });

    watch(() => bookmarksStore.accordionNavigation, (val) => {
        toggleOverflowHidden();
    });

    function toggleOverflowHidden() {
        if (bookmarksStore.accordionNavigation) {
            document.getElementsByTagName('html')[0].classList.remove('overflow-hidden');
            document.getElementsByTagName('body')[0].classList.remove('overflow-hidden');
        } else {
            document.getElementsByTagName('html')[0].classList.add('overflow-hidden');
            document.getElementsByTagName('body')[0].classList.add('overflow-hidden');
        }
    }

    async function init() {
        const tree = await chrome.bookmarks.getTree();
        const bookmarksBar = tree[0].children.find((node) => node.folderType === FOLDER.ROOT.parentFolderType);

        if(!bookmarksBar) {
            return;
        }
        
        const bookmarksBarId = bookmarksBar.id;

        bookmarksStore.setBookmarksBarId(bookmarksBarId);

        // load all settings
        const promiseArr = [
            bookmarksStore.get_folderByTitle(bookmarksStore.bookmarksBarId, FOLDER.ROOT.label),
            bookmarksStore.get_syncStorage('sliderIndex'),
            bookmarksStore.get_syncStorage('darkMode'),
            bookmarksStore.get_syncStorage('systemDarkMode'),
            bookmarksStore.get_syncStorage('accordionNavigation'),
            utils.buildRootFolder(),
        ];

        Promise.all(promiseArr).then(([rootFolder, sliderIndex, darkMode, systemDarkMode, accordionNavigation, buildRoot]) => {
            getBookmarks();

            // sliderIndex
            if (typeof sliderIndex === 'number') {
                bookmarksStore.sliderIndex = sliderIndex;
            } else {
                bookmarksStore.sliderIndex = 0;
            }

            // prefer dark mode
            bookmarksStore.enablePreferDarkMode = !!darkMode;

            // system dark mode
            bookmarksStore.enableSystemDarkMode = !!systemDarkMode;

            if (bookmarksStore.enableSystemDarkMode) {
                bookmarksStore.enableDarkMode = window
                    .matchMedia('(prefers-color-scheme: dark)').matches;
            } else if (bookmarksStore.enablePreferDarkMode) {
                bookmarksStore.enableDarkMode = true;
            } else {
                bookmarksStore.enableDarkMode = false;
            }
            theme.global.name.value = bookmarksStore.enableDarkMode ? 'dark' : 'light';

            // accordion navigation
            bookmarksStore.accordionNavigation = !accordionNavigation;

            toggleOverflowHidden();
        });
    }

    onMounted(() => {
        if (bookmarksStore.enableSystemDarkMode) {
            theme.global.name.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        init();
    });

</script>

<style scoped lang="scss">
    .bookmarks-container {
        $breakpoint: 540px;

        position: relative;
        width: $breakpoint;

        @media (min-width: $breakpoint) {
            width: 100%;
        }
    }

</style>
