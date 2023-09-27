<template>
    <span class="bookmark relative inline-block"
        v-if="ready">
        <a
            class="bookmark-link"
            :tabindex="tabIndex"
            :class="{ 'folder': !link }"
            draggable="true"
            :href="link"
            :id="id"
            :aria-label="title">
            <BookmarkIcon
                :folder="!link"
                :image="image" />
            <span class="bookmark-title-container">{{ title }}</span>
        </a>
        <button class="bookmark-edit"
            @click="emit(EMITS.EDIT, id)">
            <!-- https://pictogrammers.com/library/mdi/ -->
            <v-icon size="small" icon="mdi-dots-horizontal"></v-icon>
        </button>
    </span>
</template>

<script setup>
    import {
        ref, onMounted, watch,
    } from 'vue';
    import BookmarkIcon from '@/components/bookmarks/BookmarkIcon.vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { EMITS } from '@/constants';
    import useEventsBus from '@cmp/eventBus';

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
    });

    const image = ref();
    const ready = ref(false);

    const bookmarksStore = useBookmarksStore();

    async function updateImage() {
        const getImageResponse = await bookmarksStore.get_localStorage(props.id);

        if (getImageResponse) {
            image.value = getImageResponse.image;
        }

        ready.value = true;
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
        margin: 10px;
    }

    .bookmark-title-container {
        display: inline-block;
        line-height: 1.15;
        margin: 15px 0 0;
        max-width: 100%;
        overflow: hidden;
        padding-bottom: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .bookmark-link {
        align-items: center;
        color: rgba(var(--v-theme-on-surface),var(--v-high-emphasis-opacity));
        display: flex;
        flex-direction: column;
        margin-top: 25px;
        outline-color: #01a1f6;
        outline-offset: 14px;
        text-decoration: none;
        width: 90px;
    }

    .bookmark-edit {
        color: #aaa;
        cursor: pointer;
        display: none;
        font-size: 18px;
        padding: 5px 10px;
        position: absolute;
        right: 0px;
        top: 0;
    }

    .bookmark-edit:hover {
        color: #000;
    }

    .bookmark:hover .bookmark-edit {
        display: block;
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
