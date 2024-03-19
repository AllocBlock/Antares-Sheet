<template>
  <span class="bar">
    <span class="bar_number" v-if="isBarNumberVisible()">
      {{ bar.number }}
    </span>
    <span class="bar_split" v-if="hasSplitLine()" />
    <TabRepeat v-if="hasRepeat('start')" type="start" />
    <TabTimeSignature v-if="hasTimeSignature()" :num="getTimeSignatureNum()" :divide="getTimeSignatureDivide()" />
    <span class="notes">
      <TabNote v-for="(note, i) in bar.notes" :key="i" :note="note" />
    </span>
    <TabRepeat v-if="hasRepeat('end')" type="end" />
  </span>
</template>

<script setup lang="ts">
import TabNote from "./note.vue"
import TabTimeSignature from "./timeSignature.vue"
import TabRepeat from "./repeat.vue"
import { TabBar, TabConfig } from "./tabParser";
import { Ref, inject } from "vue";

const tabConfig = inject<Ref<TabConfig>>("tabConfig")

const props = defineProps({
  bar: {
    type: TabBar,
    required: true,
  },
  isFirstBar: {
    type: Boolean,
    required: true,
  },
})

function isBarNumberVisible() {
  if (props.bar.config.showBarNumber != undefined)
    return props.bar.config.showBarNumber
  if (tabConfig.value.showBarNumber != undefined)
    return tabConfig.value.showBarNumber
  return false;
}

function hasSplitLine() {
  return !props.isFirstBar
}

function hasTimeSignature() {
  return !!props.bar.config.timeSignature;
}

function getTimeSignatureNum() {
  return props.bar.config.timeSignature[0]
}

function getTimeSignatureDivide() {
  return props.bar.config.timeSignature[1]
}

function hasRepeat(type) {
  return props.bar.config.repeat == type;
}
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
  width: var(--bar-split-width);
  height: 100%;
  margin: 5px;
  background-color: var(--foreground-color);
}

.bar_split[type="start"] {
  margin-right: 10px;
}

.bar_split[type="end"] {
  margin-left: 10px;
}

.notes {
  height: 100%;
  width: 100%;

  display: flex;
  justify-content: space-around;
}
</style>