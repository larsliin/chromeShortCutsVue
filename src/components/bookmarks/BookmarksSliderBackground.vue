<template>
    <div class="background">
        <template v-for="(item, index) in arr" :key="index">
            <BIconStarFill class="folders-background" :style="{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `scale(${item.scale}) rotate(${item.rotation}deg) translate(-50%, -50%) perspective(400px)`,
            }" />
        </template>
    </div>
</template>

<script setup>
    import { onMounted, ref } from 'vue';
    import { BIconStarFill } from 'bootstrap-icons-vue';

    const arr = ref([]);
    // eslint-disable-next-line no-unused-vars
    const props = defineProps({
    });

    onMounted(() => {
        const length = Math.round(Math.random() * 3) + 3;
        for (let index = 0; index < length; index += 1) {
            const obj = {
                x: Math.round(Math.random() * 100),
                y: Math.round(Math.random() * 100),
                scale: (Math.round(Math.random() * 500) / 100) + 1,
                rotation: Math.round(Math.random() * 360),
            };
            arr.value.push(obj);
        }
        console.log(arr.value);
    });

</script>

<style scoped lang="scss">
    .background {
        background: #f0f0f0;
        background: radial-gradient(circle at 100% 100%, #cfcfcf 0%, #fff 100%);
        height: 100vh;
        position: fixed;
        width: 100vw;
    }

    .folders-background {
        color: var(--yellow);
        display: block;
        filter: blur(2.5px);
        font-size: 60px;
        left: 50%;
        opacity: 1;
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
    }
</style>
