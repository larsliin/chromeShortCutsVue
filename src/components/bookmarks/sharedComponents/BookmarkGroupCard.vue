<template>
    <span class="bookmark relative inline-block"
        :class="[effectiveSize, { 'foldout-open': isFoldoutOpen, popup: props.popup }]">
        <span class="handle">
            <button
                v-if="!props.popup"
                class="bookmark-link group-link"
                type="button"
                :aria-label="groupAriaLabel"
                @click="onOpenGroup($event)">
                <span
                    class="group-grid"
                    :class="{ dark: bookmarksStore.enableDarkMode }">
                    <span
                        v-for="item in previewItems"
                        :key="item.id"
                        class="group-grid-item">
                        <BookmarkIcon
                            :color="item.color ?? undefined"
                            :folder="false"
                            :image="imageMap[item.id] ?? null" />
                    </span>
                </span>
            </button>
            <span
                v-else
                class="bookmark-link group-link"
                :aria-label="groupAriaLabel">
                <span
                    class="group-grid"
                    :class="{ dark: bookmarksStore.enableDarkMode }">
                    <span
                        v-for="item in previewItems"
                        :key="item.id"
                        class="group-grid-item">
                        <a
                            class="group-grid-link"
                            :href="item.url || undefined"
                            :aria-label="item.title"
                            @click="onOpenBookmark(item, $event)">
                            <BookmarkIcon
                                :color="item.color ?? undefined"
                                :folder="false"
                                :image="imageMap[item.id] ?? null" />
                        </a>
                    </span>
                </span>
            </span>
        </span>
        <div class="bookmark-edit">
            <BookmarkFoldout
                :darkModeBorder="true"
                :list="list"
                :size="'x-small'"
                @toggle="onToggle($event)"
                @delete="onUngroup()" />
        </div>
    </span>
</template>

<script setup lang="ts">
    import { mdiUngroup } from '@mdi/js';
    import { computed, ref, watch } from 'vue';
    import { EMITS } from '@/constants';
    import type { BookmarkNode, FoldoutListItem } from '@/types/bookmark';
    import { useBookmarksStore } from '@stores/bookmarks';
    import BookmarkFoldout from '@/components/fields/BookmarkFoldout.vue';
    import BookmarkIcon from '@/components/bookmarks/sharedComponents/BookmarkIcon.vue';
    import { getGroupPreviewItems } from '@utils/bookmarkGroups';

    interface Props {
        bookmark: BookmarkNode;
        popup?: boolean;
    }

    interface GroupOpenPayload {
        groupId: string;
        rect?: DOMRect;
    }

    const props = defineProps<Props>();

    const emits = defineEmits<{
        open: [payload: GroupOpenPayload];
    }>();

    const bookmarksStore = useBookmarksStore();

    const isFoldoutOpen = ref(false);
    const effectiveSize = computed(() => `icon-${bookmarksStore.iconSize}`);

    const list = ref<FoldoutListItem[]>([
        {
            title: 'Ungroup',
            icon: mdiUngroup,
            event: EMITS.DELETE,
        },
    ]);

    const previewItems = computed(() => getGroupPreviewItems(props.bookmark));

    const imageMap = ref<Record<string, string>>({});

    const groupAriaLabel = computed(() => `Open group with ${previewItems.value.length} bookmarks`);

    function onToggle(event: boolean): void {
        isFoldoutOpen.value = event;
    }

    function onOpenGroup(event: MouseEvent): void {
        const target = event.currentTarget as HTMLElement | null;

        emits('open', {
            groupId: props.bookmark.id,
            rect: target?.getBoundingClientRect(),
        });
    }

    function onOpenBookmark(item: BookmarkNode, event: MouseEvent): void {
        if (!item.url) {
            event.preventDefault();
            return;
        }

        event.preventDefault();

        if (!bookmarksStore.statistics) {
            bookmarksStore.statistics = [];
        }

        const bookmarkStats = (bookmarksStore.statistics ?? [])
            .find((entry) => entry.url === item.url);

        const bookmarkStatsIndex = (bookmarksStore.statistics ?? [])
            .findIndex((entry) => Object.values(entry.id).includes(item.id));

        const index = bookmarkStatsIndex === -1
            ? bookmarksStore.statistics.length
            : bookmarkStatsIndex;

        const clicks = bookmarkStats?.clicks !== undefined
            ? parseInt(String(bookmarkStats.clicks), 10) + 1
            : 1;

        const idArr = bookmarkStats
            ? [...new Set([...Object.values(bookmarkStats.id), item.id])]
            : [item.id];

        bookmarksStore.statistics[index] = {
            clicks,
            id: idArr,
            title: item.title,
            timestamp: Date.now(),
            url: item.url,
        };

        const sorted = bookmarksStore.statistics.sort((a, b) => {
            if (b.clicks !== a.clicks) {
                return b.clicks - a.clicks;
            }

            return b.timestamp - a.timestamp;
        });

        bookmarksStore.setSyncStorage({ statistics: sorted });

        if (event.ctrlKey || event.metaKey) {
            window.open(item.url, '_blank');
            return;
        }

        window.location.href = item.url;
    }

    async function onUngroup(): Promise<void> {
        await bookmarksStore.ungroupBookmarkGroup(props.bookmark.id);
    }

    async function loadGroupImages(): Promise<void> {
        const imageEntries = await Promise.all(previewItems.value.map(async (item) => {
            const stored = await bookmarksStore.getLocalStorage(item.id);
            const image = (stored as { image?: string } | undefined)?.image;
            return [item.id, image ?? ''] as const;
        }));

        imageMap.value = Object.fromEntries(imageEntries.filter((entry) => !!entry[1]));
    }

    watch(
        () => props.bookmark.children,
        () => {
            loadGroupImages();
        },
        { immediate: true },
    );
