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
        <div class="edit-button">
            <v-icon
                class="icon"
                size="small"
                icon="mdi-square-edit-outline"
                @click="onIconClick()"></v-icon>
        </div>
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
        const add = event.keyCode === 8 ? 0 : 20;
        inputWidth.value = `${textwidth.value.clientWidth + add}px`;
    }

    function onIconClick() {
        input.value.focus();
    }

    onMounted(() => {
        inputWidth.value = `${textwidth.value.clientWidth + 20}px`;
    });

</script>

<style scoped lang="scss">
    .wrapper:hover .edit-button {
        display: block;
    }

    .edit-button {
        background-color: #fff;
        border-radius: 50%;
        box-shadow: 0 2px 2px 1px rgba(0, 0, 0, .15);
        display: none;
        font-size: 14px;
        line-height: 0;
        padding: 5px;
        position: absolute;
        right: -22px;
        top: 3px;
    }

    .input {
        border-radius: 6px;
        border: none;
        color: var(--yellow);
        font-size: 16px;
        font-weight: 700;
        padding: 6px;
        pointer-events: none;
        text-align: center;
        width: auto;

        &:focus {
            background-color: #fff;
            box-shadow: 0 2px 2px 2px rgba(0, 0, 0, .15);
            outline: none;

            + .edit-button {
                display: none !important;
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
