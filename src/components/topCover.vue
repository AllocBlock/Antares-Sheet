<template>
  <transition name="trans_fade_out">
    <div id="cover" v-show="show">
      <slot></slot>
    </div>
  </transition>
</template>

<script setup>
const props = defineProps({
    show: {
      type: Boolean,
      default: false,
    },
})
</script>

<style scoped>
#cover {
  position: fixed;
  width: 100%;
  height: 100%;
  background-color: var(--background-color);
  color: var(--theme-color);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 50px;
  letter-spacing: 5px;
  z-index: 20;
  margin-right: auto;
}

.trans_fade_out-enter-from, 
.trans_fade_out-leave-to{
	opacity: 0;
}
.trans_fade_out-enter-active{
	transition: opacity 0.1s;
}
.trans_fade_out-leave-active{
	transition: opacity 1s;
}
</style>
