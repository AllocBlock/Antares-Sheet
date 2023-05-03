<template>
  <div id="viewer" :env="env" :style="globalCssVar">
    <SheetViewerLoadCover :state="this.load.state" />

    <div id="tools_sheet_control" class="tools_block" v-if="tools.sheetControl.enable">
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

    <Chord id="tip_chord" v-if="env == 'pc' && tools.tipChord.enable" :style="`opacity: ${tools.tipChord.show ? 1 : 0}`" :chord="tools.tipChord.chord" />

    <div id="tools_player" class="tools_block" v-if="tools.player.enable">
      <transition name="trans_fade_out">
        <div id="load_cover" v-show="showPlayerLoadCover">
          <div>{{ toolsPlayerLoadingText }}</div>
        </div>
      </transition>
      <select id="instrument_combo" v-model="tools.player.instrument.audioSource">
        <option value="Oscillator">合成器音源</option>
        <option value="Ukulele">尤克里里音源</option>
      </select>
    </div>

    <DraggablePanel id="metronome_panel" title="节拍器" v-if="tools.metronome.enable" 
      :initPos="{left: -240, top: -200}"
      v-model:isFocused="tools.metronome.isFocused"
      v-model:isFolded="tools.metronome.isFolded"
    >
      <Metronome ref="metronome"/>
    </DraggablePanel>
    
    <div id="sheet">
      <div id="song_title" class="title">{{sheetInfo.title}}</div>
      <div id="song_singer" class="title">{{sheetInfo.singer}}</div>
      <div id="sheet_key_block">
        <div id="sheet_original_key" class="title">{{`原调 ${sheetInfo.originalKey}`}}</div>
        <div id="sheet_current_key" class="title">
          {{`选调 ${sheetInfo.sheetKey}`}}
          <div id="sheet_key_shift">
            <div id="sheet_key_shift_up" @click="shiftKey(1)">▲</div>
            <div id="sheet_key_shift_down" @click="shiftKey(-1)">▼</div>
          </div>
        </div>
        <div id="sheet_capo_block">
          <div class="title">变调夹 {{ capoName }}</div>
        </div>
      </div>
      <div id="sheet_by" class="title">{{sheetInfo.by}}</div>
      <AntaresSheet id="sheet_body_block" :sheet-tree="sheetInfo.sheetTree" :events="sheetEvents"/>
      <div id="sheet_padding"></div>
    </div>
    
    <div id="sidebar" v-if="env == 'pc'">
      <div id="sidebar_fixed">
        <div class="sidebar_block" @click="tools.tipChord.enable = !tools.tipChord.enable" :class="getSidebarStateClass(tools.tipChord.enable)">
          <img src="/icons/bubble.svg" type="image/svg+xml" />
          <div class="sidebar_block_text">提示和弦</div>
        </div>
        <div class="sidebar_block" @click="tools.player.enable = !tools.player.enable" :class="getSidebarStateClass(tools.player.enable)">
          <img src="/icons/player.svg" type="image/svg+xml" />
          <div class="sidebar_block_text">和弦播放</div>
        </div>
        <div class="sidebar_block" @click="tools.metronome.enable = !tools.metronome.enable" :class="getSidebarStateClass(tools.metronome.enable)">
          <img src="/icons/player.svg" type="image/svg+xml" />
          <div class="sidebar_block_text">节拍器</div>
        </div>
        <div class="sidebar_block" @click="tools.sheetControl.enable = !tools.sheetControl.enable" :class="getSidebarStateClass(tools.sheetControl.enable)">
          <img src="/icons/layout.svg" type="image/svg+xml" />
          <div class="sidebar_block_text">滚动缩放</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script type="module">
import { getQueryVariable, getEnv } from "@/utils/common.js";
import { StringInstrument } from "@/utils/instrument.js";
import ChordManager from "@/utils/chordManager.js";
import { SheetNode, ENodeType, EPluginType, traverseNode } from "@/utils/sheetNode.js"
import { parseSheet } from "@/utils/sheetParser.js"
import { ELoadState } from "@/utils/common.js"
import AutoScroll from "./autoScroll.js"
import SheetInfo from "./sheetInfo.ts"

import Metronome from "@/components/metronome/index.vue"
import AntaresSheet from "@/components/antaresSheet/index.vue"
import Chord from "@/components/chord/index.vue"
import { get } from "@/utils/request.js"
import CapoSelector from "@/components/capoSelector.vue";
import DraggablePanel from "@/components/draggablePanel.vue";
import SheetViewerLoadCover from "./loadCover.vue";

let gPlayer = null

