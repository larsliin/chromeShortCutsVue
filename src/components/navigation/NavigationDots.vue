<template>
    <div class="navigation-outer">
        <div class="navigation-header-container animated">
            <div
                class="navigation-header"
                v-for="(bookmark, index) in bookmarksStore.bookmarks"
                :key="index"
                :class="{ active: bookmarksStore.sliderIndex === index }">
            </div>
            <div class="wrapper">
                <div>
                    <input
                        aria-label="Bookmark Folder Title"
                        class="input"
                        ref="input"
                        type="input"
                        tabindex="-1"
                        :readonly="!active"
                        :class="[
                            active ? 'active' : '',
                            bookmarksStore.enableDarkMode ? 'dark' : '',
                        ]"
                        v-model="bookmarksStore.bookmarks[bookmarksStore.sliderIndex].title"
                        @click.stop="onClick($event)"
                        @focus="bookmarksStore.titleInputActive = true"
                        @blur="onBlur()"
                        @keydown="onChange($event)" />
                </div>
                <div class="foldout">
                    <BookmarkFoldout
                        :list="list"
                        class="foldout"
                        @delete="onDelete()"
                        @bookmarkAdd="onBookmarkAdd()"
                        @rename="onRename()" />
                </div>
            </div>
        </div>
        <div class="navigation-container">
            <button class="navigation-item"
                type="button"
                v-for="(bookmark, index) in bookmarksStore.bookmarks"
                :key="index"
                :class="{ active: bookmarksStore.sliderIndex === index }"
                @click="onClick(index)">
                <div class="navigation-item-border">
                    <div class="navigation-item-inner"></div>
                </div>
            </button>
        </div>
    </div>
    <Teleport to="body"
        v-if="showConfirmDelete">
        <template>
            <v-row justify="center">
                <v-dialog
                    v-model="showConfirmDelete"
                    persistent
                    width="450">
                    <BookmarkConfirmDelete
                        :showFolderMessage="true"
                        :title="bookmarksStore.bookmarks[bookmarksStore.sliderIndex].title"
                        :id="bookmarksStore.bookmarks[bookmarksStore.sliderIndex].id"
                        @cancel="showConfirmDelete = false"
                        @confirm="onDeleteConfirm()" />
                </v-dialog>
            </v-row>
        </template>
    </Teleport>
</template>

<script setup>
    import { mdiRename, mdiDeleteOutline, mdiStar } from '@mdi/js';
    import { ref } from 'vue';
    import { EMITS } from '@/constants';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { useUtils } from '@/shared/composables/utils';
    import BookmarkFoldout from '@/components/fields/BookmarkFoldout.vue';
    import BookmarkConfirmDelete from '@/components/forms/BookmarkConfirmDelete.vue';
    import useEventsBus from '@cmp/eventBus';

    const { emit } = useEventsBus();

    const utils = useUtils();

    const bookmarksStore = useBookmarksStore();

    function onClick(index) {
        utils.setSliderIndex(index, true);
    }

    const list = ref([
        {
            title: 'New Bookmark',
            icon: mdiStar,
            event: EMITS.BOOKMARK_ADD,
        },
        {
            title: 'Rename',
            icon: mdiRename,
            event: EMITS.RENAME,
        },
        {
            title: 'Delete',
            icon: mdiDeleteOutline,
            event: EMITS.DELETE,
        },
    ]);

    const active = ref(false);
    const input = ref();

    const showConfirmDelete = ref(false);

    function onDelete() {
        showConfirmDelete.value = true;
    }

    function onDeleteConfirm() {
        showConfirmDelete.value = false;

        // delete all bookmarks in folder from local storage
        utils.deleteBookmarkFolder(bookmarksStore.bookmarks[bookmarksStore.sliderIndex]);
    }

    function onBookmarkAdd() {
        emit(EMITS.BOOKMARK_ADD, bookmarksStore.bookmarks[bookmarksStore.sliderIndex].id);
    }

    function onRename() {
        active.value = true;
        input.value.focus();
    }

    function onBlur() {
        active.value = false;

        bookmarksStore.update_bookmark(
            bookmarksStore.bookmarks[bookmarksStore.sliderIndex].id,
            { title: bookmarksStore.bookmarks[bookmarksStore.sliderIndex].title },
        );

        bookmarksStore.titleInputActive = false;
    }

    function onChange(event) {
        if (event.keyCode === 13 || event.keyCode === 27) {
            input.value.blur();
        }
    }
</script>

<style scoped lang="scss">
    .navigation-outer {
        $breakpoint: 540px;
        bottom: 0;
        left: 0;
        position: fixed;
        z-index: 5;
        width: $breakpoint;

        @media (min-width: $breakpoint) {
            width: 100%;
        }
    }

    .navigation-header {
        display: flex;
    }

    .navigation-container {
        display: flex;
        justify-content: center;
        padding-bottom: 20px;
    }

    .navigation-item {
        background: none repeat scroll 0 0 transparent;
        cursor: pointer;
        line-height: 0;
        padding: 5px;
        border-spacing: 0;
        border: 0;
        outline-color: #01a1f6;
    }

    .navigation-item-border {
        border-radius: 50%;
        border-spacing: 0;
        border: 3px solid transparent;
    }

    .navigation-item.active .navigation-item-border{
        border-color: rgb(var(--v-theme-primary));
        border-radius: 50%;
        transform: scale(1.5);
    }

    .navigation-item-inner {
        background-color: rgb(var(--v-theme-primary));
        border-radius: 50%;
        height: 12px;
        margin: 3px;
        width: 12px;
    }

    .navigation-header-container {
        display: flex;
        height: 45px;
        justify-content: center;
        position: relative;
        user-select: none;
    }

    .navigation-header-container .navigation-header {
        color: rgb(var(--v-theme-primary));
        margin: 0;
        opacity: 0;
        position: absolute;
        top: 0;
    }

    .navigation-header-container .navigation-header.active {
        opacity: 1;
        transition-delay: 0.15s !important;
        z-index: 1;
    }

    .navigation-header-container.no-delay .navigation-header.active {
        transition-delay: 0s !important;
    }

    .navigation-header-container.animated .navigation-header {
        transition: all 0.15s ease-out;
    }

    .wrapper  {
        align-items: center;
        display: flex;
        flex-direction: row;
        margin-bottom: 10px;
        position: relative;

        &:hover .foldout {
            opacity: 1;
        }
     }

     .input {
        border-radius: 5px;
        field-sizing: content;
        font-size: 16px;
        min-inline-size: 5ch;
        padding: 6px;
        width: auto;

        &.active {
            background-color: rgba(0,0,0,.12);

            &.dark {
                background-color: var(--darkmode-200);
            }
        }

        &:focus {
            outline: none;
        }

        &:focus {
            cursor: default;
        }

        &.enabled {
            pointer-events: initial;
        }
    }

    .foldout {
        right: 0;
        position: absolute;
        transform: translateX(42px);
        opacity: .25;
    }
</style>
