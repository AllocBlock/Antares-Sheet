<template>
  <span class="row">
    <span class="background_lines">
      <span class="background_line" v-for="i in tabConfig.stringNum" :key="i" />
    </span>
    <span class="row_split" type="start" v-if="hasStartRowSplit()" />
    <TabClef v-if="hasClef()" />
    <TabBar v-for="bar in bars" :key="bar.number" :bar="bar" :is-first-bar="firstBarNumber == bar.number" />
    <span class="row_split" type="end" v-if="hasEndRowSplit()" />
  </span>
</template>

<script setup lang="ts">
import { inject, Ref } from "vue";
import TabBar from "./bar.vue"
import TabClef from "./clef.vue"
import { TabBar as CTabBar, TabConfig } from "./tabParser";

const tabConfig = inject<Ref<TabConfig>>("tabConfig")

const props = defineProps({
  bars: {
    type: Array<CTabBar>,
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
})

function hasClef() {
  return props.rowNumber == 1
}

function hasStartRowSplit() {
  // 如果本行第一个小节有起始重复符号，且没有谱号和拍号，则本行无需起始分隔线
  let firstBar = props.bars[0] as CTabBar
  return !(firstBar.config.repeat == "start" &&
    !firstBar.config.timeSignature &&
    !hasClef())
}

function hasEndRowSplit() {
  // 如果本行最后一个小节有终止重复符号，则本行无需结束分隔线
  let lastBar = props.bars[props.bars.length - 1] as CTabBar
  return lastBar.config.repeat != "end"
}
</script>

<style scoped>
.row {
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

.row>* {
  z-index: 2;
}

.row>.background_lines {
  z-index: 1;
}

.background_lines {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.background_line {
  position: relative;
  z-index: 0;
  width: 100%;
  height: 0;
}

.background_line:after {
  position: absolute;
  content: "";
  left: 0;
  top: 0;
  width: 100%;
  height: 1px;
  background-color: #aaa;
  transform: translateY(-50%);
}

.row_split {
  flex-shrink: 0;
  width: var(--row-split-width);
  height: 100%;
  background-color: var(--foreground-color);
  ;
}

.row_split[type="start"] {
  margin-right: var(--row-split-width);
}

.row_split[type="end"] {
  margin-left: var(--row-split-width);
}
</style>