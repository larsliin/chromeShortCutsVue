<template>
    <div class="navigation-outer">
        <div class="navigation-header-container animated">
            <div
                class="navigation-header"
                v-for="(bookmark, index) in bookmarksStore.bookmarks"
                :key="index"
                :class="{ active: bookmarksStore.sliderIndex === index }">
                <InputEdit
                    :style="'slider'"
                    :enabled="bookmarksStore.sliderIndex === index"
                    :value="bookmark.title"
                    :id="bookmark.id" />
            </div>
        </div>
        <div class="navigation-container">
            <button class="navigation-item"
                v-for="(bookmark, index) in bookmarksStore.bookmarks" :key="index"
                :class="{active: bookmarksStore.sliderIndex === index}"
                @click="onClick(index)">
                <div class="navigation-item-border">
                    <div class="navigation-item-inner"></div>
                </div>
            </button>
        </div>
    </div>
</template>

<script setup>
    import { useBookmarksStore } from '@stores/bookmarks';
    import { useUtils } from '@/shared/utils/utils';
    import InputEdit from '@/components/fields/InputEdit.vue';

    const utils = useUtils();

    const bookmarksStore = useBookmarksStore();

    function onClick(index) {
        utils.setSliderIndex(index, true);
    }
</script>

<style scoped lang="scss">
    .navigation-outer {
        $breakpoint: 540px;

        bottom: 0;
        left: 0;
        position: fixed;
        z-index: 5;
        width: $breakpoint;

        @media (min-width: $breakpoint) {
            width: 100%;
        }
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
        border-color: rgb(var(--v-theme-primary));
        border-radius: 50%;
        transform: scale(1.5);
    }

    .navigation-item-inner {
        background-color: rgb(var(--v-theme-primary));
        border-radius: 50%;
        height: 12px;
        margin: 3px;
        width: 12px;
    }

    .navigation-header-container {
        display: flex;
        height: 45px;
        justify-content: center;
        position: relative;
        user-select: none;
    }

    .navigation-header-container .navigation-header {
        color: rgb(var(--v-theme-primary));
        margin: 0;
        opacity: 0;
        position: absolute;
        top: 0;
    }

    .navigation-header-container .navigation-header.active {
        opacity: 1;
        transition-delay: 0.15s !important;
        z-index: 1;
    }

    .navigation-header-container.no-delay .navigation-header.active {
        transition-delay: 0s !important;
    }

    .navigation-header-container.animated .navigation-header {
        transition: all 0.15s ease-out;
    }
</style>
