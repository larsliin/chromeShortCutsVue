<template>
    <span class="bookmark-image-container"
        :class="{ 'dimmed': folder }">
        <span
            class="visibility-toggle"
            :class="{ hide }">
            <v-icon v-if="folder"
                icon="mdi-folder-open" />
            <template v-else-if="image">
                <span class="bookmark-image-overlay" ></span>
                <span class="bookmark-image"
                    :style="{ 'background-image': `url(${image})` }"></span>
            </template>
            <BIconStarFill v-else />
            <span
                v-if="loading"
                class="bookmark-image-spinner">
                <div class="lds-ring">
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
    import { BIconStarFill } from 'bootstrap-icons-vue';

    defineProps({
        folder: Boolean,
        image: String,
        loading: Boolean,
        hide: Boolean,
    });
</script>

<style scoped lang="scss">
    .visibility-toggle{
        position: relative;
        width: 100%;
        height: 100%;
        opacity: 1;
        transition: opacity .25s;
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
    }

    .lds-ring div {
        box-sizing: border-box;
        display: block;
        position: absolute;
        width: 36px;
        height: 36px;
        margin-left: -18px;
        margin-top: -18px;
        border: 5px solid var(--yellow);
        border-radius: 50%;
        animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        border-color: var(--yellow) transparent transparent transparent;
        left: 50%;
        top: 50%;
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
