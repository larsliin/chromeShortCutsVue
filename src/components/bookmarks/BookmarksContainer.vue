<template>

    <div class="bookmarks-slider" v-if="bookmarksStore.bookmarks">
        <BookmarksSlider />
        <NavigationDots v-if="bookmarksStore.bookmarks && bookmarksStore.bookmarks.length > 1" />
        <NavigationArrow
            v-if="bookmarksStore.arrowNavigation && bookmarksStore.bookmarks.length > 1"
            direction="left" />
        <NavigationArrow
            v-if="bookmarksStore.arrowNavigation && bookmarksStore.bookmarks.length > 1"
            direction="right" />

    </div>
</template>

<script setup>
    import { onMounted, watch } from 'vue';
    import BookmarksSlider from '@/components/bookmarks/BookmarksSlider.vue';
    import NavigationDots from '@/components/navigation/NavigationDots.vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { FOLDER, EMITS } from '@/constants';
    import NavigationArrow from '@/components/navigation/NavigationArrow.vue';

    import useEventsBus from '@cmp/eventBus';
    import { useUtils } from '@/shared/utils/utils';

    const utils = useUtils();

    const { bus } = useEventsBus();

    const bookmarksStore = useBookmarksStore();

    async function isBookmarkInScope(id) {
        const bookmarks = await bookmarksStore.get_bookmarks(bookmarksStore.rootId);

        const idArray = bookmarks.flatMap((item) => {
            const topLevelId = item.id;
            const childIds = item.children ? item.children.map((child) => child.id) : [];
            return [topLevelId, ...childIds];
        });

        return idArray.includes(id);
        //  return true;
    }

    async function update() {
        if (bookmarksStore.dragStart) {
            bookmarksStore.dragStart = false;
            return;
        }

        const getRootResponse = await bookmarksStore.get_localStorage(FOLDER.ROOT.id);
        const bookmarks = await bookmarksStore.get_bookmarks(getRootResponse.id);

        bookmarksStore.bookmarks = bookmarks[0].children;

        bookmarksStore.sliderIndex = Math.min(
            bookmarksStore.sliderIndex,
            bookmarksStore.bookmarks.length - 1,
        );

        bookmarksStore.sliderIndex = Math.max(
            bookmarksStore.sliderIndex,
            0,
        );

        bookmarksStore.set_localStorage({
            sliderIndex: bookmarksStore.sliderIndex,
        });
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

        bookmarksStore.rootId = getRootResponse.id;

        const bookmarks = await bookmarksStore.get_bookmarks(getRootResponse.id);

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
        await getBookmarks();

        update();
    }

    async function onRemoved(event) {
        if (bookmarksStore.isImporting) {
            return;
        }

        if (bookmarksStore.rootId === event) {
            // if root folder is deleted then delete all
            await bookmarksStore.delete_localStorageItem(FOLDER.ROOT.id);
            bookmarksStore.rootId = null;

            bookmarksStore.bookmarks = [];

            // deleteAllLocalStorageImages();
            await utils.deleteLocalStoreImages();

            bookmarksStore.sliderIndex = 0;

            bookmarksStore.set_localStorage({
                sliderIndex: bookmarksStore.sliderIndex,
            });

            return;
        }

        // ensure that bookmark is ours in ROOT folder
        if (!isBookmarkInScope(event)) {
            return;
        }

        // delete local storage image
        const localStorageResponse = await bookmarksStore.get_localStorage(event);

        if (localStorageResponse) {
            bookmarksStore.delete_localStorageItem(event);
        }

        const folder = bookmarksStore
            .bookmarks.find((obj) => obj.children?.find((item) => item.id === event));

        if (!folder) {
            // delete all local storage items in folder
            const localStorageItems = await bookmarksStore.get_localStorageAll(null);
            const localStorageItemsImageArr = Object.values(localStorageItems)
                .filter((e) => e.parentId === event);

            localStorageItemsImageArr.forEach((item) => {
                bookmarksStore.delete_localStorageItem(item.id);
            });

            update();

            return;
        }

        if (folder.children.length === 1) {
            // if last bookmark in folder
            // then delete folder with content
            await bookmarksStore.remove_bookmark(folder.id);
        }

        update();
    }

    async function onChanged(event) {
        // ensure that bookmark is ours in ROOT folder
        if (!isBookmarkInScope(event)) {
            return;
        }

        if (!bookmarksStore.editBase64Image) {
            bookmarksStore.delete_localStorageItem(event);
            update();
            return;
        }
        const promiseArr = [
            bookmarksStore.get_bookmarkById(event),
            bookmarksStore.get_localStorage(event),
        ];

        Promise.all(promiseArr)
            .then((results) => {
                if (results[0]) {
                    bookmarksStore.set_localStorage({
                        [event]: {
                            parentId: results[0].parentId,
                            id: event,
                            image: bookmarksStore.editBase64Image,
                            url: results[0].url,
                            title: results[0].title,
                        },
                    });
                    bookmarksStore.editBase64Image = null;
                }
            })
            .catch((error) => {
                console.error(error);
            });

        update();
    }

    async function onMoved(event) {
        // ensure that bookmark is ours in ROOT folder
        if (!isBookmarkInScope(event)) {
            return;
        }

        const getRootResponse = await bookmarksStore.get_localStorage(FOLDER.ROOT.id);
        const bookmarks = await bookmarksStore.get_bookmarks(getRootResponse.id);

        const emptyFolder = bookmarks[0].children.find((e) => e.children.length === 0);

        if (emptyFolder) {
            await bookmarksStore.remove_bookmark(emptyFolder.id);
        }

        update();
    }

    // force event trigger if bookmark data is not updated
    // but image has changed while editing bookmark
    watch(() => bus.value.get(EMITS.IMAGE_UPDATED), (id) => {
        onChanged(id[0]);
    });

    onMounted(async () => {
        const slideIndexResponse = await bookmarksStore.get_localStorage('sliderIndex');

        if (slideIndexResponse) {
            bookmarksStore.sliderIndex = slideIndexResponse;
        }

        const arrowNavigationResponse = await bookmarksStore.get_localStorage('arrowNavigation');

        bookmarksStore.arrowNavigation = arrowNavigationResponse === undefined;

        await utils.buildRootFolder();
        await getBookmarks();
    });

</script>

<style scoped lang="scss">
    .bookmarks-slider {
        $breakpoint: 540px;

        position: relative;
        width: $breakpoint;

        @media (min-width: $breakpoint) {
            width: 100%;
        }
    }


    .folders-outer {
        background: #f0f0f0;
        background: radial-gradient(circle at 100% 100%, #cfcfcf 0%, #fff 100%);
        display: block;
        height: 100vh;
        overflow: hidden;
        width: 100%;
    }

    .folders-background {
        color: var(--yellow);
        display: block;
        font-size: 600px;
        left: 50%;
        opacity: .05;
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
    }

    .folders-container {
        align-items: center;
        // display: none;
        height: 100%;
    }

    .folders-container.animated {
        transition: transform 0.5s;
    }

</style>
