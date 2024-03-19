<template>
  <!-- TODO: 配置项的元素 -->
  <span class="note">
    <TabStum v-if="isStum()" :note="note" :tab-config="tabConfig" />
    <template v-else-if="isFretVisible()">
      <span class="note_element" v-for="(fret, fretIndex) in note.frets" :key="fret">
        <template v-if="fret == '-'">
          <span class="note_fret_stem" v-if="hasMiddleStem(fretIndex, note.frets)" type="normal" />
          <span class="note_fret_empty" v-else />
        </template>
        <template v-else>
          <span class="note_fret">{{ fret }}</span>
        </template>
      </span>
    </template>
    <span class="note_stem" :type="note.getStemType()" />
    <span class="note_flag">
      <span class="note_flag_connect" v-for="flagType in flags" :key="flagType" :type="flagType" />
    </span>
  </span>
</template>

<script setup lang="ts">
import { Ref, inject } from 'vue';
import TabStum from './stum.vue'
import { TabConfig, TabSingleNote } from './tabParser';

const tabConfig = inject<Ref<TabConfig>>("tabConfig")

const props = defineProps({
  note: {
    type: TabSingleNote,
    required: true,
  },
  flags: { // TODO: 这样安排是否合理？connect传入flags列表，还是base获取前后flag信息生成列表?
    type: Array<string>,
    default: function () {
      return []
    }
  },
})

function isStum() {
  return props.note.config.arpeggio || props.note.config.strum;
}

function isFretVisible() {
  if (!isStum()) return true;

  if (props.note.config.showStumFret != undefined)
    return props.note.config.showStumFret
  if (tabConfig.value.showStumFret != undefined)
    return tabConfig.value.showStumFret

  return true;
}

function hasMiddleStem(fretIndex, frets) {
  let globalHasMiddleStem = true;
  let isBeforeAllEmpty =
    frets.slice(0, fretIndex).filter((fret) => fret != "-") == 0;
  return globalHasMiddleStem && !isBeforeAllEmpty;
}
</script>

<style scoped>
.note {
  position: relative;
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

.note_element {
  position: relative;
  width: 100%;
  height: 0;
  flex-shrink: 1;

  display: flex;
  justify-content: center;
  align-items: center;
}

.note_element>* {
  position: absolute;
}

.note_fret {
  display: flex;
  justify-content: center;
  align-items: center;

  font-size: var(--fret-font-size);
  width: fit-content;
  padding: 0 2px;
  height: 3px;
  background-color: var(--background-color);
  ;
}

.note_fret_empty {
  width: 12px;
}

.note_fret_stem {
  position: relative;
  height: calc(1 / (var(--string-num) - 1) * var(--row-height));
  width: 12px;
}

.note_fret_stem:after {
  position: absolute;
  content: "";
  top: 0;
  left: calc(50% - 1px);
  height: 100%;
  width: 2px;
  background-color: var(--foreground-color);
  ;
  border-radius: 2px;
}

.note_fret_stem[type="end"]:after {
  height: calc(50% + var(--stem-margin));
}

.note_stem {
  position: absolute;
  background-color: var(--foreground-color);
  ;
  width: 2px;
  border-radius: 2px;
}

.note_stem[type="complete"] {
  height: 42px;
  bottom: calc(-1 * var(--stem-margin));
}

.note_stem[type="half"] {
  height: 20px;
  width: 2px;
  bottom: calc(-1 * var(--stem-margin));
}

.note_stem,
.note_stem[type="none"] {}

.note_flag {
  position: absolute;
  width: 100%;
  bottom: calc(-1 * var(--stem-margin));
  height: calc(var(--stem-margin) - 5px);
  padding-top: 5px;

  display: flex;
  flex-direction: column-reverse;
}

.note_flag_connect {
  height: 4px;
  margin-top: 5px;
  background-color: var(--foreground-color);
}

.note_flag_connect,
.note_flag_connect[type="none"] {
  width: 0;
}

.note_flag_connect[type="left"] {
  width: 50%;
  align-self: flex-start;
}

.note_flag_connect[type="right"] {
  width: 50%;
  align-self: flex-end;
}

.note_flag_connect[type="both"] {
  width: 100%;
  align-self: center;
}
</style>