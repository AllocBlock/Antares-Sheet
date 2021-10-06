<template>
  <bar>
    <bar-number v-if="isBarNumberVisible()">
      {{ bar.number }}
    </bar-number>
    <bar-split v-if="hasSplitLine()" />
    <TabRepeat v-if="hasRepeat('start')" type="start" />
    <TabTimeSignature v-if="hasTimeSignature()" :time-signature="getTimeSignature()" />
    <notes>
      <TabNote 
        v-for="note in bar.notes" 
        :key="note" 
        :note="note" 
        :global-config="globalConfig"
      />
    </notes>
    <TabRepeat v-if="hasRepeat('end')" type="end" />
  </bar>
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
bar {
  position: relative;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;

  flex-grow: 1;
}
bar-number {
  position: absolute;
  bottom: calc(100% + 5px);
  left: 8px;
  font-size: var(--fret-font-size);
  color: #aaa;
}
bar-split {
  flex-shrink: 0;
  width: var(--bar-split-width);
  height: 100%;
  margin: 5px;
  /* background-color: #fff; */
  background-color: black;
}
bar-split[type="start"] {
  margin-right: 10px;
}
bar-split[type="end"] {
  margin-left: 10px;
}

/* bar-start-padding {
  margin-right: 10px;
} */

notes {
  height: 100%;
  width: 100%;

  display: flex;
  justify-content: space-around;
}
</style>