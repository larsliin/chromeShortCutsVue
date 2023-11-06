<template>
    <div class="wrapper">
        <input
            class="input"
            ref="input"
            type="input"
            :class="[
                enabled ? 'enabled' : '',
                style,
                bookmarksStore.enableDarkMode ? 'dark' : ''
            ]"
            :style="{width: inputWidth}"
            v-model="model"
            @click.stop="onClick($event)"
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
        style: String,
        id: {
            type: String,
            required: true,
        },
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
        bookmarksStore.update_bookmark(props.id, { title: model.value });

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

        let add = event.keyCode === 8 ? 0 : 20;
        add = props.style === 'slider' ? add : 0;
        inputWidth.value = `${textwidth.value.clientWidth + add}px`;
    }

    onMounted(() => {
        const add = props.style === 'slider' ? 20 : 0;
        inputWidth.value = `${textwidth.value.clientWidth + add}px`;
    });

    function onClick(event) {
        event.preventDefault();
    }

</script>

<style scoped lang="scss">
    .wrapper:hover  {
        .input {
            border: 1px solid rgba(0,0,0,.12);

            &.dark {
                border: 1px solid var(--darkmode-300);
            }
        }
    }

    .input {
        border-radius: 4px;
        border: 1px solid transparent;
        font-size: 16px;
        padding: 6px;
        pointer-events: none;
        width: auto;

        &.slider {
            text-align: center;

            &:focus {
                border: 1px solid rgba(0,0,0,.12);
                box-shadow: 0 2px 3px 0px rgba(0, 0, 0, 0.2);

                &.dark {
                    border: 1px solid var(--darkmode-400);
                    box-shadow: 0 2px 3px 0px rgba(255, 255, 255, 0.2);
                }
            }
        }

        &:focus {
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
