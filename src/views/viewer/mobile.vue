<template>
  <div id="main" :style="globalCssVar">
    <SheetViewerLoadCover :state="this.load.state" />

    <div id="tools_sheet_control" v-if="tools.sheetControl.enable">
      <div id="scale_block">
        <div class="tools_text">缩放</div>
        <input
          id="scale_slider"
          type="range"
          step="0.01"
          min="0.2"
          max="2.0"
          v-model="tools.sheetControl.scale"
          @input="changeScale()"
        />
        <div id="scale_text" class="tools_text">{{parseFloat(tools.sheetControl.scale).toFixed(1)}}</div>
      </div>
      <div id="auto_scroll_block">
        <div class="tools_text">自动滚动</div>
        <input
          id="auto_scroll_slider"
          type="range"
          step="0.1"
          min="0"
          max="10"
          v-model="tools.sheetControl.autoScrollSpeed"
          @input="onAutoScrollSpeedChange()"
        />
        <div id="auto_scroll_text" class="tools_text">{{autoScrollSpeedText}}</div>
      </div>
    </div>

    <!-- <Chord id="tip_chord" v-if="tools.tipChord.enable" :style="`opacity: ${tools.tipChord.show ? 1 : 0}`" :chord="tools.tipChord.chord" /> -->

    <div id="sheet">
      <div id="song_title" class="title">{{sheetInfo.meta.title}}</div>
      <div id="song_singer" class="title">{{sheetInfo.meta.singer}}</div>
      <div id="sheet_key_block">
        <div id="sheet_original_key" class="title">{{`原调 ${sheetInfo.meta.originalKey}`}}</div>
        <div id="sheet_current_key" class="title">
          {{`选调 ${sheetInfo.meta.sheetKey}`}}
          <div id="sheet_key_shift">
            <div id="sheet_key_shift_up" @click="shiftKey(1)">▲</div>
            <div id="sheet_key_shift_down" @click="shiftKey(-1)">▼</div>
          </div>
        </div>
        <div id="sheet_capo_block">
          <div class="title">变调夹 {{ capoName }}</div>
        </div>
      </div>
      <div id="sheet_by" class="title">{{sheetInfo.meta.by}}</div>
      <AntaresSheet id="sheet_body_block" :sheet-tree="sheetInfo.root" :events="sheetEvents"/>
      <div id="sheet_padding"></div>
    </div>
    
  </div>
</template>

<script type="module">
import { StringInstrument } from "@/utils/instrument.js";
import ChordManager from "@/utils/chordManager.js";
import { ENodeType, EPluginType, traverseNode } from "@/utils/sheetNode"
import { parseSheet } from "@/utils/sheetParser"
import { ELoadState } from "@/utils/common.js"
import { SheetInfoRuntimeView } from "@/utils/sheetInfo";
import { loadSheetFromUrlParam, ESheetSource } from "@/utils/sheetCommon";
import AutoScroll from "./autoScroll.js"

import AntaresSheet from "@/components/antaresSheet/index.vue"
import Chord from "@/components/chord/index.vue"
import Request from "@/utils/request.js"
import SheetViewerLoadCover from "./loadCover.vue";

let gPlayer = null

