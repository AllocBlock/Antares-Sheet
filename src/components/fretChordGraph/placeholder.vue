<template>
  <div class="placeholder flex_hv_center" ref="placeholder" :style="`font-size: ${fontSize}px`">
    <ChordName v-if="isChord" :chord="chordOrMsg" />
    <div v-else>{{chordOrMsg}}</div>
  </div>
</template>

<script>
import ChordName from '@/components/antaresSheet/chordName.vue';
import { Chord } from '@/utils/chord';
import FretChordManager from "@/utils/fretChordManager";

export default {
  name: "FretChordGraphPlaceholder",
  components: { ChordName },
  data() {
    return {
      fontSize: 12
    }
  },
  computed: {
    isChordName() {
      return FretChordManager.isChord(this.text)
    }
  },
  props: {
    chordOrMsg: {
      type: [String, Chord],
      default: "未知和弦"
    }
  },
  mounted() {
    this.updateFontSize()
  },
  computed: {
    isChord() {
      return this.chordOrMsg instanceof Chord
    }
  },
  methods: {
    updateFontSize() {
      let e = this.$refs['placeholder']
      let MinEdge = Math.min(e.clientWidth, e.clientHeight)
      this.fontSize = MinEdge * 0.4
    }
  }
}
</script>

<style scoped src="@/common.css"></style>

<style scoped>
.placeholder{
  width: 100%;
  height: 100%;
	font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  word-break: break-all;
	color: rgba(var(--theme-color-rgb), 0.5);
}
</style>