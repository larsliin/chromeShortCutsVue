<template>
    <div class="navigation-outer">
        <div class="navigation-header-container animated">
            <h3 class="navigation-header"
                v-for="(bookmark, index) in bookmarksStore.bookmarks"
                :class="{active: bookmarksStore.slideIndex === index}">{{ bookmark.title }}</h3>
        </div>
        <div class="navigation-container">
            <button class="navigation-item"
                v-for="(, index) in bookmarksStore.bookmarks"
                :class="{active: bookmarksStore.slideIndex === index}"
                @click="onClick(index)">
                <div class="navigation-item-border">
                    <div class="navigation-item-inner"></div>
                </div>
            </button>
        </div>
    </div>
</template>

<script setup>
    import { onMounted } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();

    function onClick(index) {
        bookmarksStore.slideIndex = index;

        bookmarksStore.set_localStorage({ slideIndex: bookmarksStore.slideIndex });
    }

onMounted(() => {
    console.log(bookmarksStore.bookmarks);
});
</script>

<style scoped lang="scss">
.navigation-outer {
    bottom: 0;
    left: 0;
    position: fixed;
    width: 100%;
    z-index: 5;
}

.navigation-container {
    display: flex;
    justify-content: center;
    padding-bottom: 20px;
}

.navigation-item {
    background: none repeat scroll 0 0 transparent;
    cursor: pointer;
    line-height: 0;
    padding: 5px;
    border-spacing: 0;
    border: 0;
    outline-color: #01a1f6;
}

.navigation-item-border {
    border-radius: 50%;
    border-spacing: 0;
    border: 3px solid transparent;
}

.navigation-item.active .navigation-item-border{
    border-color: var(--yellow);
    border-radius: 50%;
    transform: scale(1.5);
}

.navigation-item-inner {
    background-color: var(--yellow);
    border-radius: 50%;
    height: 12px;
    margin: 3px;
    width: 12px;
}

.navigation-header-container {
    display: flex;
    height: 35px;
    justify-content: center;
    position: relative;
    user-select: none;
}

.navigation-header-container .navigation-header {
    color: var(--yellow);
    margin: 0;
    opacity: 0;
    position: absolute;
    top: 0;
}

.navigation-header-container .navigation-header.active {
    opacity: 1;
    transition-delay: 0.15s !important;
}

.navigation-header-container.no-delay .navigation-header.active {
    transition-delay: 0s !important;
}

.navigation-header-container.animated .navigation-header {
    transition: all 0.15s ease-out;
}
</style>
