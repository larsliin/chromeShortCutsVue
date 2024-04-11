<template>
    <span class="bookmark-image-container"
        :style="{ backgroundColor: color }"
        :class="{ dimmed: folder, dark: bookmarksStore.enableDarkMode }">
        <span
            class="visibility-toggle"
            :class="{ hide }">
            <v-icon v-if="folder"
                :icon="mdiFolderOpen" />
            <template v-else-if="image">
                <span class="bookmark-image-overlay"></span>
                <span class="bookmark-image"
                    :style="{ 'background-image': `url(${image})` }"></span>
            </template>
            <BIconStarFill v-else />
            <span
                v-if="loading">
                <div class="lds-ring"
                    :class="{ dark: bookmarksStore.enableDarkMode }">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </span>
        </span>
    </span>
</template>

<script setup>
    import { mdiFolderOpen } from '@mdi/js';
    import { BIconStarFill } from 'bootstrap-icons-vue';
    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();

    defineProps({
        color: {
            type: String,
            default: '',
        },
        folder: Boolean,
        hide: Boolean,
        image: {
            type: String,
            default: null,
        },
        loading: Boolean,
    });
</script>

<style scoped lang="scss">
    .visibility-toggle{
        align-items: center;
        display: flex;
        height: 100%;
        justify-content: center;
        opacity: 1;
        position: relative;
        transition: opacity .25s;
        width: 100%;
    }

    .hide {
        opacity: 0;
    }

    .lds-ring {
        background-color: rgba(255, 255, 255, 0.8);
        display: inline-block;
        height: 100%;
        left: 0;
        position: absolute;
        top: 0;
        width: 100%;
        z-index: 1;

        &.dark {
            background-color: rgba(var(--darkmode-rgb-300), .8)
        }
    }

    .lds-ring div {
        animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        border-color: var(--yellow) transparent transparent transparent;
        border-radius: 50%;
        border-style: solid;
        border-width: 5px;
        box-sizing: border-box;
        display: block;
        height: 36px;
        left: 50%;
        margin-left: -18px;
        margin-top: -18px;
        position: absolute;
        top: 50%;
        width: 36px;
    }

    .lds-ring div:nth-child(1) {
        animation-delay: -0.45s;
    }

    .lds-ring div:nth-child(2) {
        animation-delay: -0.3s;
    }

    .lds-ring div:nth-child(3) {
        animation-delay: -0.15s;
    }

    @keyframes lds-ring {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    .bookmark-image-overlay {
        box-shadow: 0 0 20px 10px rgba(0, 0, 0, 0.04) inset;
        height: 100%;
        opacity: 0;
        position: absolute;
        transition: opacity 0.05s;
        width: 100%;
    }

    .bookmark-image-container {
        align-items: center;
        aspect-ratio: 1;
        background-color: #fff;
        border-radius: 10px;
        box-shadow: 0px 0 20px 0px rgba(0, 0, 0, 0.15);
        color: var(--yellow);
        display: flex;
        font-size: 50px;
        justify-content: center;
        overflow: hidden;
        padding: 10px;
        position: relative;
        transform-origin: center right;
        transition: all 0.05s;
        width: 90px;

        &.dark {
            background-color: var(--darkmode-300);
            box-shadow: none;
        }

        &.dimmed {
            color: var(--grey);
        }
    }

    .bookmark-image {
        background-position: center;
        background-repeat: no-repeat;
        background-size: contain;
        border-radius: 7px;
        display: block;
        height: 100%;
        width: 100%;
    }
</style>
