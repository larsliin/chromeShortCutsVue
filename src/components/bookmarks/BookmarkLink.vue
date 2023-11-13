<template>
    <span class="bookmark relative inline-block"
        :class="{ 'foldout-open': isFoldoutOpen }">
        <a
            v-bind="props"
            class="bookmark-link"
            :tabindex="tabIndex"
            :class="[link ? '' : 'folder', size]"
            draggable="true"
            :href="link"
            :id="id"
            title=""
            :aria-label="title">
            <BookmarkIcon
                :hide="!ready"
                :folder="!link"
                :image="image" />
            <span class="bookmark-title-container">{{ title }}</span>
        </a>
        <div class="tooltip">{{ title }}</div>
        <div class="bookmark-edit">
            <BookmarkFoldout
                :darkModeBorder="true"
                :size="'x-small'"
                :list="list"
                :show="mouseEnter"
                @toggle="onToggle($event)"
                @delete="onDelete()"
                @edit="emit(EMITS.EDIT, id)" />
        </div>
    </span>
    <Teleport to="body">
        <template>
            <v-row justify="center">
                <v-dialog
                    v-model="showConfirmDelete"
                    persistent
                    width="450">
                    <BookmarkConfirmDelete
                        :title="title"
                        :id="id"
                        :bookmark="deleteConfirmBookmark"
                        @cancel="showConfirmDelete = false"
                        @confirm="onDeleteConfirm($event)" />
                </v-dialog>
            </v-row>
        </template>
    </Teleport>
</template>

<script setup>
    import { ref, onMounted, watch } from 'vue';
    import BookmarkIcon from '@/components/bookmarks/BookmarkIcon.vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { EMITS } from '@/constants';
    import useEventsBus from '@cmp/eventBus';
    import BookmarkFoldout
        from '@/components/bookmarks/BookmarkFoldout.vue';
    import BookmarkConfirmDelete
        from '@/components/forms/BookmarkConfirmDelete.vue';

    const { emit, bus } = useEventsBus();

    const props = defineProps({
        tabIndex: {
            type: String,
            default: '-1',
        },
        id: {
            type: [String, Number],
            required: true,
        },
        title: String,
        link: String,
        size: String,
    });

    const isFoldoutOpen = ref(false);
    const image = ref();
    const ready = ref(false);
    const list = ref([
        {
            title: 'Edit',
            icon: 'mdi-rename',
            event: EMITS.EDIT,
        },
        {
            title: 'Delete',
            icon: 'mdi-delete-outline',
            event: EMITS.DELETE,
        },
    ]);

    const bookmarksStore = useBookmarksStore();

    async function updateImage() {
        const getImageResponse = await bookmarksStore.get_localStorage(props.id);

        if (getImageResponse) {
            image.value = getImageResponse.image;
        }

        ready.value = true;
    }

    const showConfirmDelete = ref(false);

    function onDelete() {
        showConfirmDelete.value = true;
    }

    function onDeleteConfirm() {
        showConfirmDelete.value = false;

        bookmarksStore.remove_bookmark(props.id);
    }

    function onToggle(event) {
        isFoldoutOpen.value = event;
    }

    watch(() => bus.value.get(EMITS.IMAGES_IMPORT), () => {
        updateImage();
    });

    watch(() => bus.value.get(EMITS.ICON_UPDATE), (id) => {
        if (id[0] === props.id) {
            updateImage();
        }
    });

    onMounted(async () => {
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

        &.small {
            width: 75px;

            .bookmark-image-container {
                width: 75px;
                padding: 6px;
            }

            .bookmark-title-container {
                font-size: 11px;
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
        right: -6px;
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
                transition-delay: 1s;
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
            max-width: 400px;
        }
    }

    .bookmark:hover .bookmark-link:not(.folder) .bookmark-image-container {
        transform: perspective(400px) rotateY(25deg) scale(1.02);
        box-shadow: 0 0 25px 0px rgba(0, 0, 0, 0.15);
    }

    .bookmark .bookmark-link:active:not(.folder) .bookmark-image-container {
        transform: perspective(400px) rotateY(-25deg) scale(1);
        box-shadow: 0 0 25px 0px rgba(0, 0, 0, 0.15);
        transform-origin: center left;
    }

    .bookmark.dragging .bookmark-link .bookmark-image-container {
        transform: none;
        box-shadow: 0px 0 20px 0px rgba(0, 0, 0, 0.15);
    }
    .bookmark-link:active .bookmark-image-overlay {
        opacity: 1;
    }

</style>
