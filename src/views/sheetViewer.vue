<template>
  <div id="container" :env="env">
    <div id="tools_block_1" class="tools_block" :style="globalCssVar">
      <div id="scale_block">
        <div class="tools_text">缩放</div>
        <input
          id="scale_slider"
          type="range"
          step="0.01"
          min="0.2"
          max="5"
          v-model="scale"
          @input="changeScale()"
        />
        <div id="scale_text" class="tools_text">{{parseFloat(scale).toFixed(1)}}</div>
      </div>
      <div id="auto_scroll_block">
        <div class="tools_text">自动滚动</div>
        <input
          id="auto_scroll_slider"
          type="range"
          step="0.1"
          min="0"
          max="10"
          v-model="autoScroll.speed"
          @input="changeAutoScrollSpeed()"
        />
        <div id="auto_scroll_text" class="tools_text">{{autoScroll.speed ? `x${parseFloat(autoScroll.speed).toFixed(1)}` : "停止"}}</div>
      </div>
    </div>

    <div id="tools_block_2" class="tools_block">
      <Metronome />
      <select id="instrument_combo" v-model="player.instrument">
        <option value="Oscillator">振荡器</option>
        <option value="Ukulele">尤克里里音源</option>
      </select>
    </div>

    <div id="sheet">
      <Chord id="chord" :style="`opacity: ${tipChord.show ? 1 : 0}`" :chord="tipChord.chord" />
      <div id="song_title" class="title">{{sheetInfo.title}}</div>
      <div id="song_singer" class="title">{{sheetInfo.singer}}</div>
      <div id="sheet_key_block">
        <div id="sheet_key" class="title">{{`原调 ${sheetInfo.originalKey} 选调 ${sheetInfo.sheetKey}`}}</div>
        <div id="sheet_key_shift">
          <div id="sheet_key_shift_up">▲</div>
          <div id="sheet_key_shift_down">▼</div>
        </div>
      </div>
      <div id="sheet_by" class="title">{{sheetInfo.by}}</div>
      <WebSheet id="sheet_body_block" :sheet-tree="sheetInfo.sheetTree" :events="sheetEvents"/>
    </div>
  </div>
</template>

<script type="module">
// TODO: 突然想到，给不同和弦加上颜色是不是很炫酷
// TODO: 再整一个节拍器，可以随节拍换颜色

import { getQueryVariable } from "@/utils/webCommon.js";
import { WebPlayer } from "@/utils/webPlayer.js";
import WebChordManager from "@/utils/webChordManager.js";
import { SheetNode, ENodeType, createUnknownNode } from "@/utils/sheetNode.js"
import WebSheetParser from "@/utils/webSheetParser"

import Metronome from "@/components/metronome"
import WebSheet from "@/components/webSheet"
import Chord from "@/components/chord"
import { get } from "@/utils/request.js"

let g_ChordManager = new WebChordManager
let g_UkulelePlayer = new WebPlayer("Ukulele", "Ukulele")
let g_OscillatorPlayer = new WebPlayer("Ukulele", "Oscillator")

