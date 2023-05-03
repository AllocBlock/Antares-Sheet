<template>
  <div id="metronome">
    <div class="flex-center">节拍器</div>
    <div id="control" @click="togglePlay">{{ this.started ? "❚❚" : "▶" }}</div>
    <div id="bpm_block">
      <div
        id="bpm_decrease"
        @click="decreaseBpm()"
        @mousedown="onLongPressStart(decreaseBpm)"
      >
        -
      </div>
      <input type="text" id="bpm_input" v-model="bpm" @change="updateBpm"/>
      <div 
        id="bpm_increase"
        @click="increaseBpm()"
        @mousedown="onLongPressStart(increaseBpm)"
      >
        +
      </div>
    </div>
  </div>
</template>

<script>
import { assert } from '@/utils/assert.js';
import Metronome from "./metronome.js";

export default {
  name: "Metronome",
  data() {
    return {
      metronome: null,
      started: false,
      bpm: 120,
      longPressTimer: null,
      longPressing: false,
    };
  },
  mounted() {
  },
  methods: {
    load(callbacks) {
      this.metronome = new Metronome(callbacks)
      this.updateBpm()
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
    },
    getBpm() {
      return this.bpm;
    },
    setBpm(bpm) {
      bpm = Math.max(30, Math.min(240, bpm))
      this.metronome.bpm = bpm;
      this.bpm = bpm;
    },
    updateBpm() {
      let bpm = parseInt(this.bpm) ?? 60;
      this.setBpm(bpm);
    },
    decreaseBpm() {
      let bpm = (parseInt(this.bpm) ?? 60) - 1;
      this.setBpm(bpm);
    },
    increaseBpm() {
      let bpm = (parseInt(this.bpm) ?? 60) + 1;
      this.setBpm(bpm);
    },
    onLongPressStart(callback) {
      let that = this;
      function longPress() {
        if (that.longPressing) {
          callback();
          that.longPressTimer = setTimeout(longPress, 50);
        }
      }

      this.longPressing = true;
      this.longPressTimer = setTimeout(() => {
        longPress();
      }, 500);

      let endPress = () => {
        this.onLongPressEnd()
        document.removeEventListener("mouseup", endPress)
      }

      document.addEventListener("mouseup", endPress)
    },
    onLongPressEnd() {
      clearTimeout(this.longPressTimer);
      this.longPressing = false;
    },
  },
};
</script>

<style scoped>
#metronome {
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
  border: 2px black solid;
  font-size: 20px;

  z-index: 10;
}

#control {
  height: 30px;
  width: 30px;
  margin: 5px 0;
  border-radius: 50%;
  border: 4px black solid;

  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

#bpm_block {
  display: flex;
  justify-content: space-around;
}
#bpm_decrease,
#bpm_increase {
  height: 20px;
  width: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
#bpm_input {
  outline-style: none;
  border: 0px;
  border-bottom: 1px black solid;
  background-color: transparent;
  width: 50px;
  text-align: center;
}
</style>
