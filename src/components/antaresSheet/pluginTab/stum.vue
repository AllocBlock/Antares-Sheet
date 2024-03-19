<template>
  <span class="note_stum" :direction="direction" :style="getStumStyle()">
    <TabSymbol class="note_stum_arrow flex_hv_center" :svg-name="svgArrowName" />
    <TabSymbol class="note_stum_head flex_hv_center" :svg-name="svgHeadName" />
    <TabSymbol class="note_stum_body flex_hv_center" :svg-name="svgBodyName" v-for="i in (range.end - range.start)"
      :key="i" />
    <TabSymbol class="note_stum_tail flex_hv_center" :svg-name="svgTailName" />
  </span>
</template>

<script setup lang="ts">
import { inject, Ref, ref } from 'vue';
import TabSymbol from './symbol.vue'
import { TabConfig, TabSingleNote } from './tabParser';

const tabConfig = inject<Ref<TabConfig>>("tabConfig")

const svgArrowName = ref("")
const svgHeadName = ref("")
const svgBodyName = ref("")
const svgTailName = ref("")
const range = ref({ start: 0, end: 0, })
const direction = ref("up")

const props = defineProps({
  note: {
    type: TabSingleNote,
    required: true,
  },
})


function mapStumDirection(configDirection) {
  switch (configDirection) {
    case "u":
      return "up";
    case "d":
      return "down";
    default:
      throw "不支持的扫弦方向";
  }
}

function getRange() {
  let frets = props.note.frets;
  let stumStartIndex = -1;
  for (let i = 0; i < frets.length; ++i) {
    if (frets[i] != "-" && i < frets.length - 1) {
      if (stumStartIndex < 0) {
        stumStartIndex = i;
      }
    } else {
      if (stumStartIndex >= 0) {
        let stumEndIndex = (frets[i] != "-" ? i : i - 1)
        return {
          start: stumStartIndex,
          end: stumEndIndex,
        };
      }
    }
  }
}

function getStumStyle() {
  let stringNum = tabConfig.value.getInt("stringNum")
  let stumBodyNum = range.value.end - range.value.start
  return {
    top: `${(range.value.start / (stringNum - 1)) * 100}%`,
    height: `${(stumBodyNum / (stringNum - 1)) * 100}%`,
  };
}

range.value = getRange();
svgArrowName.value = "StumArrow";
if (props.note.config.arpeggio) {
  svgHeadName.value = "ArpeggioHead";
  svgBodyName.value = "ArpeggioBody";
  svgTailName.value = "ArpeggioTail";
  direction.value = mapStumDirection(props.note.config.arpeggio);
} else if (props.note.config.strum) {
  svgHeadName.value = "StrokeHead";
  svgBodyName.value = "StrokeBody";
  svgTailName.value = "StrokeTail";
  direction.value = mapStumDirection(props.note.config.strum);
} else {
  throw "不支持的扫弦类型";
}
</script>

<style scoped>
.note_stum {
  position: absolute;
  width: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.note_stum[direction="up"] {
  transform: scaleY(-1);
}

.note_stum_arrow {
  width: 100%;
  position: absolute;
  top: 0;
  transform: translateY(calc(-85% - 6px));
}

.note_stum_head {
  width: 100%;
  position: absolute;
  top: -6px;
  height: 6px;
}

.note_stum_body {
  width: 100%;
  position: relative;
  top: 0;
  flex-grow: 1;
}

.note_stum_tail {
  width: 100%;
  position: absolute;
  bottom: -10px;
  height: 10px;
}
</style>