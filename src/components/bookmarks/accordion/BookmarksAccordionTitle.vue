<template>
    <v-expansion-panel-title>
        <!-- https://pictogrammers.com/library/mdi/ -->
        <button
            class="button"
            :class="{ active }"
            @click.stop="onButtonClick($event)">
            <v-icon
                class="icon"
                size="small"
                icon="mdi-file-edit-outline"></v-icon>
        </button>
        <input
            class="input"
            type="text"
            ref="input"
            :class="{ active }"
            :style="{width: inputWidth}"
            @click.stop="onInputClick($event)"
            @blur.stop="onBlur($event)"
            @keydown.stop="keyDown($event)"
            @keyup.stop="keyUp($event)"
            v-model="model" />
        <span ref="textwidth" class="text-width">{{ model }}</span>
    </v-expansion-panel-title>
</template>

<script setup>
    import { ref, onMounted, nextTick } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();

    const props = defineProps({
        bookmark: Object,
    });

    const input = ref();
    const active = ref(false);
    const inputWidth = ref(0);
    const model = ref(props.bookmark.title);
    const textwidth = ref();

    function onButtonClick() {
        active.value = true;
        input.value.focus();
    }

    function onInputClick(event) {
        event.preventDefault();
    }

    function onBlur() {
        bookmarksStore.update_bookmark(props.bookmark.id, { title: model.value });

        active.value = false;
    }

    async function keyDown(event) {
        if (event.keyCode === 13) {
            input.value.blur();
        }

        const add = event.keyCode === 8 ? 0 : 6;
        await nextTick();
        inputWidth.value = `${textwidth.value.clientWidth + add}px`;
    }

    function keyUp(event) {
        event.preventDefault();
    }

    onMounted(() => {
        inputWidth.value = `${textwidth.value.clientWidth + 6}px`;
    });

</script>

<style scoped lang="scss">
    .input {
        border: 1px solid transparent;
        padding: 4px 6px;
        pointer-events: none;

        &.active {
            pointer-events: initial;
        }

        &:focus {
            outline: none;
            border: 1px solid rgba(0,0,0,.12);
        }
    }

    .button {
        display: inline-block;
        margin-right: 4px;
        opacity: 0;

        &.active {
            opacity: 1;
        }
    }

    :deep(.v-expansion-panel-title__overlay) {
        pointer-events: none;
    }

    .v-expansion-panel-title {
        padding: 6px 24px 6px 14px;

        &:hover {
            .button {
                opacity: .5;
            }
        }
    }

    .icon {
        height: 15px;
    }

    .text-width {
        display: inline-block;
        font-size: 15px;
        padding: 0 10px;
        position: absolute;
        visibility: hidden;
        pointer-events: none;
        z-index: -1;
        white-space: nowrap;
    }
</style>
