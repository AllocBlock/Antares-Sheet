<template>
  <svg class="placeholder" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 16.45">
    <path d="M50,0C30,0,3,9.45,3,14.45c0,1.6,43,2,47,2s47-.4,47-2C97,9.45,70,0,50,0Z" />
  </svg>
</template>

<script>
export default {
  name: "SheetPlaceholder",
};
</script>

<style scoped>
.placeholder {
  width: var(--base-font-size);
  fill: var(--sheet-theme-color);
}
</style>