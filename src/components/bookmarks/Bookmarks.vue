<template>
      <BookmarksSlider v-if="bookmarksStore.bookmarks" />
</template>

<script setup>
    import { onMounted } from 'vue';
    import BookmarksSlider from '@/components/bookmarks/BookmarksSlider.vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { FOLDER } from '@/constants';

    const bookmarksStore = useBookmarksStore();

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

    async function getBookmarks() {
        const getRootResponse = await bookmarksStore.get_localStorage(FOLDER.ROOT.id);

        const bookmarks = await bookmarksStore.get_bookmarks(getRootResponse.id);

        bookmarksStore.bookmarks = bookmarks[0].children;
    }

    onMounted(async () => {
        buildFolders();
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
