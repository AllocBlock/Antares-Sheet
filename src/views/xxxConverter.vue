<template>
  <div id="viewer" :env="env" :style="globalCssVar">
    <transition name="trans_fade_out">
      <div id="drop_file_cover" v-show="showDropFile">
        <div>{{dropFileCoverText}}</div>
      </div>
    </transition>

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
      </div>
      <div id="sheet_by" class="title">{{sheetInfo.by}}</div>
      <AntaresSheet id="sheet_body_block" :sheet-tree="sheetInfo.sheetTree" :events="sheetEvents"/>
      <div id="sheet_padding"></div>
    </div>
  </div>
</template>

<script type="module">
import ChordManager from "@/utils/chordManager.js";
import { StringInstrument } from "@/utils/instrument.js";
import { SheetNode, ENodeType, EPluginType, traverseNode } from "@/utils/sheetNode.js"
import { convertXXX2Sheet } from "@/utils/xxxConverter.js"

import AntaresSheet from "@/components/antaresSheet/index.vue"

let g_Player = new StringInstrument("Ukulele", "Ukulele") 
// let g_Player = new Instrument("Ukulele", "Oscillator") 

const EDropFileState = {
  Waiting: "等待文件",
  Dragging: "拖拽中",
  Dropped: "已释放",
  Failed: "失败"
}

export default {
  name: "XxxConverter",
  components: {
    AntaresSheet,
  },
  data() {
    return {
      globalCssVar: {
        "font-size": "var(--base-font-size)", 
        "--sheet-font-size": "var(--base-font-size)", 
        "--title-base-font-size": "30px", 
        "--title-scale": "1",
        "--chord-renderer-theme-color": "white", 
        "--chord-renderer-font-color": "black", 
        "--sheet-theme-color": "var(--theme-color)", 
        "--page-size": "100%", 
      },
      env: "pc",
      dropFile: {
        state: EDropFileState.Waiting,
      },
      sheetInfo: {
        title: '加载中',
        singer: '',
        by: '',
        originalKey: '',
        sheetKey: '',
        chords: [],
        rhythms: [],
        originalSheetKey: '',
        sheetTree: new SheetNode(ENodeType.Root)
      },
      sheetEvents: {
        text: {
          click: (e, node) => {
            console.log("text", node)
          }
        },
        chord: {
          click: (e, node) => {
            let chord = ChordManager.getChord(node.chord)
            if (!chord) {
              this.$toast(`错误：库中未找到和弦【${node.chord}】的指法`, 3);
              return
            }
            this.playChord(chord)
          },
        },
        mark: {
          click: (e, node) => {
            console.log("mark", node)
          },
        }
      },
    }
  },
  computed: {
    showDropFile: function() {
      return this.dropFile.state != EDropFileState.Dropped;
    },
    dropFileCoverText: function() {
      switch (this.dropFile.state) {
        case EDropFileState.Waiting: return "拖拽文件加载";
        case EDropFileState.Dragging: return "松开鼠标加载文件";
        case EDropFileState.Dropped: return "已加载";
        case EDropFileState.Failed: return "解析失败，请重试";
        default: return "未知状态"
      }
    }
  },
  mounted() {
    let that = this
    document.ondragover = function (e) {
      e.preventDefault();
      that.dropFile.state = EDropFileState.Dragging;
    };
    document.ondragleave = function (e) {
      e.preventDefault();
      if (that.dropFile.state == EDropFileState.Dragging)
        that.dropFile.state = EDropFileState.Waiting;
    };
    document.ondrop = function (e) {
      e.preventDefault();
      let file = e.dataTransfer.files[0];
      if (!file) return
      let fileReader = new FileReader()
      fileReader.onload = ()=> that.loadXXX(fileReader.result)
      fileReader.readAsText(file)
    };
  },
  methods: {
    loadXXX(xxxText) {
      try {
        let rootNode = convertXXX2Sheet(xxxText)
        if (!rootNode) {
          this.dropFile.state = EDropFileState.Failed;
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
          
        this.dropFile.state = EDropFileState.Dropped;
      }
      catch(e) {
        console.error("xxx转换失败", e)
        this.dropFile.state = EDropFileState.Failed;
      }
    },
    playChord(chord) {
      let volume = 1.0;

      // play chord
      let duration = 0.1;
      if (g_Player && g_Player.audioSource.loaded) {
        g_Player.playChord(chord, volume, duration);
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
  }
}
</script>

<style>
html, body {
  width: 100%;
  height: 100%;
  min-width: 300px;
}

::selection {
  background: var(--theme-color);
}

</style>

<style scoped lang="scss">
#viewer {
  width: 100%;
  height: 100%;
  margin: 0;
  position: relative;
  font-size: var(--base-font-size);

  display: flex;
}

#drop_file_cover {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: wheat;
  color: var(--sheet-theme-color);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 50px;
  letter-spacing: 5px;
  z-index: 20;
  margin-right: auto;
}

#sheet {
  display: flex;
  flex-direction: column;
  padding-left: 20px;
  padding-right: 20px;
  box-sizing: border-box;

  * {
    flex-shrink: 0;
  }
}

.title {
  flex-shrink: 0;
  overflow: hidden;
  white-space: nowrap;
  word-break: break-all;
  text-overflow: ellipsis;
}

#song_title {
  margin: calc(var(--title-base-font-size) * 0.2) 0;
  height: calc(var(--title-base-font-size) * 2);
  line-height: calc(var(--title-base-font-size) * 2);
  font-size: calc(var(--title-base-font-size) * 1.5);
  color: black;
  width: 100%;
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
  flex-wrap: wrap;
}

#sheet_original_key, #sheet_current_key {
  margin-right: 10px;
}

#sheet_current_key {
  display: flex;
  align-items: center;
}

#sheet_key_shift {
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
  width: 100%;
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
}

#sheet_padding {
  height: 50vh;
}

.sheet_body {
  white-space: pre-wrap;
  margin: 0;
  width: 100%;
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

<style scoped>
:deep(chord::after) {
  content: "";
  position: absolute;
  left: -10px;
  top: calc(-8px - var(--sheet-font-size));
  right: -10px;
  bottom: -2px;
  border: 2px solid transparent;
  transition: 0.3s ease-out;
  border-radius: 5px;
  z-index: 1;
  pointer-events: none;
}

:deep(chord-pure::after) {
  content: "";
  position: absolute;
  left: -10px;
  top: -2px;
  right: -10px;
  bottom: -2px;
  border: 2px solid transparent;
  transition: 0.3s ease-out;
  border-radius: 5px;
  z-index: 1;
  pointer-events: none;
}

:deep(chord:hover::after),
:deep(chord-pure:hover::after) {
  border: 2px solid var(--sheet-theme-color);
  box-shadow: 0 0 5px 2px black;
}

:deep(chord-ruby::before),
:deep(chord-pure::before) {
  content: "▶";
  position: absolute;
  font-size: 20px;
  color: black;
  transform: translate(-50%, -50%);
  top: 50%;
  left: 50%;
  opacity: 0;
}

:deep(chord:hover chord-ruby::before),
:deep(chord-pure:hover::before) {
  opacity: 0.8;
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
