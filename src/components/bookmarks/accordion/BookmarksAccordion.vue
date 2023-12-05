<template>
    <div class="folders-outer">
        <div class="folders-container">
            <div
                class="expansion-panels-toggle"
                v-if="panelsModel">
                <v-btn
                    class="expansion-panels-toggle-btn mb-2"
                    size="small"
                    :icon="mdiUnfoldLessHorizontal"
                    :disabled="panelsModel.length === 0"
                    @click="onUnfoldAllClick()"></v-btn>
                <v-btn
                    class="expansion-panels-toggle-btn"
                    size="small"
                    :icon="mdiUnfoldMoreHorizontal"
                    :disabled="panelsModel.length === bookmarksStore.bookmarks.length"
                    @click="onFoldAllClick()"></v-btn>
            </div>
            <v-expansion-panels
                class="expansion-panels"
                v-if="panelsModel && bookmarksStore.bookmarks"
                ref="expansionPanels"
                v-model="panelsModel"
                variant="popout"
                multiple
                @update:modelValue="onUpdate($event)">
                <draggable
                    :fallbackTolerance="10"
                    :animation="200"
                    :force-fallback="true"
                    :ghost-class="'ghost'"
                    :handle="'button'"
                    :item-key="'id'"
                    :list="bookmarksStore.bookmarks"
                    :scroll-sensitivity="100"
                    :tag="'div'"
                    @start="onDragStart($event)"
                    @end="onDragEnd($event)">
                    <template #item="{element}">
                        <v-expansion-panel
                            eager>
                            <BookmarksAccordionTitle
                                @delete="onFolderDelete($event)"
                                :bookmark="element" />
                            <v-expansion-panel-text>
                                <BookmarksGroup
                                    :id="element.id"
                                    :bookmarks="element.children" />
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </template>
                </draggable>
            </v-expansion-panels>
        </div>
    </div>
</template>

<script setup>
    import { mdiUnfoldLessHorizontal, mdiUnfoldMoreHorizontal } from '@mdi/js';
    import {
        onMounted, ref, nextTick, watch,
    } from 'vue';
    import BookmarksGroup from '@/components/bookmarks/sharedComponents/BookmarksGroup.vue';
    import BookmarksAccordionTitle
        from '@/components/bookmarks/accordion/BookmarksAccordionTitle.vue';
    import draggable from 'vuedraggable';
    import { useBookmarksStore } from '@stores/bookmarks';
    import useEventsBus from '@cmp/eventBus';
    import { EMITS } from '@/constants';

    const { bus, emit } = useEventsBus();

    const bookmarksStore = useBookmarksStore();

    const panelsModel = ref();
    const expansionPanels = ref();

    // store in local synced-storage the open accordion items
    // because sorting may have changed, we use the item
    // index instead of the accordion model
    async function onUpdate() {
        await nextTick();

        const panelsSelector = expansionPanels.value.$el.querySelectorAll('.v-expansion-panel');
        const arr2 = [];

        panelsSelector.forEach((element, i) => {
            const isOpen = element.classList.contains('v-expansion-panel--active');

            if (isOpen) {
                arr2.push(i);
            }
        });

        bookmarksStore.set_syncStorage({ accordion: arr2 });
    }

    function onDragStart() {
        emit(EMITS.DRAG_START);
    }

    async function onDragEnd(event) {
        const bookmark = bookmarksStore.bookmarks[event.newIndex];

        const index = event.newIndex > event.oldIndex ? event.newIndex + 1 : event.newIndex;

        await nextTick();

        // update bookmarks order
        bookmarksStore.reorder_bookmark(bookmark.id, index);

        // update active panels array
        const panelsSelector = expansionPanels.value.$el.querySelectorAll('.v-expansion-panel');

        const arr = [];
        panelsSelector.forEach((element, i) => {
            const isOpen = element.classList.contains('v-expansion-panel--active');

            if (isOpen) {
                arr.push(i);
            }
        });
        bookmarksStore.set_syncStorage({ accordion: arr });

        // update accordion items classes
        const panelsCollection = expansionPanels.value
            .$el.getElementsByClassName('v-expansion-panel');

        panelsCollection.forEach((elem, i) => {
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
        panelsModel.value = [];

        bookmarksStore.set_syncStorage({ accordion: [] });
    }

    function onFoldAllClick() {
        const panelsSelector = expansionPanels.value.$el.querySelectorAll('.v-expansion-panel');
        const arr = [...Array(panelsSelector.length).keys()];

        panelsModel.value = arr;

        bookmarksStore.set_syncStorage({ accordion: arr });
    }

    function onFolderDelete(event) {
        const index = bookmarksStore.bookmarks.findIndex((e) => e.id === event);

        // remove deleted item from accordion open panels
        if (panelsModel.value.includes(index)) {
            panelsModel.value = panelsModel.value.filter((e) => e !== index);
        }
    }

    watch(() => bus.value.get(EMITS.BOOKMARKS_IMPORT), () => {
        panelsModel.value = [0];
    });

    onMounted(async () => {
        const accordionResponse = await bookmarksStore.get_syncStorage('accordion');

        if (accordionResponse) {
            panelsModel.value = Array.from(accordionResponse);
        } else {
            panelsModel.value = [];
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
        z-index: 9;
        position: fixed;
        right: 20px;
        bottom: 20px;

        &-btn {
            display: block;
        }
    }

    .expansion-panels {
        padding-bottom: 40px;

        > div {
            width: 100%;
        }
    }

    :deep(.v-expansion-panel-text__wrapper) {
        padding-top: 16px;
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

</style>
