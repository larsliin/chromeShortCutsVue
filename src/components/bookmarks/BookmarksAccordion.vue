<template>
    <div class="folders-outer">

        <div class="folders-container d-flex">
            <v-expansion-panels
                class="expansion-panels"
                v-if="panels && bookmarksStore.bookmarks"
                v-model="panels"
                variant="popout"
                multiple
                @update:modelValue="onUpdate($event)">
                <v-expansion-panel
                    v-for="(bookmark, index) in bookmarksStore.bookmarks"
                    :key="bookmark.id"
                    eager>
                    <v-expansion-panel-title>
                        {{ bookmark.title }}
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <BookmarksSlide
                            :slideindex="index"
                            :bookmarks="bookmark.children" />
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>
        </div>
    </div>
</template>

<script setup>
    import { onMounted, ref } from 'vue';
    import BookmarksSlide from '@/components/bookmarks/BookmarksSlide.vue';

    import { useBookmarksStore } from '@stores/bookmarks';

    const bookmarksStore = useBookmarksStore();

    const panels = ref();

    function onUpdate(e) {
        bookmarksStore.set_syncStorage({ accordion: e });
    }

    onMounted(async () => {
        const accordionResponse = await bookmarksStore.get_syncStorage('accordion');

        if (accordionResponse) {
            panels.value = Array.from(accordionResponse);
        } else {
            panels.value = [];
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
        height: 100%;
        max-width: 1024px;
        padding: 100px 40px;
        align-items: flex-start;
    }

    .expansion-panels {
        padding-bottom: 40px;
    }

    :deep(.v-expansion-panel-text__wrapper) {
        padding-top: 16px;
    }

</style>
