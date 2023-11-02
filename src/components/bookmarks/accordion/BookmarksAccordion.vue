<template>
    <div class="folders-outer">
        <div class="folders-container">
            <div class="expansion-panels-toggle">
                <v-btn
                    class="expansion-panels-toggle-btn mb-2"
                    size="small"
                    icon="mdi-unfold-less-horizontal"
                    :disabled="panelsModel.length === 0"
                    @click="onUnfoldAllClick()"></v-btn>
                <v-btn
                    class="expansion-panels-toggle-btn"
                    size="small"
                    icon="mdi-unfold-more-horizontal"
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
                    tag="div"
                    item-key="id"
                    ghost-class="ghost"
                    :animation="200"
                    :list="bookmarksStore.bookmarks"
                    @end="onDragEnd($event, element)">
                    <template #item="{element}">
                        <v-expansion-panel
                            eager>
                            <BookmarksAccordionTitle :bookmark="element" />
                            <v-expansion-panel-text>
                                <BookmarksSlide
                                    :slideindex="index"
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
    import {
        onMounted, ref, nextTick,
    } from 'vue';
    import BookmarksSlide from '@/components/bookmarks/slider/BookmarksSlide.vue';
    import BookmarksAccordionTitle
        from '@/components/bookmarks/accordion/BookmarksAccordionTitle.vue';
    import draggable from 'vuedraggable';
    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();

    const panelsModel = ref();
    const expansionPanels = ref();

    function onUpdate(e) {
        bookmarksStore.set_syncStorage({ accordion: e });
    }

    async function onDragEnd(event) {
        const bookmark = bookmarksStore.bookmarks[event.newIndex];

        const index = event.newIndex > event.oldIndex ? event.newIndex + 1 : event.newIndex;

        await nextTick();

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
