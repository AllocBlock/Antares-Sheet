<template>
  <span class="time_signature">
    <div>{{ num }}</div>
    <div>{{ divide }}</div>
  </span>
</template>

<script setup lang="ts">
const props = defineProps({
  num: {
    type: Number,
    required: true,
  },
  divide: {
    type: Number,
    required: true,
  },
})
</script>

<style scoped>
.time_signature {
  font-family: MusicNotation, Arial, Helvetica, sans-serif;
  margin: 0 8px;
  width: 30px;
  height: 80%;

  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
}

.time_signature div {
  display: flex;
  justify-content: center;
  align-items: center;

  width: 100%;
  height: 0;
  flex-shrink: 1;
  font-size: 30px;
}
</style>