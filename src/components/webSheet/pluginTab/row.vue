<template>
  <row>
    <bg-lines>
      <bg-line v-for="i in stringNum" :key="i" />
    </bg-lines>
    <row-split type="start" v-if="hasStartRowSplit()"/>
    <TabClef v-if="hasClef()" />
    <TabBar
      v-for="bar in bars"
      :key="bar"
      :bar="bar"
      :is-first-bar="firstBarNumber == bar.number"
      :global-config="globalConfig"
    />
    <row-split type="end" v-if="hasEndRowSplit()" />
  </row>
</template>

<script>
import TabBar from "./bar.vue"
import TabClef from "./clef.vue"

export default {
  name: "TabRow",
  components: {
    TabBar, TabClef
  },
  data() {
    return {
      stringNum: 4,
    };
  },
  props: {
    bars: {
      type: Array,
      required: true,
    },
    rowNumber: {
      type: Number,
      required: true,
    },
    firstBarNumber: {
      type: Number,
      required: true,
    },
    globalConfig: {
      type: Object,
      required: true,
    },
  },
  created() {
    this.stringNum = this.globalConfig ? this.globalConfig.getInt("stringNum") ?? 4 : 4
  },
  methods: {
    hasClef() {
      return this.rowNumber == 1
    },
    hasStartRowSplit() {
      // 如果本行第一个小节有起始重复符号，且没有谱号和拍号，则本行无需起始分隔线
      let firstBar = this.bars[0]
      return !(firstBar.config.getStr("repeat") == "start" &&
              !firstBar.config.getStr("ts") &&
              !this.hasClef() )
    },
    hasEndRowSplit() {
      // 如果本行最后一个小节有终止重复符号，则本行无需结束分隔线
      return this.bars[this.bars.length - 1].config.getStr("repeat") != "end"
    }
  },
};
</script>

<style scoped>
row {
  position: relative;
  width: 100%;
  height: var(--row-height);
  margin-top: var(--row-margin-top);
  margin-bottom: var(--stem-margin);
  /* 
    background-color: rgb(0, 6, 40); */
  display: flex;
  align-items: center;
}
row > * {
  z-index: 2;
}
row > bg-lines {
  z-index: 1;
}
bg-lines {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
bg-line {
  position: relative;
  z-index: 0;
  width: 100%;
  height: 0;
}
bg-line:after {
  position: absolute;
  content: "";
  left: 0;
  top: 0;
  width: 100%;
  height: 1px;
  background-color: #aaa;
  transform: translateY(-50%);
}
row-split {
  flex-shrink: 0;
  width: var(--row-split-width);
  height: 100%;
  /* background-color: #fff; */
  background-color: black;
}
row-split[type="start"] {
  margin-right: var(--row-split-width);
}
row-split[type="end"] {
  margin-left: var(--row-split-width);
}
</style>