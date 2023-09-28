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
        <!-- https://pictogrammers.com/library/mdi/ -->
        <v-btn
            class="edit-button"
            icon="mdi-square-edit-outline"
            @click="onIconClick()"></v-btn>
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
    const inputWidth = ref(0);
    const textwidth = ref();
    const input = ref();

    function onBlur() {
        const { id } = bookmarksStore.bookmarks[bookmarksStore.sliderIndex];

        bookmarksStore.update_bookmark(id, { title: model.value });

        bookmarksStore.titleInputActive = false;
    }

    function onChange(event) {
        if (event.keyCode === 13) {
            input.value.blur();
            return;
        }

        const add = event.keyCode === 8 ? 0 : 20;
        inputWidth.value = `${textwidth.value.clientWidth + add}px`;
    }

    function onIconClick() {
        input.value.setSelectionRange(0, 0);

        input.value.focus();
    }

    onMounted(() => {
        inputWidth.value = `${textwidth.value.clientWidth + 20}px`;
    });

</script>

<style scoped lang="scss">
    .wrapper:hover .edit-button {
        opacity: 1;
        transition-delay: .5s;
    }

    .edit-button {
        aspect-ratio: 1;
        font-size: 11px;
        height: auto;
        margin-left: -6px;
        padding-top: 1px;
        position: absolute;
        top: 7px;
        opacity: 0;
        transition: opacity .05s;
        width: 25px;
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
            background-color: #fff;
            border: 1px solid rgba(0,0,0,.12);
            box-shadow: 0 2px 3px 0px rgba(0, 0, 0, 0.2);
            outline: none;

            + .edit-button {
                opacity: 0;
            }
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
