<template>
    <div class="folders-outer">
        <div class="folders-container"
            :class="{ 'no-transition': bookmarksStore.transitionDisabled }">
            <div
                class="expansion-panels-toggle"
                v-if="bookmarksStore.accordionModel">
                <v-btn
                    class="expansion-panels-toggle-btn mb-2"
                    :icon="mdiUnfoldLessHorizontal"
                    :disabled="bookmarksStore.isAccordionEmpty || !bookmarksStore.hasBookmarks"
                    @click="onUnfoldAllClick()" />
                <v-btn
                    class="expansion-panels-toggle-btn"
                    :icon="mdiUnfoldMoreHorizontal"
                    :disabled="bookmarksStore.isAccordionFull || !bookmarksStore.hasBookmarks"
                    @click="onFoldAllClick()" />
            </div>
            <v-expansion-panels
                class="expansion-panels"
                v-if="bookmarksStore.accordionModel && bookmarksStore.bookmarks"
                ref="expansionPanels"
                v-model="bookmarksStore.accordionModel"
                multiple
                @update:modelValue="onUpdate()">
                <draggable
                    :animation="200"
                    :fallbackTolerance="10"
                    :force-fallback="true"
                    :ghost-class="'ghost'"
                    :handle="'button'"
                    :item-key="'id'"
                    :list="bookmarksStore.bookmarks"
                    :scroll-sensitivity="100"
                    :tag="'div'"
                    @start="onDragStart($event)"
                    @end="onDragEnd($event)">
                    <template #item="{ element }">
                        <v-expansion-panel
                            :id="element.id"
                            eager>
                            <BookmarksAccordionTitle
                                @beforeDelete="onBeforeDelete"
                                :bookmark="element" />
                            <v-expansion-panel-text>
                                <BookmarksGroup
                                    :folder="element"
                                    :bookmarks="element.children" />
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </template>
                </draggable>
            </v-expansion-panels>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { EMITS } from '@/constants';
    import { mdiUnfoldLessHorizontal, mdiUnfoldMoreHorizontal } from '@mdi/js';
    import {
        onMounted, onUnmounted, ref, nextTick,
    } from 'vue';
    import type { DragEventInfo } from '@/types/bookmark';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { useAccordionSync } from '@cmp/useAccordionSync';
    import BookmarksAccordionTitle
        from '@/components/bookmarks/accordion/BookmarksAccordionTitle.vue';
    import BookmarksGroup from '@/components/bookmarks/sharedComponents/BookmarksGroup.vue';
    import draggable from 'vuedraggable';
    import emitter from '@cmp/eventBus';

    const utils = useAccordionSync();

    const bookmarksStore = useBookmarksStore();

    const expansionPanels = ref();

    // store in local synced-storage the open accordion items
    // because sorting may have changed, we use the item
    // index instead of the accordion model
    async function onUpdate() {
        await nextTick();

        const panelsSelector = expansionPanels.value.$el.querySelectorAll('.v-expansion-panel');
        const arr2: number[] = [];

        panelsSelector.forEach((element: Element, i: number) => {
            const isOpen = element.classList.contains('v-expansion-panel--active');

            if (isOpen) {
                arr2.push(i);
            }
        });

        bookmarksStore.setSyncStorage({ accordion: arr2 });
    }

    function onDragStart(_event?: unknown): void {
        emitter.emit(EMITS.DRAG_START);
    }

    async function onDragEnd(event: DragEventInfo): Promise<void> {
        const bookmark = (bookmarksStore.bookmarks ?? [])[event.newIndex];

        const index = event.newIndex > event.oldIndex ? event.newIndex + 1 : event.newIndex;

        await nextTick();

        // update bookmarks order
        bookmarksStore.reorderBookmark(bookmark.id, index);

        // update active panels array
        const panelsSelector = expansionPanels.value.$el.querySelectorAll('.v-expansion-panel');

        const arr: number[] = [];
        panelsSelector.forEach((element: Element, i: number) => {
            const isOpen = element.classList.contains('v-expansion-panel--active');

            if (isOpen) {
                arr.push(i);
            }
        });
        bookmarksStore.setSyncStorage({ accordion: arr });

        const panelsCollection = expansionPanels.value
            .$el.getElementsByClassName('v-expansion-panel');

        panelsCollection.forEach((elem: Element, i: number) => {
            elem.classList.remove('v-expansion-panel--active');
            elem.classList.remove('v-expansion-panel--before-active');
            elem.classList.remove('v-expansion-panel--after-active');

            if (!arr.includes(i) && arr.includes(i + 1)) {
                elem.classList.add('v-expansion-panel--before-active');
            }
            if (arr.includes(i)) {
                elem.classList.add('v-expansion-panel--active');
            }
            if (!arr.includes(i) && arr.includes(i - 1)) {
                elem.classList.add('v-expansion-panel--after-active');
            }
        });
    }

    function onUnfoldAllClick() {
        bookmarksStore.accordionModel = [];

        bookmarksStore.setSyncStorage({ accordion: [] });
    }

    function onFoldAllClick() {
        const panelsSelector = expansionPanels.value.$el.querySelectorAll('.v-expansion-panel');
        const arr = [...Array(panelsSelector.length).keys()];

        bookmarksStore.accordionModel = Array.from(arr);

        bookmarksStore.setSyncStorage({ accordion: [...bookmarksStore.accordionModel] });
    }

    function onBeforeDelete() {
        bookmarksStore.transitionDisabled = true;
    }

    function onBookmarksImportHandler(): void {
        utils.updateAccordionModel(0);
    }

    let tmpPanelsModel: number[] | null = null;

    function onFilterUpdatedHandler(filterValue: string): void {
        if (filterValue !== '') {
            if (!tmpPanelsModel) {
                tmpPanelsModel = Array.from(bookmarksStore.accordionModel ?? []);
                bookmarksStore.accordionModel = Array
                    .from({ length: bookmarksStore.bookmarks?.length ?? 0 }, (_v, index) => index);
            }
        } else if (tmpPanelsModel) {
            bookmarksStore.accordionModel = Array.from(tmpPanelsModel);
            tmpPanelsModel = null;
        }
    }

    onUnmounted(() => {
        emitter.off(EMITS.BOOKMARKS_IMPORT, onBookmarksImportHandler);
        emitter.off(EMITS.FILTER_UPDATED, onFilterUpdatedHandler);
    });

    onMounted(async () => {
        emitter.on(EMITS.BOOKMARKS_IMPORT, onBookmarksImportHandler);
        emitter.on(EMITS.FILTER_UPDATED, onFilterUpdatedHandler);

        const accordionResponse = await bookmarksStore.getSyncStorage('accordion');

        if (accordionResponse) {
            bookmarksStore.accordionModel = Array.from(accordionResponse as number[]);
        } else {
            bookmarksStore.accordionModel = [];
        }
    });
