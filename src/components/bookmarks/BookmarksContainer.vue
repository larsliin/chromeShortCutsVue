<template>
    <template v-if="bookmarksStore.bookmarks">
        <BookmarksSlider />
        <NavigationDots />
        <NavigationArrow
            direction="left" />
        <NavigationArrow
            direction="right" />
        <NavigationDots />
    </template>
</template>

<script setup>
    import { onMounted, watch } from 'vue';
    import BookmarksSlider from '@/components/bookmarks/BookmarksSlider.vue';
    import NavigationDots from '@/components/navigation/NavigationDots.vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { FOLDER, EMITS } from '@/constants';
    import NavigationArrow from '@/components/navigation/NavigationArrow.vue';
    import useEventsBus from '@cmp/eventBus';

    const { bus } = useEventsBus();

    const bookmarksStore = useBookmarksStore();

    function isBookmarkInScope(id) {
        const idArray = bookmarksStore.bookmarks.flatMap((item) => {
            const topLevelId = item.id;
            const childIds = item.children ? item.children.map((child) => child.id) : [];
            return [topLevelId, ...childIds];
        });

        return idArray.includes(id);
    }

    async function update() {
        if (bookmarksStore.dragStart) {
            bookmarksStore.dragStart = false;
            return;
        }

        const getRootResponse = await bookmarksStore.get_localStorage(FOLDER.ROOT.id);
        const bookmarks = await bookmarksStore.get_bookmarks(getRootResponse.id);
        bookmarksStore.bookmarks = bookmarks[0].children;

        if (bookmarksStore.sliderIndex > bookmarksStore.bookmarks.length - 1) {
            bookmarksStore.sliderIndex = bookmarksStore.bookmarks.length - 1;

            bookmarksStore.set_localStorage({ sliderIndex: bookmarksStore.sliderIndex });
        }
    }
    async function onCreated(event) {
        // ensure that bookmark is ours in ROOT folder
        if (!isBookmarkInScope(event)) {
            return;
        }

        update();
    }

    async function onRemoved(event) {
        // ensure that bookmark is ours in ROOT folder
        if (!isBookmarkInScope(event)) {
            return;
        }

        const folder = bookmarksStore
            .bookmarks.find((obj) => obj.children?.find((item) => item.id === event));

        await bookmarksStore.delete_localStorageItem(event);

        if (!folder) {
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

    function setChromeEventListeners() {
        /* eslint-disable */
        chrome.bookmarks.onCreated.addListener(onCreated);
        chrome.bookmarks.onRemoved.addListener(onRemoved);
        chrome.bookmarks.onMoved.addListener(onMoved);
        chrome.bookmarks.onChanged.addListener(onChanged);
        /* eslint-disable */
    }

    // force event trigger if bookmark data is not updated
    // but image has changed while editing bookmark
    watch(() => bus.value.get(EMITS.IMAGE_UPDATED), (id) => {
        onChanged(id[0]);
    });

    async function getBookmarks() {
        const getRootResponse = await bookmarksStore.get_localStorage(FOLDER.ROOT.id);

        bookmarksStore.rootId = getRootResponse.id;

        const bookmarks = await bookmarksStore.get_bookmarks(getRootResponse.id);
        bookmarksStore.bookmarks = bookmarks[0].children;

        setChromeEventListeners();
    }

    async function buildFolders() {
        const getRootResponse = await bookmarksStore.get_localStorage(FOLDER.ROOT.id);

        if (getRootResponse) {
            // if root folder exists
            const getHomeResponse = await bookmarksStore.get_localStorage(FOLDER.HOME.id);

            if (getHomeResponse) {
                // if home folder exists
                getBookmarks();
            } else {
                // if home folder does not exist then create home folder
                const createHomeResponse = await bookmarksStore.create_bookmark(getRootResponse.id, FOLDER.HOME.label);
                await bookmarksStore.set_localStorage({ [FOLDER.HOME.id]: createHomeResponse });

                getBookmarks();
            }
        } else {
            // if root folder does not exist create root and home folders
            const createRootResponse = await bookmarksStore.create_bookmark(2, FOLDER.ROOT.label);
            await bookmarksStore.set_localStorage({ [FOLDER.ROOT.id]: createRootResponse });

            const createHomeResponse = await bookmarksStore.create_bookmark(createRootResponse.id, FOLDER.HOME.label);
            await bookmarksStore.set_localStorage({ [FOLDER.HOME.id]: createHomeResponse });
        }
    }

    onMounted(async () => {
        await buildFolders();

        const slideIndexResponse = await bookmarksStore.get_localStorage('sliderIndex');

        if (slideIndexResponse) {
            bookmarksStore.sliderIndex = slideIndexResponse;
        }
    });

</script>

<style scoped lang="scss">
    .folders-outer {
        background: #f0f0f0;
        background: radial-gradient(circle at 100% 100%, #cfcfcf 0%, #fff 100%);
        display: block;
        height: 100vh;
        overflow: hidden;
        width: 100vw;
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
