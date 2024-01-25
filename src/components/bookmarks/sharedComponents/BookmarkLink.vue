<template>
    <span class="bookmark relative inline-block"
        :class="{ 'foldout-open': isFoldoutOpen }">
        <span class="handle">
            <a
                v-bind="props"
                class="bookmark-link"
                :draggable="draggable"
                title=""
                :aria-label="bookmark.title"
                :class="[bookmark.url ? '' : 'folder', size, hideEdit ? 'hide-edit' : '']"
                :href="bookmark.url"
                :id="bookmark.id"
                :tabindex="tabIndex"
                @keyup.enter="onClick($event)"
                @click="onClick($event)">
                <BookmarkIcon
                    :color="color"
                    :hide="!ready"
                    :folder="!bookmark.url"
                    :image="image" />
                <span class="bookmark-title-container"
                    v-if="((hideEdit && !image) || !hideEdit)">{{ bookmark.title }}</span>
            </a>
        </span>
        <template v-if="!hideEdit">
            <div class="tooltip">{{ bookmark.title }}</div>
            <div class="bookmark-edit">
                <BookmarkFoldout
                    :darkModeBorder="true"
                    :list="list"
                    :size="'x-small'"
                    @toggle="onToggle($event)"
                    @delete="onDelete()"
                    @edit="emit(EMITS.EDIT, bookmark.id)"
                    @openColorEditor="showColorEdit = true" />
            </div>
        </template>
    </span>
    <Teleport to="body"
        v-if="showConfirmDelete">
        <template>
            <v-row justify="center">
                <v-dialog
                    v-model="showConfirmDelete"
                    persistent
                    width="450">
                    <BookmarkConfirmDelete
                        :title="props.bookmark.title"
                        :id="bookmark.id"
                        :showFolderMessage="bookmark.url ? true : false"
                        @cancel="showConfirmDelete = false"
                        @confirm="onDeleteConfirm($event)" />
                </v-dialog>
            </v-row>
        </template>
    </Teleport>
    <Teleport to="body"
        v-if="showColorEdit">
        <template>
            <v-row justify="center">
                <v-dialog
                    v-model="showColorEdit"
                    persistent
                    width="450">
                    <BookmarkColorEdit
                        :value="bookmark.color"
                        @confirm="onColorConfirm($event)"
                        @cancel="showColorEdit = false" />
                </v-dialog>
            </v-row>
        </template>
    </Teleport>
</template>

