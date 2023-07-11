<template>
  <div id="viewer" :printing="isPrinting" :style="globalCssVar">
    <SheetViewerLoadCover :state="loadState" />

    <div id="tools_sheet_control" class="tools_block" v-if="sheetLayoutConfig.enable">
      <div id="scale_block">
        <div class="tools_text">缩放</div>
        <input id="scale_slider" type="range" step="0.01" min="0.2" max="2.0" v-model.number="sheetLayoutConfig.scale"
          @input="updateScale" />
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

    <div id="tools_player" class="tools_block" v-if="instrumentConfig.enable">
      <transition name="trans_fade_out">
        <div id="load_cover" v-show="showPlayerLoadCover">
          <div>{{ intrumentLoadingText }}</div>
        </div>
      </transition>
      <select id="instrument_combo" v-model="instrumentConfig.instrument.audioSourceName">
        <option value="Oscillator">合成器音源</option>
        <option value="Ukulele">尤克里里音源</option>
      </select>
    </div>

    <DraggablePanel id="metronome_panel" title="节拍器" v-if="metronomeConfig.enable" :initPos="{ left: -240, top: -200 }"
      v-model:isFocused="metronomeConfig.isFocused" v-model:isFolded="metronomeConfig.isFolded">
      <Metronome ref="metronome" />
    </DraggablePanel>

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
        <CapoSelector id="sheet_capo_block" v-model:value="instrumentConfig.capo">变调夹</CapoSelector>
      </div>
      <div id="sheet_by" class="title">{{ sheet.meta.by }}</div>
      <AntaresSheet id="sheet_body_block" :sheet-tree="sheet.root" :events="nodeEvents" />
      <div id="sheet_padding"></div>
    </div>

    <div id="sidebar">
      <div id="sidebar_fixed">
        <div class="sidebar_block" @click="tipChord.enable = !tipChord.enable"
          :class="getSidebarIconClass(tipChord.enable)">
          <img src="/icons/bubble.svg" type="image/svg+xml" />
          <div class="sidebar_block_text">提示和弦</div>
        </div>
        <div class="sidebar_block" @click="instrumentConfig.enable = !instrumentConfig.enable"
          :class="getSidebarIconClass(instrumentConfig.enable)">
          <img src="/icons/player.svg" type="image/svg+xml" />
          <div class="sidebar_block_text">和弦播放</div>
        </div>
        <div class="sidebar_block" @click="metronomeConfig.enable = !metronomeConfig.enable"
          :class="getSidebarIconClass(metronomeConfig.enable)">
          <img src="/icons/player.svg" type="image/svg+xml" />
          <div class="sidebar_block_text">节拍器</div>
        </div>
        <div class="sidebar_block" @click="sheetLayoutConfig.enable = !sheetLayoutConfig.enable"
          :class="getSidebarIconClass(sheetLayoutConfig.enable)">
          <img src="/icons/layout.svg" type="image/svg+xml" />
          <div class="sidebar_block_text">滚动缩放</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, watch } from "vue";
import FretChordManager from "@/utils/fretChordManager";
import { parseSheet } from "@/utils/sheetParser"
import { ELoadState } from "@/utils/common"
import { loadSheetByUrlParam, ESheetSource } from "@/utils/sheetCommon";

import Metronome from "@/components/metronome/index.vue"
import AntaresSheet from "@/components/antaresSheet/index.vue"
import FretChordGraph from "@/components/fretChordGraph/index.vue"
import CapoSelector from "@/components/capoSelector.vue"
import DraggablePanel from "@/components/draggablePanel.vue";
import SheetViewerLoadCover from "./viewerLoadCover.vue";
import { NodeEventList } from "@/utils/elementEvent";

import { 
  useGlobalCss, 
  useIntrument, 
  useSheetLayout, 
  useTipChord, 
  useSheet
} from "./viewerCommon"

const isPrinting = ref(false)
const globalCssVar = useGlobalCss()

// instrument
const { 
  instrumentConfig,
  intrumentLoadingText,
  showPlayerLoadCover,
  loadInstrument,
  playChord 
} = useIntrument()

watch(() => instrumentConfig.instrument.audioSourceName, function () {
  instrumentConfig.instrument.needUpdate = true
  loadInstrument()
})

// metronome
const metronome = ref(null)
const metronomeConfig = reactive({
  enable: true,
  needUpdate: true,
  isFocused: false,
  isFolded: false
})

function loadMetronome() {
  if (metronomeConfig.needUpdate) {
    metronome.value.load()
    metronomeConfig.needUpdate = false;
  }
}

// ui control
const {
  sheetLayoutConfig,
  autoScrollSpeedText,
  updateAutoScrollSpeed
} = useSheetLayout()

function updateScale() {
  let scale = sheetLayoutConfig.scale
  let defaultFontSize = 20
  let defaultTitleFontSize = 32
  let unit = "px"

  document.documentElement.style.setProperty(
      "--base-font-size",
      `${defaultFontSize * scale}${unit}`
  );
  document.documentElement.style.setProperty(
      "--title-base-font-size",
      `${defaultTitleFontSize * scale}${unit}`
  );
}

function getSidebarIconClass(state) {
  return state ? "" : "sidebar_disabled";
}

// tip chord
const {
  tipChord,
  tryFindFretChord
} = useTipChord()

let nodeEventList = new NodeEventList()
nodeEventList.chord.mouseDowns.push((e, node) => playChord(FretChordManager.getFretChord(node.chord)))
nodeEventList.chord.mouseEnters.push((e, node) => {
  tipChord.show = true
  tipChord.chord = node.chord
})
nodeEventList.chord.mouseLeaves.push((e, node) => {
  tipChord.show = false
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
  loadMetronome()
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

  // print event
  window.onbeforeprint = () => {
    isPrinting.value = true
  }
  window.onafterprint = () => {
    isPrinting.value = false
  }
})
</script>

<style src="./common.scss" scoped></style>

<style scoped lang="scss">
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

.tools_block {
  position: fixed;
  padding: 10px;
  display: flex;
  justify-content: space-between;

  z-index: 10;
}

.tools_text {
  margin: 10px 0;
}

#tools_player {
  right: 90px;
  width: 160px;
  top: 40%;
  flex-direction: column;
  user-select: none;

  #load_cover {
    position: absolute;
    z-index: 11;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background-color: rgba(var(--theme-color-rgb), 0.8);

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 30px;
  }
}
</style>

<style scoped lang="scss">
#viewer {
  #sheet {
    width: 100%;
    margin: 0 200px;
  }

  .tools_text {
    width: 100%;
    height: 20px;
    text-align: center;
    line-height: 20px;
    font-size: 20px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  #tools_sheet_control {
    top: 25%;
    left: 10px;
    width: 160px;
    color: var(--foreground-color);
  }

  #scale_block,
  #auto_scroll_block {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  #scale_slider,
  #auto_scroll_slider {
    flex-grow: 1;
    margin: 10px 0;
    height: 300px;
    -webkit-appearance: slider-vertical;
  }

  .sidebar_disabled {
    opacity: 0.3;
  }
}
</style>

<style scoped lang="scss">
/* printing */
#viewer[printing=true] {
  #sheet {
    width: 100%;
    margin: 0px;
  }

  #sidebar,
  #tools_sheet_control,
  #tools_player,
  #tip_chord,
  #sheet_padding,
  #metronome_panel,
  #sheet_key_shift {
    display: none;
  }
}
</style>