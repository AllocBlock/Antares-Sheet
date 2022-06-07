<template>
  <div class="tool_chord" :env="getEnv()">
    <div class="title">和弦工具</div>
    <div class="list">
      <div v-if="chords.length == 0">暂未添加任何和弦</div>
      <Chord
        v-else
        v-for="chord in chords"
        :key="chord.name"
        class="prefab_chord drag attached_chord"
        :chord="chord"
        @mousedown="dragStart($event, chord)"
        @touchstart="dragStart($event, chord)"
      />
    </div>
  </div>
</template>

<script>
import Chord from "@/components/chord/index.vue";
import { getEnv } from "@/utils/common.js";

export default {
  name: "SheetEditorToolChord",
  components: {
    Chord,
  },
  data() {
    return {};
  },
  props: {
    chords: {
      type: Array,
      required: true,
    },
  },
  methods: {
    getEnv,
    dragStart(e, chord) {
      this.$emit("dragStart", e, chord)
    }
  }
};
</script>

<style scoped src="./common.css"></style>

<style scoped>
.tool_chord {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
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