<script setup>
    import { mdiRename, mdiDeleteOutline, mdiPalette } from '@mdi/js';
    import {
        ref, onMounted, watch, toRef,
    } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { EMITS } from '@/constants';
    import useEventsBus from '@cmp/eventBus';
    import BookmarkConfirmDelete
        from '@/components/forms/BookmarkConfirmDelete.vue';
    import BookmarkIcon from '@/components/bookmarks/sharedComponents/BookmarkIcon.vue';
    import BookmarkFoldout
        from '@/components/fields/BookmarkFoldout.vue';
    import BookmarkColorEdit
        from '@/components/forms/BookmarkColorEdit.vue';
    import { useUtils } from '@/shared/utils/utils';
    import { uniq } from 'lodash';

    const utils = useUtils();

    const { emit, bus } = useEventsBus();

    const props = defineProps({
        tabIndex: {
            type: String,
            default: '-1',
        },
        bookmark: Object,
        size: String,
        hideEdit: Boolean,
        draggable: {
            type: Boolean,
            default: true,
        },
    });

    const isFoldoutOpen = ref(false);
    const image = toRef(props.bookmark, 'image');
    const ready = ref(false);
    const list = ref([
        {
            title: 'Delete',
            icon: mdiDeleteOutline,
            event: EMITS.DELETE,
        },
    ]);

    const emits = defineEmits([
        EMITS.UPDATE,
    ]);

    const bookmarksStore = useBookmarksStore();

    async function updateImage() {
        const getImageResponse = await bookmarksStore.get_localStorage(props.bookmark.id);

        if (getImageResponse) {
            image.value = getImageResponse.image;
        }

        ready.value = true;

        emits(EMITS.UPDATE);
    }

    function onClick(event) {
        event.preventDefault();

        if (event.pointerId < 0) {
            return;
        }

        if (!bookmarksStore.statistics) {
            bookmarksStore.statistics = [];
        }
        const bookmarkStats = bookmarksStore.statistics
            .find((item) => item.url === (props.bookmark.url));

        const bookmarkStatsIndex = bookmarksStore.statistics
            .findIndex((item) => Object.values(item.id).includes(props.bookmark.id));

        const index = (bookmarkStatsIndex) === -1 ? bookmarksStore.statistics.length
            : bookmarkStatsIndex;
        const clicks = bookmarkStats?.clicks !== undefined
            ? parseInt(bookmarkStats.clicks, 10) + 1 : 1;

        let idArr;
        if (bookmarkStats) {
            idArr = Object.values(bookmarkStats.id);
            idArr.push(props.bookmark.id);
            idArr = uniq(idArr);
        } else {
            idArr = [props.bookmark.id];
        }

        bookmarksStore.statistics[index] = ({
            clicks,
            id: idArr,
            title: props.bookmark.title,
            timestamp: Date.now(),
            url: props.bookmark.url,
        });

        const sorted = bookmarksStore.statistics.sort((a, b) => {
            if (b.clicks !== a.clicks) {
                return b.clicks - a.clicks;
            }
            return b.timestamp - a.timestamp;
        });

        bookmarksStore.set_syncStorage({ statistics: sorted });

        if (event.ctrlKey || event.metaKey) {
            window.open(props.bookmark.url, '_blank');
        } else {
            window.location.href = props.bookmark.url;
        }
    }

    const color = toRef(props.bookmark, 'color');

    async function updateColor() {
        const getColorResponse = await bookmarksStore.get_syncStorage('bookmarkColors');

        if (getColorResponse) {
            color.value = getColorResponse[props.bookmark.id];
        }
    }

    const showConfirmDelete = ref(false);

    function onDelete() {
        showConfirmDelete.value = true;
    }

    function onDeleteConfirm() {
        showConfirmDelete.value = false;

        if (props.bookmark.url) {
            bookmarksStore.remove_bookmark(props.bookmark.id);
        } else {
            bookmarksStore.remove_bookmarkFolder(props.bookmark.id);
        }
    }

    function onToggle(event) {
        isFoldoutOpen.value = event;
    }

    watch(() => bus.value.get(EMITS.IMAGES_IMPORT), () => {
        updateImage();
        updateColor();
    });

    watch(() => bus.value.get(EMITS.ICON_UPDATE), (id) => {
        if (id[0] === props.bookmark.id) {
            updateImage();
        }
    });

    const selectedColor = ref();

    const showColorEdit = ref(false);

    async function onColorConfirm(event) {
        selectedColor.value = event;

        showColorEdit.value = false;

        const getColorsResponse = await bookmarksStore.get_syncStorage('bookmarkColors');
        const colorsObj = getColorsResponse || {};

        const bookmark = utils.getStoredBookmarkById(props.bookmark.id);

        if (event) {
            colorsObj[props.bookmark.id] = selectedColor.value;
            bookmark.color = selectedColor.value;
            color.value = selectedColor.value;
        } else if (colorsObj[props.bookmark.id]) {
            delete colorsObj[props.bookmark.id];
            bookmark.color = '';
            color.value = null;
        }

        if (!Object.keys(colorsObj).length) {
            bookmarksStore.delete_syncStorageItem('bookmarkColors');
        } else {
            bookmarksStore.set_syncStorage({ bookmarkColors: colorsObj });
        }

        emit(EMITS.BOOKMARKS_UPDATED, { type: 'color', id: props.bookmark.id });
    }

    onMounted(() => {
        if (props.bookmark.url) {
            const colorItem = {
                title: 'Color',
                icon: mdiPalette,
                event: EMITS.OPEN_COLOR_EDITOR,
            };

            const editItem = {
                title: 'Edit',
                icon: mdiRename,
                event: EMITS.EDIT,
            };

            list.value.unshift(colorItem);
            list.value.unshift(editItem);
        }

        updateImage();
    });

