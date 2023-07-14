<template>
  <span class="repeat" :class="repeatClass">
    <svg viewBox="0 0 10 46.52">
      <rect y="-0.07" width="2.51" height="46.58" />
      <rect x="5" width="0.93" height="46.52" />
      <circle cx="8.24" cy="13.98" r="1.31" />
      <circle cx="8.24" cy="32.67" r="1.31" />
    </svg>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  type: {
    type: String,
    required: true,
  }
})

const repeatClass = computed<string>(() => {
  if (props.type == "start") {
    return "repeat_start"
  } else if (props.type == "end") {
    return "repeat_end"
  } else {
    throw "unknown repeat type " + props.type
  }
})
</script>

<style scoped>
.repeat {
  height: 100%;
}
.repeat_start {
  margin-right: 10px;
}
.repeat_end {
  transform: scaleX(-1);
  margin-left: 10px;
}

svg {
  height: 100%;
}
</style>