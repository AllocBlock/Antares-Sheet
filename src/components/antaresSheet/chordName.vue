<template>
  <chord-name>
    <chord-key>{{key}}</chord-key>
    <chord-suffix>{{suffix}}</chord-suffix>
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
    splitKeySuffix() {
      if (ChordManager.isChord(this.chordName)) return ChordManager.splitChordDecoration(this.chordName)
      else return [this.chordName, ""]
    },
    key() {
      return this.splitKeySuffix[0];
    },
    suffix() {
      return this.splitKeySuffix[1]
    },
  },
};
</script>

<style scoped>
chord-name {
  display: inline-flex;
  align-items: flex-end;
}
chord-key {
  white-space: nowrap;
}

chord-suffix {
  font-size: 0.8em;
}
</style>