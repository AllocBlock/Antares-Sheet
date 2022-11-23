<template>
  <chord-name>
    <chord-main>{{main}}</chord-main>
    <chord-decoration>{{decoration}}</chord-decoration>
  </chord-name>
</template>

<script>
import ChordManager from "@/utils/chordManager.js";

export default {
  name: "SheetChordName",
  props: {
    chordName: {
      type: String,
      required: true,
    },
  },
  computed: {
    splitMainDecoration() {
      if (ChordManager.isChord(this.chordName)) return ChordManager.splitChordDecoration(this.chordName)
      else return [this.chordName, ""]
    },
    main() {
      return this.splitMainDecoration[0];
    },
    decoration() {
      return this.splitMainDecoration[1]
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