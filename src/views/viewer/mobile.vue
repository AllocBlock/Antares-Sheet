<template>
  <div id="main" :style="globalCssVar">
    <SheetViewerLoadCover :state="loadState" />

    <div id="tools_sheet_control" v-if="sheetLayoutConfig.enable">
      <div id="scale_block">
        <div class="tools_text">缩放</div>
        <input id="scale_slider" type="range" step="0.01" min="0.8" max="2.0" v-model.number="sheetLayoutConfig.scale"
          @input="updateScale()" />
        <div id="scale_text" class="tools_text">{{ sheetLayoutConfig.scale.toFixed(1) }}</div>
      </div>
      <div id="auto_scroll_block">
        <div class="tools_text">自动滚动</div>
        <input id="auto_scroll_slider" type="range" step="0.1" min="0" max="5"
          v-model.number="sheetLayoutConfig.autoScrollSpeed" @input="updateAutoScrollSpeed()" />
        <div id="auto_scroll_text" class="tools_text">{{ autoScrollSpeedText }}</div>
      </div>
    </div>

    <FretChordGraph id="tip_chord" v-if="tipChord.enable" :style="`opacity: ${tipChord.show ? 1 : 0}`"
      :fretChordOrChord="tryFindFretChord(tipChord.chord)" />

    <div id="sheet">
      <div id="song_title" class="title">{{ sheet.meta.title }}</div>
      <div id="song_singer" class="title">{{ sheet.meta.singer }}</div>
      <div id="sheet_key_block">
        <div id="sheet_original_key" class="title">{{ `原调 ${sheet.meta.originalKey}` }}</div>
        <div id="sheet_current_key" class="title">
          {{ `选调 ${sheet.meta.sheetKey}` }}
          <div id="sheet_key_shift">
            <div id="sheet_key_shift_up" @click="shiftKey(1)">▲</div>
            <div id="sheet_key_shift_down" @click="shiftKey(-1)">▼</div>
          </div>
        </div>
        <div id="sheet_capo_block">
          <div class="title">变调夹 {{ capoName }}</div>
        </div>
      </div>
      <div id="sheet_by" class="title">{{ sheet.meta.by }}</div>
      <AntaresSheet id="sheet_body_block" :sheet-tree="sheet.root" :events="nodeEvents" />
      <div id="sheet_padding"></div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, watch } from "vue";
import FretChordManager from "@/utils/fretChordManager";
import { parseSheet } from "@/utils/sheetParser"
import { ELoadState } from "@/utils/common"
import { loadSheetByUrlParam, ESheetSource } from "@/utils/sheetCommon";

import AntaresSheet from "@/components/antaresSheet/index.vue"
import FretChordGraph from "@/components/fretChordGraph/index.vue"
import SheetViewerLoadCover from "./viewerLoadCover.vue";
import { NodeEventList } from "@/utils/elementEvent";

import {
  useGlobalCss,
  useIntrument,
  useSheetLayout,
  useTipChord,
  useSheet
} from "./viewerCommon"

const globalCssVar = useGlobalCss()

// instrument
const {
  capoName,
  loadInstrument,
  playChord
} = useIntrument()

// ui control
const {
  sheetLayoutConfig,
  autoScrollSpeedText,
  updateAutoScrollSpeed
} = useSheetLayout()

function updateScale() {
  let scale = sheetLayoutConfig.scale
  let defaultFontSize = 4
  let defaultTitleFontSize = 8
  let unit = "vw"

  document.documentElement.style.setProperty(
    "--base-font-size",
    `${defaultFontSize * scale}${unit}`
  );
  document.documentElement.style.setProperty(
    "--title-base-font-size",
    `${defaultTitleFontSize * scale}${unit}`
  );
}

// tip chord
const {
  tipChord,
  tryFindFretChord
} = useTipChord()

let nodeEventList = new NodeEventList()
nodeEventList.chord.mouseDowns.push((e, node) => {
  playChord(FretChordManager.getFretChord(node.chord))
})
const nodeEvents = reactive(nodeEventList)

// sheet
const {
  loadState,
  sheet,
  shiftKey
} = useSheet()

onMounted(() => {
  loadInstrument()
  updateScale()

  loadSheetByUrlParam().then(res => {
    let [sheetSource, sheetData, pid] = res
    if (sheetSource == ESheetSource.UNKNOWN) {
      loadState.value = ELoadState.Empty
      return
    }

    let [meta, root] = parseSheet(sheetData)
    if (!root) {
      throw "曲谱解析失败！"
    }
    sheet.set(meta, root)
    loadState.value = ELoadState.Loaded
  }).catch((e) => {
    loadState.value = ELoadState.Failed
    console.error("曲谱获取失败：", e)
  })
})
</script>

<style src="./common.scss" scoped></style>

<style scoped lang="scss">
#main {
  width: 100vw;
  overflow: hidden;

  #sheet {
    width: 90%;
    padding: 0 5%;

    #sheet_capo_block {
      font-size: 80%;
    }
  }

  .tools_text {
    width: 200px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 4vw;
  }

  #tools_sheet_control {
    position: fixed;
    z-index: 10;
    bottom: 0;
    height: 10vh;
    left: 0;
    width: 100%;
    background-color: rgba(var(--foreground-color-rgb), 0.7);
    color: var(--background-color);

    padding: 4px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  #tools_sheet_control input {
    flex-shrink: 0;
    width: 60%;
  }

  #scale_block,
  #auto_scroll_block {
    display: flex;
    overflow: hidden;
  }

  #scale_slider,
  #auto_scroll_slider {
    flex-grow: 1;
    margin: 10px 0;
  }

  #scale_block {
    flex-direction: row;
  }

  #auto_scroll_block {
    flex-direction: row;
  }
}

#tip_chord {
  position: fixed;
  right: 80px;
  top: 30px;
  height: 200px;
  width: 150px;
  transition: opacity 0.2s ease-out;
  pointer-events: none;

  z-index: 10;
}
</style>
