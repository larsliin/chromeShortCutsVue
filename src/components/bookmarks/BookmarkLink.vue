<template>
    <span class="bookmark relative inline-block"
        :class="{ 'foldout-open': isFoldoutOpen }">
        <v-tooltip
            :disabled="!bookmarksStore.bookmarkTooltip"
            class="tooltip"
            location="bottom center" origin="auto"
            open-delay="500"
            transition="none">
            <template v-slot:activator="{ props }">
                <a
                    v-bind="props"
                    class="bookmark-link"
                    :tabindex="tabIndex"
                    :class="[link ? '' : 'folder', size]"
                    draggable="true"
                    :href="link"
                    :id="id"
                    :aria-label="title">
                    <BookmarkIcon
                        :hide="!ready"
                        :folder="!link"
                        :image="image" />
                    <span class="bookmark-title-container">{{ title }}</span>
                </a>
            </template>
            <span v-html="title"></span>
        </v-tooltip>
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
            .bookmark-edit {
                visibility: visible;
            }
        }
    }

    .bookmark:hover .bookmark-link:not(.folder) .bookmark-image-container {
        transform: perspective(400px) rotateY(10deg) scale(1.05);
        box-shadow: 0 0 25px 0px rgba(0, 0, 0, 0.15);
    }

    .bookmark .bookmark-link:active:not(.folder) .bookmark-image-container {
        transform: perspective(400px) rotateY(-10deg) scale(0.95);
        box-shadow: 0 0 25px 0px rgba(0, 0, 0, 0.15);
    }

    .bookmark.dragging .bookmark-link .bookmark-image-container {
        transform: none;
        box-shadow: 0px 0 20px 0px rgba(0, 0, 0, 0.15);
    }
    .bookmark-link:active .bookmark-image-overlay {
        opacity: 1;
    }

</style>
<style lang="scss">
    .tooltip .v-overlay__content {
        transform: translateY(-35px);
    }
</style>