export default {
  name: "SheetViewer",
  components: {
    Metronome,
    AntaresSheet,
    Chord,
    CapoSelector,
    DraggablePanel,
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
      env: "pc",
      load: {
        state: ELoadState.Loading,
      },
      sheetInfo: new SheetInfo(),
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
          mouseenter: (e, node) => {
            this.tools.tipChord.show = true
            this.tools.tipChord.chord = ChordManager.getChord(node.chord)
          },
          mouseleave: (e, node) => {
            this.tools.tipChord.show = false
          }
        },
        mark: {
          click: (e, node) => {
            console.log("mark", node)
          },
        }
      },
      tools: {
        tipChord: {
          enable: true,
          show: false,
          chord: {}
        },
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
        metronome: {
          enable: true,
          update: true,
          isFocused: false,
          isFolded: false
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
    toolsPlayerLoadingText: function () {
      switch (this.tools.player.loadState) {
        case ELoadState.Loading: return "加载中...";
        case ELoadState.Loaded: return "加载完成";
        case ELoadState.Failed: return "音源加载失败，请重试";
        default: return "未知错误：播放器遁入了虚空...";
      }
    },
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

    let sheetName = getQueryVariable("sheet")
    if (!sheetName) {
      this.load.state = ELoadState.Empty
      return
    }

    get(`sheets/${sheetName}.atrs`).then((res) => {
      let rootNode = parseSheet(res)
      if (!rootNode) {
        this.load.state = ELoadState.Failed
        throw "曲谱解析失败！"
      }
      this.sheetInfo.title = rootNode.title
      this.sheetInfo.singer = rootNode.singer
      this.sheetInfo.by = rootNode.by
      this.sheetInfo.originalKey = rootNode.originalKey
      this.sheetInfo.sheetKey = rootNode.sheetKey
      this.sheetInfo.chords = rootNode.chords
      this.sheetInfo.rhythms = rootNode.rhythms
      this.sheetInfo.sheetTree = rootNode
      this.sheetInfo.originalSheetKey = rootNode.sheetKey
      this.load.state = ELoadState.Loaded
    }).catch((e) => {
      this.load.state = ELoadState.Failed
      console.error("曲谱获取失败：", e)
    })

    this.env = getEnv()

    let that = this
    // print event
    window.onbeforeprint = () => {
      that.env = "printing"
    }
    window.onafterprint = () => {
      that.env = getEnv()
    } 
  },
  methods: {
    changeScale() {
      let scale = parseFloat(this.tools.sheetControl.scale);
      let defaultFontSize, defaultTitleFontSize, unit
      if (this.env == "pc") {
        defaultFontSize = 20
        defaultTitleFontSize = 32
        unit = "px"
      } else if (this.env == "mobile"){
        defaultFontSize = 4
        defaultTitleFontSize = 8
        unit = "vw"
      } else {
        return;
      }
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

      const bpm = this.$refs['metronome'].getBpm() ?? 120;
      let volume = 1.0;

      // play chord
      let duration = (1 / bpm) * 60 * 4;
      if (gPlayer && gPlayer.audioSource.loaded) {
        gPlayer.setCapo(capo);
        gPlayer.playChord(chord, volume, duration);
      }
    },
    shiftKey(offset) {
      let curKey = this.sheetInfo.sheetKey;
      let newKey = ChordManager.shiftKey(curKey, offset);
      this.sheetInfo.sheetKey = newKey

      traverseNode(this.sheetInfo.sheetTree, (node) => {
        if (node.type == ENodeType.Chord || node.type == ENodeType.ChordPure) {
          node.chord = ChordManager.shiftKey(node.chord, offset)
        } else if (node.type == ENodeType.Plugin && node.pluginType == EPluginType.Tab) {
          node.valid = (this.sheetInfo.originalSheetKey == this.sheetInfo.sheetKey);
        }
      })
    },
    getSidebarStateClass(state) {
      return state ? "" : "sidebar_disabled";
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

      if (this.tools.metronome.update) {
        that.$refs['metronome'].load()
        
        this.tools.metronome.update = false;
      }
    }
  },
  watch: {
    "tools.player.instrument.audioSource": function() {
      this.tools.player.instrument.update = true
      this.loadPlayer()
    }
  }
}
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

<style scoped>
.trans_fade_out-enter-from, 
.trans_fade_out-leave-to{
	opacity: 0;
}
.trans_fade_out-enter-active{
	transition: opacity 0.1s;
}
.trans_fade_out-leave-active{
	transition: opacity 1s;
}
</style>

<style scoped lang="scss">
/* pc */
#viewer[env="pc"] {
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
    color: black;
  }

  #scale_block, #auto_scroll_block {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  #scale_slider, #auto_scroll_slider {
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
/* mobile */
#viewer[env="mobile"] {
  #sheet {
    width: 90%;
  }

  .tools_text {
    width: 200px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 4vw;
  }

  #tools_sheet_control {
    bottom: 0;
    height: 10vh;
    left: 0;
    width: 100%;
    background-color: #000000aa;
    flex-direction: column;
    color: white;
  }
  #tools_sheet_control input {
    flex-shrink: 0;
    width: 60%;
  }
  #scale_block, #auto_scroll_block {
    height: 100%;
    display: flex;
    overflow: hidden;
  }
  #scale_slider, #auto_scroll_slider {
    flex-grow: 1;
    margin: 10px 0;
  }
  #tools_player {
    display: none;
  }
  #scale_block {
    flex-direction: row;
  }

  #auto_scroll_block {
    flex-direction: row;
  }
  #metronome_panel {
    display: none;
    touch-action: none; // this can prevent scroll by touchmove on mobile 
  }
}
</style>

<style scoped lang="scss">
/* printing */
#viewer[env="printing"] {
  #sheet {
    width: 100%;
  }

  #sidebar, #tools_sheet_control, #tools_player, #tip_chord, #sheet_padding, #metronome_panel {
    display: none;
  }
}
</style>