export default {
  name: "SheetViewer",
  components: {
    Metronome, WebSheet, Chord
  },
  data() {
    return {
      globalCssVar: {
        "font-size": "var(--base-font-size)", 
        "--base-font-size": "18px", 
        "--sheet-font-size": "var(--base-font-size)", 
        "--title-base-font-size": "30px", 
        "--title-scale": "1", 
        "--theme-color": "#e9266a", 
        "--chord-renderer-theme-color": "white", 
        "--chord-renderer-font-color": "black", 
        "--sheet-theme-color": "var(--theme-color)", 
        "--page-size": "100%", 
      },
      env: "pc",
      loaded: false,
      scale: 1,
      autoScroll: {
        started: false,
        speed: 0.0,
        timer: null
      },
      sheetInfo: {
        title: '加载中',
        singer: '',
        by: '',
        originalKey: '',
        sheetKey: '',
        chords: '',
        rhythms: '',
        sheetTree: new SheetNode(ENodeType.Root)
      },
      sheetEvents: {
        text: {
          click: (node) => {
            console.log("text", node)
          }
        },
        chord: {
          click: (node) => {
            this.playChord(g_ChordManager.getChord(node.chord))
          },
          mouseenter: (node) => {
            this.tipChord.show = true
            this.tipChord.chord = g_ChordManager.getChord(node.chord)
          },
          mouseleave: (node) => {
            this.tipChord.show = false
          }
        },
        mark: {
          click: (node) => {
            console.log("mark", node)
          },
        }
      },
      tipChord: {
        show: false,
        chord: {}
      },
      player: {
        instrument: "Oscillator"
      }
    }
  },
  mounted() {
    // 检查环境
    if (document.body.clientWidth / document.body.clientHeight < 0.8) {
      // 竖屏
      this.env = "mobile";
    } else {
      this.env = "pc";
    }

    let sheetName = getQueryVariable("sheet")
    get(`sheets/${sheetName}.sheet`).then((res) => {
      let rootNode = WebSheetParser.parse(res)
      if (!rootNode) {
        throw "曲谱解析失败！"
      }
      this.sheetInfo.title = rootNode.title
      this.sheetInfo.singer = rootNode.singer
      this.sheetInfo.by = rootNode.by
      this.sheetInfo.originalKey= rootNode.originalKey
      this.sheetInfo.sheetKey = rootNode.sheetKey
      this.sheetInfo.chords = rootNode.chords
      this.sheetInfo.rhythms = rootNode.rhythms
      this.sheetInfo.sheetTree = rootNode
      this.loaded = true
    }).catch((e) => {
      console.error("加载失败", e)
    })
  },
  methods: {
    changeScale() {
      let scale = parseFloat(this.scale);
      let defaultFontSize, defaultTitleFontSize
      if (this.env == "pc") {
        defaultFontSize = 18
        defaultTitleFontSize = 30
      } else {
        defaultFontSize = 4
        defaultTitleFontSize = 8
      }
      document.documentElement.style.setProperty(
        "--base-font-size",
        `${defaultFontSize * scale}px`
      );
      document.documentElement.style.setProperty(
        "--title-base-font-size",
        `${defaultTitleFontSize * scale}px`
      );
    },
    changeAutoScrollSpeed() {
      if (!this.autoScroll.started) {
        this.startAutoScroll()
      }
    },
    startAutoScroll() {
      let that = this
      function scroll(amount) {
        console.log("scroll")
        document.documentElement.scrollTop += amount
        document.body.scrollTop += amount // 兼容老版chrome，好像小程序也需要用body
      }

      let lastTimeStamp = new Date().getTime()
      function scrollLoop() {
        let speed = that.autoScroll.speed
        if (speed == 0) {
          window.cancelAnimationFrame(that.autoScroll.timer)
          that.autoScroll.timer = null
          that.autoScroll.started = false
          return
        }
        const delay = 100 / speed
        let curTimeStamp = new Date().getTime()
        if (curTimeStamp - lastTimeStamp > delay) {
          let amount = (curTimeStamp - lastTimeStamp) / delay
          scroll(amount)
          lastTimeStamp = curTimeStamp
        }
        that.autoScroll.timer = window.requestAnimationFrame(scrollLoop)
      }
      this.autoScroll.started = true
      scrollLoop()
    },
    playChord(chord) {
      const bpm = 120
      let volume = 0.5;
      let duration = (1 / bpm) * 60 * 4;
      let player = null;
      switch (this.player.instrument) {
        case "Oscillator":
          player = g_OscillatorPlayer;
          break;
        case "Ukulele":
          player = g_UkulelePlayer;
          break;
        default:
          throw "未知错误";
      }
      player.playChord(chord, volume, duration);
    }
  }
}

function setupEvents() {
  $("#sheet_key_shift_up").click(() => shiftKey(1));
  $("#sheet_key_shift_down").click(() => shiftKey(-1));
}

function shiftKey(offset) {
  let curKey = g_SheetInfo.sheetKey;
  let newKey = g_ChordManager.shiftKey(curKey, offset);

  let $chords = $("chord_name,chord_pure");
  $chords.each((i, e) => {
    let $chord = $(e);
    let originalChord = $chord.text();
    let newChord = g_ChordManager.shiftKey(originalChord, offset);
    $chord.text(newChord);
  });

  if (g_OriginalSheetKey == newKey) {
    $("tab-box").attr("state", "normal");
  } else {
    $("tab-box").attr("state", "disabled");
  }

  g_SheetInfo.sheetKey = newKey;

  updateSheetInfo();
}
</script>

<style scoped>
::selection {
  background: var(--theme-color);
}

#container /deep/ chord-ruby::before,
#container /deep/ chord-pure::before {
  content: "▶";
  position: absolute;
  font-size: 20px;
  color: black;
  transform: translate(-50%, -50%);
  top: 50%;
  left: 50%;
  opacity: 0;
  transition: all 0.2s ease-out;
}

#container /deep/ chord:hover chord-ruby::before,
#container /deep/ chord-pure:hover::before {
  opacity: 0.8;
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.toggle {
  --size: 30px;
  position: relative;
  appearance: none;
  width: calc(var(--size) * 2);
  height: var(--size);
  border: #fff 2px solid;
  border-radius: calc(var(--size) / 2);
  background: transparent;
  transition: border 0.2s ease-out;

  display: flex;
  align-items: center;
}
.toggle::before {
  --ball-size: calc(var(--size) * 0.8);
  --margin-size: calc((var(--size) - var(--ball-size)) / 2);
  content: "";
  position: absolute;
  width: var(--ball-size);
  height: var(--ball-size);
  border-radius: 50%;
  background: grey;
  left: var(--margin-size);
  transition: all 0.2s ease-out;
}

