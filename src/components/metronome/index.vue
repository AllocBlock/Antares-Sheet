<template>
  <div id="metronome">
    <div class="flex_hv_center">节拍器</div>
    <div id="control" @click="togglePlay">{{ this.started ? "❚❚" : "▶" }}</div>
  </div>
</template>

<script>
import { assert } from '@/utils/assert';
import Metronome from "./metronome";

export default {
  name: "Metronome",
  props: {
    bpm: {
      type: Number,
      default: 120,
    }
  },
  data() {
    return {
      metronome: null,
      started: false,
      longPressTimer: null,
      longPressing: false,
    };
  },
  mounted() {
  },
  methods: {
    load(callbacks) {
      this.metronome = new Metronome(callbacks)
    },
    togglePlay() {
      assert(this.metronome, "Call load before play")
      if (!this.started && !this.metronome.isReady()) {
        alert("节拍器加载未完成，请稍后");
        return;
      }
      this.started = !this.started;
      if (this.started) {
        this.metronome.start();
      } else {
        this.metronome.stop();
      }
    }
  },
  watch: {
    bpm() {
      this.metronome.bpm = this.bpm
    }
  }
};
</script>

<style scoped>
#metronome {
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
  border: 2px var(--foreground-color) solid;
  font-size: 20px;

  z-index: 10;
}

#control {
  height: 30px;
  width: 30px;
  margin: 5px 0;
  border-radius: 50%;
  border: 4px var(--foreground-color) solid;

  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

</style>
