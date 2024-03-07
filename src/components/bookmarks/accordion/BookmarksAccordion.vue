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
                    :disabled="bookmarksStore.accordionModel.length === 0
                        || !bookmarksStore.bookmarks.length"
                    @click="onUnfoldAllClick()"></v-btn>
                <v-btn
                    class="expansion-panels-toggle-btn"
                    :icon="mdiUnfoldMoreHorizontal"
                    :disabled="bookmarksStore.accordionModel.length
                        === bookmarksStore.bookmarks.length
                        || !bookmarksStore.bookmarks.length"
                    @click="onFoldAllClick()"></v-btn>
            </div>
            <v-expansion-panels
                class="expansion-panels"
                v-if="bookmarksStore.accordionModel && bookmarksStore.bookmarks"
                ref="expansionPanels"
                v-model="bookmarksStore.accordionModel"
                multiple
                @update:modelValue="onUpdate($event)">
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
                                    :bookmarks="element.children"/>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </template>
                </draggable>
            </v-expansion-panels>
        </div>
    </div>
</template>

<script setup>
    import { EMITS } from '@/constants';
    import { mdiUnfoldLessHorizontal, mdiUnfoldMoreHorizontal } from '@mdi/js';
    import {
        onMounted, ref, nextTick, watch,
    } from 'vue';
    import { useBookmarksStore } from '@stores/bookmarks';
    import { useUtils } from '@/shared/utils/utils';
    import BookmarksAccordionTitle
        from '@/components/bookmarks/accordion/BookmarksAccordionTitle.vue';
    import BookmarksGroup from '@/components/bookmarks/sharedComponents/BookmarksGroup.vue';
    import draggable from 'vuedraggable';
    import useEventsBus from '@cmp/eventBus';

    const utils = useUtils();

    const { bus, emit } = useEventsBus();

    const bookmarksStore = useBookmarksStore();

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
        bookmarksStore.accordionModel = [];

        bookmarksStore.set_syncStorage({ accordion: [] });
    }

    function onFoldAllClick() {
        const panelsSelector = expansionPanels.value.$el.querySelectorAll('.v-expansion-panel');
        const arr = [...Array(panelsSelector.length).keys()];

        bookmarksStore.accordionModel = Array.from(arr);

        bookmarksStore.set_syncStorage({ accordion: [...bookmarksStore.accordionModel] });
    }

    function onBeforeDelete() {
        bookmarksStore.transitionDisabled = true;
    }

    watch(() => bus.value.get(EMITS.BOOKMARKS_IMPORT), () => {
        utils.updateAccordionModel([0]);
    });

    let tmpPanelsModel;

    watch(() => bus.value.get(EMITS.FILTER_UPDATED), (newVal, oldVal) => {
        if ((oldVal && !oldVal[0]) || newVal[0] !== '') {
            if (!tmpPanelsModel) {
                tmpPanelsModel = Array.from(bookmarksStore.accordionModel);
                bookmarksStore.accordionModel = Array
                    .from({ length: bookmarksStore.bookmarks.length }, (_, index) => index);
            }
        } else if (tmpPanelsModel) {
            bookmarksStore.accordionModel = Array.from(tmpPanelsModel);
            tmpPanelsModel = null;
        }
    });

    onMounted(async () => {
        const accordionResponse = await bookmarksStore.get_syncStorage('accordion');

        if (accordionResponse) {
            bookmarksStore.accordionModel = Array.from(accordionResponse);
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