.toggle:checked {
  background: #e9266a33;
}

.toggle:checked::before {
  left: calc(100% - var(--ball-size) - var(--margin-size));
  background: var(--theme-color);
}

.toggle:focus {
  outline: none;
}

a,
a:link,
a:visited,
a:active,
a:focus {
  text-decoration: none;
}

#container {
  width: 100%;
  height: 100%;
  margin: 0;
  position: relative;
  font-size: var(--base-font-size);

  display: flex;
  flex-direction: column;
  align-items: center;
}

#sheet {
  padding-bottom: 50%;
  display: flex;
  flex-direction: column;
}

#container[env="pc"] #sheet {
  width: calc(100% - 400px);
}

#container[env="mobile"] #sheet {
  width: 90%;
}

.title {
  overflow: hidden;
  white-space: nowrap;
  word-break: break-all;
  text-overflow: ellipsis;
}

#song_title {
  margin-top: var(--title-base-font-size);
  height: calc(var(--title-base-font-size) * 2);
  line-height: calc(var(--title-base-font-size) * 2);
  font-size: calc(var(--title-base-font-size) * 1.5);
  color: black;
}

#song_singer {
  height: calc(var(--title-base-font-size) * 0.9);
  line-height: calc(var(--title-base-font-size) * 0.9);
  font-size: calc(var(--title-base-font-size) * 0.8);
  color: #aaaaaa;
}

#sheet_key_block {
  margin-top: 10px;
  line-height: var(--title-base-font-size);
  font-size: calc(var(--title-base-font-size) * 0.9);
  color: black;

  display: flex;
  align-items: center;
}

#sheet_key {
}

#sheet_key_shift {
  height: 100%;
  width: 30px;
  margin: 0 10px;

  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
}

#sheet_key_shift_up,
#sheet_key_shift_down {
  width: 100%;

  display: flex;
  justify-content: center;
  align-items: center;

  transition: all 0.2s ease-out;
}

#sheet_key_shift_up:hover,
#sheet_key_shift_down:hover {
  color: rgb(187, 73, 73);
}

#sheet_by {
  margin-top: 5px;
  height: calc(var(--title-base-font-size) * 0.8);
  line-height: calc(var(--title-base-font-size) * 0.8);
  font-size: calc(var(--title-base-font-size) * 0.7);
  color: rgb(156, 156, 156);
}

#sheet_body_block {
  margin-top: 10px;

  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
}

.sheet_body {
  white-space: pre-wrap;
  margin: 0;
  width: 100%;
}

.sheet_body[page="paper"] {
  margin: 10px;
  padding: 10px 20px;
  /* width: calc(100% - 60px); */
  width: calc(var(--page-size) - 60px);
  min-width: 300px;
  max-width: 600px;
  outline: 2px white solid;
  overflow: hidden;
}

#chord {
  position: fixed;
  right: 40px;
  top: 30px;
  height: 200px;
  width: 150px;
  transition: opacity 0.2s ease-out;

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
  color: black;
}

#container[env="pc"] .tools_text {
  width: 100%;
  height: 20px;
  text-align: center;
  line-height: 20px;
  font-size: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

#container[env="mobile"] .tools_text {
  width: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 4vw;
}

#container[env="pc"] #tools_block_1 {
  top: 25%;
  height: 50%;
  left: 10px;
  width: 160px;
}

#container[env="mobile"] #tools_block_1 {
  bottom: 0;
  height: 10%;
  left: 0;
  width: 100%;
  background-color: #000000aa;
  flex-direction: column;
}

#container[env="mobile"] #tools_block_1 input {
  flex-shrink: 0;
  width: 60%;
}

#tools_block_2 {
  right: 10px;
  width: 160px;
  top: 40%;
  flex-direction: column;
}

#container[env="mobile"] #tools_block_2 {
  display: none;
}

#scale_block {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

#container[env="mobile"] #scale_block {
  flex-direction: row;
}

#scale_slider {
  flex-grow: 1;
  margin: 10px 0;
}

#container[env="pc"] #scale_slider {
  -webkit-appearance: slider-vertical;
}

#auto_scroll_block {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

#container[env="mobile"] #auto_scroll_block {
  flex-direction: row;
}

#auto_scroll_slider {
  flex-grow: 1;
  margin: 10px 0;
}

#container[env="pc"] #auto_scroll_slider {
  -webkit-appearance: slider-vertical;
}

#page_type_block {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

#paper_size_slider {
  display: none;
}
</style>