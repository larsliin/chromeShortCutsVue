<template>
    <span class="bookmark-image-container">
        <template v-if="image">
            <span class="bookmark-image-overlay" ></span>
            <span class="bookmark-image"
                :style="{ 'background-image': `url(${image})` }"></span>
        </template>
        <BIconStarFill v-else />
    </span>
</template>

<script setup>
    import { BIconStarFill } from 'bootstrap-icons-vue';

    defineProps({
        image: String,
    });
</script>

<style scoped lang="scss">
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
