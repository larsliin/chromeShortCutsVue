<template>
    <div class="wrapper">
        <input
            ref="input"
            type="input"
            class="input"
            :class="{ 'enabled': enabled }"
            :style="{width: inputWidth}"
            v-model="model"
            @focus="bookmarksStore.titleInputActive = true"
            @blur="onBlur()"
            @keydown="onChange($event)" />
        <span ref="textwidth" class="text-width">{{ model }}</span>
    </div>
</template>

    <script setup>
    import { ref, onMounted } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();

    const props = defineProps({
        value: {
            type: String,
            required: true,
        },
        enabled: {
            type: Boolean,
            default: true,
        },
    });

    const model = ref(props.value);

    function onBlur() {
        const { id } = bookmarksStore.bookmarks[bookmarksStore.sliderIndex];

        bookmarksStore.update_bookmark(id, { title: model.value });

        bookmarksStore.titleInputActive = false;
    }

    const input = ref();
    const inputWidth = ref(0);
    const textwidth = ref();

    function onChange(event) {
        if (event.keyCode === 13) {
            input.value.blur();
            return;
        }

        const add = event.keyCode === 8 ? 0 : 20;
        inputWidth.value = `${textwidth.value.clientWidth + add}px`;
    }

    onMounted(() => {
        inputWidth.value = `${textwidth.value.clientWidth + 20}px`;
    });

</script>

<style scoped lang="scss">
    .wrapper:hover  {
        .input {
            border: 1px solid rgba(0,0,0,.12);
        }
    }

    .input {
        border-radius: 4px;
        border: 1px solid transparent;
        color: var(--yellow);
        font-size: 16px;
        font-weight: 700;
        padding: 6px;
        pointer-events: none;
        text-align: center;
        width: auto;

        &:focus {
            border: 1px solid rgba(0,0,0,.12);
            box-shadow: 0 2px 3px 0px rgba(0, 0, 0, 0.2);
            outline: none;
        }

        &.enabled {
            pointer-events: initial;
        }
    }

    .text-width {
        display: inline-block;
        font-size: 16px;
        font-weight: 700;
        padding: 6px;
        position: absolute;
        visibility: hidden;
        pointer-events: none;
        z-index: -1;
        white-space: nowrap;
    }

</style>
