<template>
  <span class="bookmark relative inline-block">
    <a :href="link" class="bookmark-link" :aria-label="title" tabindex="-1" draggable="true">
      <BookmarkIcon
        :img="img" />
      <span class="bookmark-title-container">{{ title }} 123</span>
    </a>
    <button class="bookmark-edit" @click="$emit('edit', id)"><BIconThreeDots /></button>
  </span>
</template>

<script setup>
import BookmarkIcon from './BookmarkIcon.vue';
import { BIconThreeDots } from 'bootstrap-icons-vue';

defineProps({
  img: String,
  id: {
    type: [String, Number],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  tabIndex: {
    type: String,
    default: '-1',
  },
});

defineEmits(['edit']);

</script>
<style scoped lang="scss">
  .bookmark {
    padding-top: 15px;
    margin: 0 5px;
    width: 115px;
  }

  .bookmark-title-container {
    max-width: 100%;
    overflow: hidden;
    padding-bottom: 10px;
    padding-top: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.bookmark-link {
  align-items: center;
  display: flex;
  flex-direction: column;
  text-decoration: none;
  padding-top: 10px;
  margin-bottom: 4px;
  outline-color: #01a1f6;
  outline-offset: 3px;
}

.bookmark-edit {
    color: #aaa;
    cursor: pointer;
    display: none;
    font-size: 18px;
    position: absolute;
    right: 20px;
    top: 0px;
}

.bookmark-edit:hover {
    color: #000;
}

.bookmark:hover .bookmark-edit {
    display: block;
}

.bookmark:hover .bookmark-image-container {
    transform: perspective(400px) rotateY(10deg) scale(1.05);
    box-shadow: 0 0 25px 0px rgba(0, 0, 0, 0.15);
}

.bookmark .bookmark-link:active .bookmark-image-container {
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
