<template>
  <div class="folder">
    <div class="folder-inner">
      <Bookmark
        v-for="bookmark in 4"
        @edit="onEditClick()"
        :id="123"
        :title="'Google Drive'"
        :link="'https://drive.google.com/drive/my-drive'" />
    </div>
  </div>
</template>

<script setup>
import Bookmark from './Bookmark.vue';

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
        width: 100%;
        padding: 0 40px;
    }
}
</style>
