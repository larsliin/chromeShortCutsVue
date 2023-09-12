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
    import { onMounted, nextTick } from 'vue';
    import BookmarksSlider from '@/components/bookmarks/BookmarksSlider.vue';
    import NavigationDots from '@/components/navigation/NavigationDots.vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { FOLDER } from '@/constants';
    import NavigationArrow from '@/components/navigation/NavigationArrow.vue';

    const bookmarksStore = useBookmarksStore();

    async function onCreated(event) {
        const bookmark = await bookmarksStore.get_bookmarkById(event);

        const folder = bookmarksStore.bookmarks.find(e => e.id === bookmark.parentId);

        folder.children.push(bookmark);
    }

    async function onRemoved(event) {
        const folder = bookmarksStore.bookmarks.find(obj => obj.children.find(item => item.id === event));

        if (!folder) {
            // if folder has been deleted then
            // delete bookmark from shared bookmarks array in store
            const filtered = bookmarksStore.bookmarks.filter(e => e.id != event);
            bookmarksStore.bookmarks = filtered;

            return;
        }

        if (folder.children.length === 1) {
            // if last bookmark in folder
            // then delete folder with content
            bookmarksStore.remove_bookmark(folder.id);
        } else {
            // delete bookmark from shared bookmarks array in store
            const filtered = bookmarksStore.bookmarks.map(obj => ({
                ...obj,
                children: obj.children.filter(item => item.id !== event)
            }));
            bookmarksStore.bookmarks = filtered;
        }
    }

    async function onChanged() {
        const getRootResponse = await bookmarksStore.get_localStorage(FOLDER.ROOT.id);
        const bookmarks = await bookmarksStore.get_bookmarks(getRootResponse.id);
        bookmarksStore.bookmarks = bookmarks[0].children;
    }

    function setChromeEventListeners() {
        chrome.bookmarks.onCreated.addListener(onCreated);

        chrome.bookmarks.onRemoved.addListener(onRemoved);

        chrome.bookmarks.onMoved.addListener(onChanged);

        chrome.bookmarks.onChanged.addListener(onChanged);
    }

    async function getBookmarks() {
        const getRootResponse = await bookmarksStore.get_localStorage(FOLDER.ROOT.id);

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
