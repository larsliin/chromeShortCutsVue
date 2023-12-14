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
                v-if="bookmarksStore.arrowNavigation && bookmarksStore.bookmarks.length > 1"
                direction="left" />
            <NavigationArrow
                v-if="bookmarksStore.arrowNavigation && bookmarksStore.bookmarks.length > 1"
                direction="right" />
        </template>
    </div>
</template>

<script setup>
    import { onMounted, watch } from 'vue';
    import BookmarksSlider from '@/components/bookmarks/slider/BookmarksSlider.vue';
    import BookmarksAccordion from '@/components/bookmarks/accordion/BookmarksAccordion.vue';
    import NavigationDots from '@/components/navigation/NavigationDots.vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { FOLDER, EMITS, ARGS } from '@/constants';
    import NavigationArrow from '@/components/navigation/NavigationArrow.vue';
    import useEventsBus from '@cmp/eventBus';
    import { useUtils } from '@/shared/utils/utils';
    import { useTheme } from 'vuetify';
    import BookmarkAddLarge from '@/components/bookmarks/sharedComponents/BookmarkAddLarge.vue';
    import BookmarksBackground
        from '@/components/bookmarks/sharedComponents/BookmarksBackground.vue';

    const theme = useTheme();

    const utils = useUtils();

    const { bus, emit } = useEventsBus();

    const bookmarksStore = useBookmarksStore();

    async function isBookmarkInScope(id) {
        const rootFolderResponse = await bookmarksStore
            .get_folderByTitle(FOLDER.ROOT.parentId, FOLDER.ROOT.label);
        const bookmarksResponse = await bookmarksStore.get_bookmarks(rootFolderResponse[0].id);
        const bookmarks = bookmarksResponse[0];

        const folderIds = bookmarks.children.map((e) => e.id);
        const bookmarkIds = bookmarks.children.flatMap((e) => e.children.map((a) => a.id));
        const allIds = folderIds.concat(bookmarkIds);

        return allIds.includes(id);
    }

    async function update() {
        if (bookmarksStore.dragStart) {
            bookmarksStore.dragStart = false;

            return;
        }

        const getRootResponse = await bookmarksStore.get_localStorage(FOLDER.ROOT.id);

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

    async function getBookmarks() {
        const getRootResponse = await bookmarksStore.get_localStorage(FOLDER.ROOT.id);

        bookmarksStore.rootId = getRootResponse;

        const bookmarks = await bookmarksStore.get_bookmarks(getRootResponse);

        bookmarksStore.bookmarks = bookmarks ? bookmarks[0].children : [];

        setChromeEventListeners();
    }

    async function onCreated(event) {
        if (bookmarksStore.isImporting) {
            return;
        }

        // ensure that bookmark is ours in ROOT folder
        if (!isBookmarkInScope(event)) {
            return;
        }

        // eslint-disable-next-line no-use-before-define
        await utils.buildRootFolder();

        const bookmarkResponse = await bookmarksStore.get_bookmarkById(event);

        const folder = bookmarksStore.bookmarks.find(e => e.id === bookmarkResponse.parentId);

        if (bookmarkResponse.parentId === bookmarksStore.rootId) {
            // if folder bookmark is a folder in root directory
            bookmarksStore.bookmarks.push(bookmarkResponse);
        } else if (folder){
            // if bookmark event is bookmark and not folder
            if (!folder.children) {
                // create bookmarks children object if folder is empty
                folder.children = [];
            }
            folder.children.push(bookmarkResponse);

            const index = bookmarksStore.bookmarks
                .findIndex(e => e.id === folder.id);
            utils.setSliderIndex(index, true);
        }
        emit(EMITS.BOOKMARKS_UPDATED, ARGS.CREATED);
    }

    async function onRemoved(event) {
        const bookmark = utils.getStoredBookmarkById(event);

        if (bookmarksStore.rootId === event) {
            // if root folder is deleted then simply delete everything
            await bookmarksStore.delete_localStorageItem(FOLDER.ROOT.id);
            await bookmarksStore.delete_syncStorageItem('accordion');
            await bookmarksStore.delete_syncStorageItem('folderColors');

            bookmarksStore.rootId = null;

            bookmarksStore.bookmarks = [];

            await utils.deleteLocalStoreImages();

            utils.setSliderIndex(0, true);
            utils.setAccordionModel([0]);

            emit(EMITS.BOOKMARKS_UPDATED, 'removed');

            return;
        }

        if (bookmark) { // if is type bookmark
            const parentId = bookmark.parentId;

            // Filter away child object with the specified ID
            bookmarksStore.bookmarks = bookmarksStore.bookmarks.map(parent => ({
                ...parent,
                children: parent.children.filter(child => child.id !== event)
            }));

            // delete image in local storage
            bookmarksStore.delete_localStorageItem(event);
        } else { // if is type folder
            bookmarksStore.bookmarks = bookmarksStore.bookmarks.filter(e => e.id !== event);
        }

        if (bookmarksStore.sliderIndex >= bookmarksStore.bookmarks.length) {
            utils.setSliderIndex(bookmarksStore.bookmarks.length - 1, true);
        }

        emit(EMITS.BOOKMARKS_UPDATED, 'removed');
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
            // update bookmark title/url/parentid
            bookmark.parentId = bookmarkResponse.parentId;
            bookmark.url = bookmarkResponse.url;
            bookmark.title = bookmarkResponse.title;
        }

        emit(EMITS.BOOKMARKS_UPDATED, 'changed');
    }

    async function onMoved(event) {
        // ensure that bookmark is ours in ROOT folder
        if (!isBookmarkInScope(event)) {
            return;
        }

        const getRootResponse = await bookmarksStore.get_localStorage(FOLDER.ROOT.id);
        const bookmarks = await bookmarksStore.get_bookmarks(getRootResponse);

        const emptyFolder = bookmarks[0].children.find((e) => e.children.length === 0);

        await update();

        const index = bookmarksStore.bookmarks
            .findIndex(e => e.children.find(a => a.id === event));

        utils.setSliderIndex(index, true);

        emit(EMITS.BOOKMARKS_UPDATED, 'moved');
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
        // load all settings
        const promiseArr = [
            bookmarksStore.get_folderByTitle(FOLDER.ROOT.parentId, FOLDER.ROOT.label),
            bookmarksStore.get_syncStorage('sliderIndex'),
            bookmarksStore.get_syncStorage('darkMode'),
            bookmarksStore.get_syncStorage('systemDarkMode'),
            bookmarksStore.get_syncStorage('accordionNavigation'),
            bookmarksStore.get_syncStorage('searchNavigation'),
            bookmarksStore.get_syncStorage('arrowNavigation'),
            getBookmarks(),
            bookmarksStore.get_syncStorage('folderColors'),
            utils.buildRootFolder()
        ];

        Promise.all(promiseArr).then(([rootFolder, sliderIndex, darkMode, systemDarkMode, accordionNavigation, searchNavigation, arrowNavigation, bookmarks, colors, buildRoot]) => {
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

            // search/filter
            bookmarksStore.searchNavigation = !searchNavigation;

            // arrow navigation
            bookmarksStore.arrowNavigation = !!arrowNavigation;

            // inject colors into shared bookmarks
            if (colors && Object.keys(colors).length) {
                Object.entries(colors).forEach((item) => {
                    const bookmarkFolder = bookmarksStore.bookmarks.find((e) => e.id === item[0]);

                    const [, bookmarkFolderColor] = item;
                    if (bookmarkFolder) {
                        bookmarkFolder.color = bookmarkFolderColor;
                    }
                });
            }

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
