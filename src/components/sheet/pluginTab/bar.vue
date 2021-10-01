<template>
  <span class="bar">
    <span v-if="isBarNumberVisible()" class="bar_number">
      {{ bar.number }}
    </span>
    <span v-if="hasSplitLine()" class="bar_split" />
    <TabRepeat v-if="hasRepeat('start')" type="start" />
    <TabTimeSignature v-if="hasTimeSignature()" :time-signature="getTimeSignature()" />
    <span class="notes">
      <TabNote v-for="note in bar.notes" :key="note" :note="note" :globalConfig="globalConfig" />
    </span>
    <TabRepeat v-if="hasRepeat('end')" type="end" />
  </span>
</template>

<script>
import TabNote from "./note"
import TabTimeSignature from "./timeSignature"
import TabRepeat from "./repeat"

export default {
  name: "TabBar",
  components: {
    TabNote, TabTimeSignature, TabRepeat
  },
  props: {
    bar: {
      type: Object,
      required: true,
    },
    isFirstBar: {
      type: Boolean,
      required: true,
    },
    globalConfig: {
      type: Object,
      required: true,
    },
  },
  methods: {
    isBarNumberVisible() {
      let globalConfig = this.globalConfig.getBool("showBarNumber");
      let localConfig = this.bar.config.getBool("showBarNumber");
      return globalConfig && localConfig;
    },
    hasSplitLine() {
      // TODO: 如何拿到上一个组件的数据？
      // let lastBarHasEndRepeat =
      //   bar.number > 1
      //     ? this.tab.bars[bar.number - 2].config.getStr("repeat") == "end"
      //     : false;
      // return bar.number != 1 && lastBarHasEndRepeat;
      return !this.isFirstBar
    },
    hasTimeSignature() {
      return !!this.bar.config.getStr("ts");
    },
    getTimeSignature() {
      return this.bar.config.getStr("ts")
    },
    hasRepeat(type) {
      return this.bar.config.getStr("repeat") == type;
    },
  },
};
</script>

<style scoped>
.bar {
  position: relative;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;

  flex-grow: 1;
}
.bar_number {
  position: absolute;
  bottom: calc(100% + 5px);
  left: 8px;
  font-size: var(--fret-font-size);
  color: #aaa;
}
.bar_split {
  flex-shrink: 0;
  width: var(--bar_split-width);
  height: 100%;
  margin: 5px;
  /* background-color: #fff; */
  background-color: black;
}
.bar_split[type="start"] {
  margin-right: 10px;
}
.bar_split[type="end"] {
  margin-left: 10px;
}

.bar_start_padding {
  margin-right: 10px;
}

.bar_split > .repeat[type="start"] {
  transform: scaleX(-1);
}

.notes {
  height: 100%;
  width: 100%;

  display: flex;
  justify-content: space-around;
}
</style>