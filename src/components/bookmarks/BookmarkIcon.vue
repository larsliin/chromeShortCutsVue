<template>
  <span class="bookmark-image-container">
    <span class="bookmark-image-overlay" v-if="img"></span>
    <BIconStarFill v-else />
  </span>
</template>

<script setup>
import { BIconStarFill } from 'bootstrap-icons-vue';

  defineProps({
    img: String,
  });
</script>
<style scoped lang="scss">
.bookmark-image-overlay {
    box-shadow: 0 0 20px 10px rgba(0, 0, 0, 0.04) inset;
    height: 100%;
    opacity: 0;
    position: absolute;
    transition: opacity 0.05s;
    width: 100%;
}
.bookmark-image-container {
    align-items: center;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0px 0 20px 0px rgba(0, 0, 0, 0.15);
    color: var(--yellow);
    display: flex;
    font-size: 50px;
    height: 70px;
    justify-content: center;
    overflow: hidden;
    padding: 10px;
    position: relative;
    transform-origin: center right;
    transition: all 0.05s;
    width: 70px;
}

</style>
