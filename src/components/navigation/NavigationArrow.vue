<template>
    <button
        class="navigation-arrow"
        :disabled="disabled"
        :class="direction"
        @click="onClick()">
        <!-- https://pictogrammers.com/library/mdi/ -->
        <v-icon size="large" icon="mdi-chevron-right" v-if="direction === 'right'" ></v-icon>
        <v-icon size="large" icon="mdi-chevron-left" v-if="direction === 'left'" ></v-icon>
    </button>
</template>

<script setup>
    import { ref, onMounted, watch } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { useUtils } from '@/shared/utils/utils';

    const utils = useUtils();

    const props = defineProps({
        direction: {
            type: String,
            required: true,
        },
    });

    const disabled = ref(false);

    const bookmarksStore = useBookmarksStore();

    function onClick() {
        if (props.direction === 'left'
            && bookmarksStore.sliderIndex > 0) {
            utils.setSliderIndex(bookmarksStore.sliderIndex - 1, true);
        }
        if (props.direction === 'right'
            && bookmarksStore.sliderIndex < bookmarksStore.bookmarks.length - 1) {
            utils.setSliderIndex(bookmarksStore.sliderIndex + 1, true);
        }
    }

    function toggleEnabled() {
        if (props.direction === 'right') {
            disabled.value = bookmarksStore.sliderIndex === bookmarksStore.bookmarks.length - 1;
        }

        if (props.direction === 'left') {
            disabled.value = bookmarksStore.sliderIndex === 0;
        }
    }

    onMounted(() => {
        toggleEnabled();
    });

    watch(() => bookmarksStore.sliderIndex, () => {
        toggleEnabled();
    });

</script>

<style scoped lang="scss">
.navigation {
    &-arrow {
        color: var(--yellow);
        font-size: 40px;
        height: 140px;
        background-color: rgba(255, 255, 255, .75);
        opacity: 0.4;
        position: absolute;
        text-align: center;
        top: 50%;

        margin-top: -70px;
        transition: opacity 0.15s, left 0.15s, right 0.15s, transform .15s, box-shadow .15s;
        box-shadow: 0px 0 0 0px rgba(0, 0, 0, 0);
        width: 110px;
        z-index: 5;
        outline: none;

        svg {
            display: inline-block;
        }

        &:enabled{
            cursor: pointer;
        }

        &:disabled {
            opacity: 0.1;
        }

        &:focus-visible,
        &:hover:enabled {
            opacity: 1;
            transform: scale(1.25);
            box-shadow: 0px 0 20px 0px rgba(0, 0, 0, 0.15);
        }

        &.left {
            border-radius: 0 70px 70px 0;
            left: -20px;
            padding-left: 30px;
            text-align: left;
            transform-origin: left;

            &:hover:enabled {
                left: 0;
            }
        }

        &.right {
            border-radius: 70px 0 0 70px;
            padding-right: 30px;
            right: -20px;
            text-align: right;
            transform-origin: right;

            &:hover:enabled {
                right: 0;
            }
        }

        @media (min-width: 1200px) {
            width: 160px;
            height: 200px;
            font-size: 50px;
            margin-top: -100px;
            background-color: rgba(255, 255, 255, .35);

            &.left {
                border-radius: 0 100px 100px 0;
                left: -20px;
                padding-left: 30px;
            }

            &.right {
                border-radius: 100px 0 0 100px;
                padding-right: 30px;
                right: -20px;
            }
        }
    }
}
</style>