export default {
  name: "SheetViewerMobile",
  components: {
    AntaresSheet,
    Chord,
    SheetViewerLoadCover
  },
  data() {
    return {
      globalCssVar: {
        "--sheet-font-size": "var(--base-font-size)", 
        "--title-base-font-size": "30px", 
        "--title-scale": "1",
        "--chord-renderer-theme-color": "white", 
        "--chord-renderer-font-color": "black", 
        "--sheet-theme-color": "var(--theme-color)", 
        "--page-size": "100%", 
      },
      load: {
        state: ELoadState.Loading,
      },
      sheetInfo: new SheetInfoRuntimeView(),
      sheetEvents: {
        text: {
          click: (e, node) => {
            console.log("text", node)
          }
        },
        chord: {
          click: (e, node) => {
            this.playChord(ChordManager.getChord(node.chord))
          },
        },
        mark: {
          click: (e, node) => {
            console.log("mark", node)
          },
        }
      },
      tools: {
        player: {
          enable: true,
          instrument: {
            type: "Ukulele",
            audioSource: "Oscillator",
            update: true,
            capo: 0,
          },
          loadState: ELoadState.Loading,
        },
        sheetControl: {
          enable: true,
          scale: 1,
          autoScrollSpeed: 0.0
        }
      }
    }
  },
  computed: {
    showPlayerLoadCover() {
      return this.tools.player.loadState != ELoadState.Loaded;
    },
    autoScrollSpeedText() {
      let speed = parseFloat(this.tools.sheetControl.autoScrollSpeed)
      return speed > 0.0 ? `x${parseFloat(speed).toFixed(1)}` : "停止"
    },
    capoName() {
      let capo = this.tools.player.instrument.capo
      if (capo == 0) return "无"
      else return `${capo}品`
    }
  },
  mounted() {
    // init global var
    this.loadPlayer()

    // setup
    this.changeScale()

    loadSheetFromUrlParam().then(res => {
      let [sheetSource, sheetData, pid] = res
      if (sheetSource == ESheetSource.UNKNOWN) {
        this.load.state = ELoadState.Empty
        return
      }

      let [meta, root] = parseSheet(sheetData)
      if (!root) {
        throw "曲谱解析失败！"
      }
      this.sheetInfo = new SheetInfoRuntimeView(meta, root)
      this.load.state = ELoadState.Loaded
      console.log(this.sheetInfo)
    }).catch((e) => {
      this.load.state = ELoadState.Failed
      console.error("曲谱获取失败：", e)
    })
  },
  methods: {
    changeScale() {
      let scale = parseFloat(this.tools.sheetControl.scale);
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
    },
    onAutoScrollSpeedChange() {
      let speed = parseFloat(this.tools.sheetControl.autoScrollSpeed)
      AutoScroll.setSpeed(speed)
    },
    playChord(chord) {
      const capo = parseInt(this.tools.player.instrument.capo) ?? 0

      const bpm = 120;
      let volume = 1.0;

      // play chord
      let duration = (1 / bpm) * 60 * 4;
      if (gPlayer && gPlayer.audioSource.loaded) {
        gPlayer.setCapo(capo);
        gPlayer.playChord(chord, volume, duration);
      }
    },
    shiftKey(offset) {
      let curKey = this.sheetInfo.meta.sheetKey;
      let newKey = ChordManager.shiftKey(curKey, offset);
      this.sheetInfo.meta.sheetKey = newKey

      traverseNode(this.sheetInfo.root, (node) => {
        if (node.type == ENodeType.Chord || node.type == ENodeType.ChordPure) {
          node.chord = ChordManager.shiftKey(node.chord, offset)
        } else if (node.type == ENodeType.Plugin && node.pluginType == EPluginType.Tab) {
          node.valid = (this.sheetInfo.originalSheetKey == this.sheetInfo.meta.sheetKey);
        }
      })
    },
    loadPlayer() {
      let that = this
      
      if (this.tools.player.instrument.update) {
        let callbacks = {
          onLoadStart: function() {
            that.tools.player.loadState = ELoadState.Loading
          },
          onLoaded: function() {
            that.tools.player.loadState = ELoadState.Loaded
          },
          onFailed: function() {
            that.tools.player.loadState = ELoadState.Failed
          }
        }
        
        gPlayer = new StringInstrument(this.tools.player.instrument.type, this.tools.player.instrument.audioSource, callbacks)
        
        this.tools.player.instrument.update = false;
      }
    }
  },
}
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
    background-color: rgba(var(--foreground-color), 0.7);
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
  #scale_block, #auto_scroll_block {
    display: flex;
    overflow: hidden;
  }
  #scale_slider, #auto_scroll_slider {
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
</style>
