<template>
  <div class="tool_chord" :env="getEnv()">
    <div class="title">和弦工具</div>
    <div class="list">
      <div id="no_chord" class="flex_h_center" v-if="chords.length == 0">暂未添加任何和弦</div>
      <FretChordGraph
        v-else
        v-for="chord in chords"
        :key="chord.toString()"
        class="prefab_chord drag"
        :fretChordOrChord="tryFindFretChord(chord)"
        @mousedown="dragStart($event, chord)"
        @touchstart="dragStart($event, chord)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import FretChordGraph from "@/components/fretChordGraph/index.vue"
import { Chord, FretChord } from "@/utils/chord";
import { getEnv } from "@/utils/common.js";
import fretChordManager from "@/utils/fretChordManager";

export default {
  name: "SheetEditorToolChord",
  components: {
    FretChordGraph,
  },
  data() {
    return {};
  },
  props: {
    chords: {
      type: Array<Chord>,
      required: true,
    },
  },
  methods: {
    getEnv,
    dragStart(e, chord) {
      this.$emit("dragStart", e, chord)
    },
    tryFindFretChord(chord : Chord) : FretChord|Chord{
      if (!chord) return undefined;
      let fretChord = fretChordManager.getFretChord(chord)
      if (fretChord) return fretChord;
      return chord;
    },
  }
};
</script>

<style scoped src="./editorCommon.css"></style>

<style scoped>
.tool_chord {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tool {
  width: 100%;
  border-top: 2px white solid;
  border-bottom: 2px white solid;
}

.title {
  margin: 5px 0;
  flex-shrink: 0;

  display: flex;
  justify-content: center;
  align-items: center;
}
.list {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

.prefab_chord::after {
  position: absolute;
  content: "";
  opacity: 0;
  transition: all 0.2s ease-out;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  border-radius: 5px;
  white-space: pre;

  display: flex;
  justify-content: center;
  align-items: center;
}
.prefab_chord:hover::after {
  opacity: 1;
}
.drag::after {
  content: "拖拽";
  background-color: rgba(51, 129, 58, 0.685);
  color: white;
}

#no_chord {
  width: 100%;
  color: rgba(var(--foreground-color-rgb), 0.5)
}
</style>

<style scoped lang="scss">
#container[env="mobile"] {
  .prefab_chord {
    position: relative;
    width: 180px;
    height: 240px;
    margin: 15px;
  }

  input {
    flex-shrink: 0;
    width: 60%;
  }
}</style>