</script>

<style scoped lang="scss">
    .bookmark {
        display: inline-block;
        margin: 0 0 8px;
        position: relative;

        &.popup {
            display: block;
            height: 100%;
            margin: 0;
            width: 100%;
        }
    }

    .bookmark-link {
        align-items: center;
        color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
        display: flex;
        flex-direction: column;
        margin-top: 34px;
        outline-color: #01a1f6;
        outline-offset: 14px;
        text-decoration: none;
        width: 100%;
    }

    .group-link {
        border: 0;
        background: transparent;
        cursor: pointer;
        margin-top: 34px;
        padding: 0;
    }

    .group-grid {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 11.11%;
        background-color: var(--blue-lighter);
        box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.15);
        transform-origin: center right;
        transition: transform 0.05s, box-shadow 0.05s;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-template-rows: repeat(3, minmax(0, 1fr));
        gap: 3%;
        padding: 8.89%;

        &.dark {
            background-color: var(--darkmode-200);
            box-shadow: none;
        }
    }

    .group-grid-item {
        width: 100%;
        aspect-ratio: 1;
        display: flex;
        align-items: stretch;
        justify-content: stretch;

        .group-grid-link {
            display: flex;
            width: 100%;
            height: 100%;
            text-decoration: none;
        }

        :deep(.bookmark-image-container) {
            height: 100%;
            width: 100%;
            padding: 7%;
            border-radius: 17%;
        }
    }

    .bookmark.icon-small {
        width: 56px;

        .group-grid {
            padding: 2%;
            border-radius: 5.36%;
            gap: 3%;
        }
    }

    .bookmark.icon-medium {
        width: 82px;

        .group-grid {
            padding: 7.32%;
        }
    }

    .bookmark.icon-large {
        width: 108px;

        .group-grid {
            padding: 7.41%;
            border-radius: 12.96%;
        }
    }

    .bookmark-edit {
        visibility: hidden;
        position: absolute;
        right: 0;
        top: 0;
        opacity: .5;
    }

    .bookmark.popup {
        width: 100%;
        max-width: none;

        .handle {
            display: block;
            height: 100%;
            width: 100%;
        }

        .bookmark-edit {
            display: none;
        }

        .group-link {
            display: block;
            height: 100%;
            margin-top: 0;
            width: 100%;
        }

        .group-grid-link {
            cursor: pointer;

            &:hover :deep(.bookmark-image-container) {
                transform: perspective(400px) rotateY(25deg) scale(1.02);
                box-shadow: 0 0 25px 0 rgba(0, 0, 0, 0.15);
            }

            &:active :deep(.bookmark-image-container) {
                transform: perspective(400px) rotateY(-15deg) scale(.98);
                box-shadow: 0 0 25px 0 rgba(0, 0, 0, 0.15);
                transform-origin: center right;
            }
        }

        .group-grid {
            height: 100%;
            border-radius: var(--popup-group-radius, 14%);
            box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
            transition: border-radius 0.28s cubic-bezier(0.2, 0.85, 0.2, 1);
        }

        .group-grid-item {
            :deep(.bookmark-image-container) {
                padding: 8%;
            }
        }

        &.icon-small,
        &.icon-medium,
        &.icon-large {
            width: 100%;
            max-width: none;
        }
    }

    .bookmark {
        &:not(.popup):hover .group-link .group-grid {
            transform: perspective(400px) rotateY(25deg) scale(1.02);
            box-shadow: 0 0 25px 0 rgba(0, 0, 0, 0.15);
        }

        &:not(.popup) .group-link:active .group-grid {
            transform: perspective(400px) rotateY(-15deg) scale(.98);
            box-shadow: 0 0 25px 0 rgba(0, 0, 0, 0.15);
            transform-origin: center right;
        }

        &:hover,
        &.foldout-open {
            z-index: 1;

            .bookmark-edit {
                visibility: visible;
            }
        }
    }
</style>
