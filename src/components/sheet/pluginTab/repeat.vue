<template>
  <repeat :type="type">
    <svg viewBox="0 0 10 46.52">
      <rect y="-0.07" width="2.51" height="46.58" />
      <rect x="5" width="0.93" height="46.52" />
      <circle cx="8.24" cy="13.98" r="1.31" />
      <circle cx="8.24" cy="32.67" r="1.31" />
    </svg>
  </repeat>
</template>

<script>
export default {
  name: "TabRepeat",
  data() {
    return {
      tapPerBar: 4,
      notePerTap: 4,
    }
  },
  props: {
    type: {
      type: String,
      required: true,
    },
  },
};
</script>

<style scoped>
repeat {
  height: 100%;
}
repeat[type="start"] {
  margin-right: 10px;
}
repeat[type="end"] {
  transform: scaleX(-1);
  margin-left: 10px;
}

repeat {
  height: 100%;
}

svg {
  height: 100%;
}
</style>