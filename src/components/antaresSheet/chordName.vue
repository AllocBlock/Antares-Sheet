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
    key() {
      return ChordManager.splitChordDecoration(this.chordName)[0];
    },
    suffix() {
      return ChordManager.splitChordDecoration(this.chordName)[1]
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

}

chord-suffix {
  font-size: 0.8em;
}
</style>