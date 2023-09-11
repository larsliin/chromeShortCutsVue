<template>
    <div class="folder">
        <div class="folder-inner">
            <BookmarkLink
                v-for="bookmark in bookmarks"
                @edit="onEditClick()"
                :id="bookmark.id"
                :title="bookmark.title"
                :link="bookmark.url" />
        </div>
    </div>
</template>

<script setup>
    import BookmarkLink from '@/components/bookmarks/BookmarkLink.vue';

    const props = defineProps({
        bookmarks: [Object, Array],
    });

    function onEditClick(){
        alert('EDIT')
    }
</script>

<style scoped lang="scss">
    .folder {
        align-content: center;
        display: inline-flex;
        flex: 0 0 100%;
        justify-content: center;
        max-height: calc(100vh - 200px);
        overflow-y: auto;

        &-inner {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            max-width: 1024px;
            padding: 0 40px;
            width: 100%;
        }
    }
</style>
