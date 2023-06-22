<template>
  <div class="placeholder flex_hv_center" ref="placeholder" :style="`font-size: ${fontSize}px`">
    <ChordName v-if="isChordName" :chord-name="text" />
    <div v-else>{{text}}</div>
  </div>
</template>

<script>
import ChordName from '@/components/antaresSheet/chordName.vue';
import ChordManager from "@/utils/chordManager.js";

export default {
  name: "ChordPlaceholder",
  components: { ChordName },
  data() {
    return {
      fontSize: 12
    }
  },
  computed: {
    isChordName() {
      return ChordManager.isChord(this.text)
    }
  },
  props: {
    text: {
      type: String,
      default: "未知和弦"
    }
  },
  mounted() {
    this.updateFontSize()
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