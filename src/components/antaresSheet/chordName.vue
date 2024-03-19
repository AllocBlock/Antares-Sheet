<template>
  <chord-name>
    <chord-main>{{main}}</chord-main>
    <chord-decoration>{{decoration}}</chord-decoration>
  </chord-name>
</template>

<script>
import { Chord } from "@/utils/chord";

export default {
  name: "SheetChordName",
  props: {
    chord: {
      type: Chord,
      required: true,
    },
  },
  computed: {
    main() {
      return this.chord.root.toString() + this.chord.quality;
    },
    decoration() {
      return this.chord.extension
    },
  },
};
</script>

<style scoped>
chord-name {
  display: inline-flex;
  align-items: flex-end;
}
chord-main {
  white-space: nowrap;
}

chord-decoration {
  font-size: 0.8em;
}
</style>