</script>
<style scoped lang="scss">

    .bookmark {
        display: inline-block;
        margin: 0 0 8px;
        position: relative;
    }

    .foldout {
        margin-right: 4px;
    }

    .bookmark-link {
        align-items: center;
        color: rgba(var(--v-theme-on-surface),var(--v-high-emphasis-opacity));
        display: flex;
        flex-direction: column;
        margin-top: 28px;
        outline-color: #01a1f6;
        outline-offset: 14px;
        text-decoration: none;
        width: 90px;

        &.hide-edit {
            margin-top: 4px;

            .bookmark-title-container {
                margin-top: 4px;
            }
        }

        &.small {
            width: 82px;

            .bookmark-image-container {
                width: 100%;
                padding: 6px;
            }

            .bookmark-title-container {
                font-size: 11px;
            }
        }

        &.smaller {
            width: 50px;

            .bookmark-image-container {
                border-radius: 6px;
                padding: 4px;
                width: 100%;

                :deep(svg) {
                    width: 32px
                }
            }

            .bookmark-title-container {
                font-size: 10px;
            }
        }
    }

    .bookmark-image-container {
        transform-origin: center right;
    }

    :deep(.v-btn--icon.v-btn--density-default) {
        width: 28px;
        height: 28px;
    }

    .bookmark-title-container {
        display: inline-block;
        margin: 15px 0 0;
        max-width: 100%;
        overflow: hidden;
        padding-bottom: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .bookmark-edit {
        visibility: hidden;
        position: absolute;
        right: 0;
        top: -6px;
        opacity: .5;
    }

    .bookmark {
        &:hover,
        &.foldout-open {
            z-index: 1;
            .tooltip {
                opacity: 1;
                transition: opacity 0s;
                transition-delay: 400ms;
            }

            .bookmark-edit {
                visibility: visible;
            }
        }
    }

    .tooltip {
        background: rgb(var(--v-theme-surface-variant));
        border-radius: 4px;
        bottom: 0;
        color: rgb(var(--v-theme-on-surface-variant));
        font-size: 14px;
        left: 50%;
        max-width: 200px;
        opacity: 0;
        overflow: hidden;
        padding: 5px 16px;
        pointer-events: none;
        position: absolute;
        text-overflow: ellipsis;
        transform: translate(-50%, 6px);
        white-space: nowrap;

        @media (min-width: 768px) {
            max-width: 230px;
        }

        @media (min-width: 1024px) {
            max-width: 300px;
        }

        @media (min-width: 1200px) {
            max-width: 500px;
        }
    }

    .bookmark:hover .bookmark-link:not(.folder) .bookmark-image-container {
        transform: perspective(400px) rotateY(25deg) scale(1.02);
        box-shadow: 0 0 25px 0px rgba(0, 0, 0, 0.15);
    }

    .bookmark .bookmark-link:active:not(.folder) .bookmark-image-container {
        transform: perspective(400px) rotateY(-15deg) scale(.98);
        box-shadow: 0 0 25px 0px rgba(0, 0, 0, 0.15);
        transform-origin: center right;
    }

    .bookmark.dragging .bookmark-link .bookmark-image-container {
        transform: none;
        box-shadow: 0px 0 20px 0px rgba(0, 0, 0, 0.15);
    }
    .bookmark-link:active .bookmark-image-overlay {
        opacity: 1;
    }

</style>