</script>

<style scoped lang="scss">
    .folders-outer {
        display: flex;
        height: 100vh;
        justify-content: center;
    }

    .folders-container {
        align-items: flex-start;
        display: flex;
        flex-direction: column;
        height: 100%;
        max-width: 1024px;
        padding: 100px 20px;
        width: 100%;
    }

    .expansion-panels-toggle {
        bottom: 30px;
        position: fixed;
        right: 20px;
        z-index: 9;

        &-btn {
            display: block;
        }
    }

    .expansion-panels {
        padding-bottom: 30px;

        > div {
            width: 100%;
        }
    }

    :deep(.v-expansion-panel-text__wrapper) {
        padding: 16px;
    }

    .v-expansion-panels > div{
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        list-style-type: none;
        padding: 0;
        width: 100%;
        position: relative;
        z-index: 1;
    }

    .v-expansion-panels--variant-popout > div > .v-expansion-panel {
        max-width: calc(100% - 32px);
    }

    .v-expansion-panels--variant-popout > div > .v-expansion-panel--active {
        max-width: calc(100% + 16px);
    }

    .v-expansion-panels:not(
        .v-expansion-panels--variant-accordion
    ) > div > :not(:first-child):not(:last-child):not(
        .v-expansion-panel--active
    ):not(.v-expansion-panel--after-active) {
        border-top-left-radius: 0 !important;
        border-top-right-radius: 0 !important;
    }

    .v-expansion-panels:not(
        .v-expansion-panels--variant-accordion
    ) > div > :not(:first-child):not(:last-child):not(
        .v-expansion-panel--active
    ):not(.v-expansion-panel--before-active) {
        border-bottom-left-radius: 0 !important;
        border-bottom-right-radius: 0 !important;
    }
    .v-expansion-panels--variant-inset > .v-expansion-panel {
        max-width: 100%;
    }

    .v-expansion-panels:not(
        .v-expansion-panels--variant-accordion
    ) > div > :first-child:not(:last-child):not(
        .v-expansion-panel--active
    ):not(.v-expansion-panel--before-active) {
        border-bottom-left-radius: 0 !important;
        border-bottom-right-radius: 0 !important;
    }

    .v-expansion-panels:not(
        .v-expansion-panels--variant-accordion
    ) > div > :last-child:not(:first-child):not(
        .v-expansion-panel--active
    ):not(.v-expansion-panel--after-active) {
        border-top-left-radius: 0 !important;
        border-top-right-radius: 0 !important;
    }

    .no-transition {
        .v-expansion-panel,
        .v-expansion-panel-text {
            transition: none !important;
        }
        :deep(.v-expansion-panel-title) {
            transition: none !important;
        }
    }

</style>
