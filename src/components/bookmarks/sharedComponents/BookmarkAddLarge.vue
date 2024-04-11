<template>
    <div class="outer"
        v-if="!bookmarksStore.bookmarks.length && !bookmarksStore.bookmarkSearch"
        :class="{ dark: bookmarksStore.enableDarkMode }"
        @keyup.enter="onClick()"
        @click="onClick()">
        <v-icon
            class="icon"
            :icon="mdiStar" />
    </div>
</template>

<script setup>
    import { mdiStar } from '@mdi/js';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { EMITS } from '@/constants';
    import useEventsBus from '@cmp/eventBus';

    const { emit } = useEventsBus();

    const bookmarksStore = useBookmarksStore();

    function onClick() {
        emit(EMITS.CLICK_BACKGROUND);
    }
</script>

<style scoped lang="scss">
    .outer {
        aspect-ratio: 1;
        border-radius: 20px;
        border: dashed 20px #000;
        color: #000;
        left: 50%;
        opacity: .075;
        position: absolute;
        top: 50%;
        transform: translate(-50%,-50%);
        transition: opacity .1s;
        width: 200px;

        &.dark {
            border-color: #fff;
            color: #fff;
        }

        &:hover {
            cursor: pointer;
            opacity: .15;
        }
    }

    .icon {
        font-size: 150px;
        left: 50%;
        position: absolute;
        top: 50%;
        transform: translate(-50%,-50%);
    }
</style>
