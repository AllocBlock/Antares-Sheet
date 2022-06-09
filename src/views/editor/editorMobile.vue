<template>
  <div class="editor" :style="globalCssVar">
    <div id="sheet_block">
      <input
        type="text"
        id="song_title_input"
        class="input"
        placeholder="在此处输入歌名"
        v-model="sheetInfo.title"
      />
      <input
        type="text"
        id="song_singer_input"
        class="input"
        placeholder="在此处输入歌手"
        v-model="sheetInfo.singer"
      />
      <div id="sheet_key_block">
        <div class="title">原调</div>
        <KeySelector class="select" v-model:value="sheetInfo.originalKey" />
        <div class="title">选调</div>
        <KeySelector class="select" :value="sheetInfo.sheetKey" @change="onChangeSheetKey" />
      </div>
      <div id="sheet_by" class="title">制谱 锦瑟</div>
      <div class="flex_center">
        <div id="edit_raw_lyric_button" class="button">编辑歌词</div>
        <div class="button" @click="saveSheetToFile">保存</div>
        <div class="button" @click="loadSheetFromFile">载入</div>
      </div>
      <AntaresSheet
        id="sheet"
        class="sheet_box"
        :sheet-tree="sheetInfo.sheetTree"
        :events="editorMode.componentEvents"
      />
      <div id="sheet_padding"></div>
    </div>
  </div>

  <div id="tools_block" @touchstart="disableOverscroll">
    <!-- <div id="tools_title" class="title flex_center">工具栏</div> -->
    <div class="padding" />
    <ToolChord id="chord_tool" :styles="toolChordStyles" v-model:chords="attachedChords" v-on="editorMode.toolChordEvents" />
    <div class="padding" />
    <!-- <div id="chord_tool_edit_button" class="button" @click="openPanelChord">
      编辑和弦
    </div> -->
  </div>

  <div id="drag_mark" v-show="dragChord.isDragging" ref="dragMark">
    <div id="drag_mark_text">{{dragChord.text}}</div>
    <div id="drag_mark_arrow"></div>
  </div>

  <div id="raw_lyric_panel" class="panel" style="display: none">
    <div id="raw_lyric_container">
      <div id="raw_lyric_title">在下方输入歌词</div>
      <textarea id="raw_lyric_textarea"></textarea>
      <div style="display: flex">
        <div id="raw_lyric_button_confirm" class="button">确认歌词</div>
        <div id="raw_lyric_button_cancel" class="button">取消</div>
      </div>
    </div>
  </div>

  <PanelChordSelector
    id="chord_panel"
    class="panel"
    v-model:attachedChords="attachedChords"
    v-model:show="showChordPanel"
    :key="sheetInfo.sheetKey"
  />

  <div id="help_button" v-if="false">?</div>
</template>

<script>
import { reactive } from "vue";
import { getQueryVariable } from "@/utils/common.js";
import { Instrument } from "@/utils/instrument.js";
import ChordManager from "@/utils/chordManager.js";
import { SheetNode, ENodeType, traverseNode } from "@/utils/sheetNode.js";

import SheetParser from "@/utils/sheetParser";
import AntaresSheet from "@/components/antaresSheet/index.vue";
import KeySelector from "@/components/keySelector.vue";
import Chord from "@/components/chord/index.vue";
import { get } from "@/utils/request.js";
import ToolChord from "./toolChord.vue";
import PanelChordSelector from "./panelChordSelector.vue";
import AudioPlayer from "./audioPlayer.vue";

import EditorModeMobileDrag from './editorModeMobileDrag.js'
import { Editor, EditorAction } from "./editor.js";

let g_UkulelePlayer = new Instrument("Ukulele", "Ukulele");
let g_OscillatorPlayer = new Instrument("Ukulele", "Oscillator");

function getInputText(tips, defaultText = "") {
  return prompt(tips, defaultText);
}

export default {
  name: "SheetEditor",
  components: {
    ToolChord,
    PanelChordSelector,
    Chord,
    AntaresSheet,
    KeySelector,
    AudioPlayer
  },
  data() {
    return {
      globalCssVar: {
        "--sheet-font-size": "var(--base-font-size)",
        "--title-base-font-size": "calc(var(--base-font-size) * 1.8)",
        "--title-scale": "1",
        "--sheet-theme-color": "var(--theme-color)",
        "--tip-text-background-color": "var(--theme-color)",
        "--tip-button-background-color": "seagreen",
      },
      showChordPanel: false,
      attachedChords: [],
      loaded: false,
      sheetInfo: {
        title: "加载中",
        singer: "",
        by: "",
        originalKey: "",
        sheetKey: "",
        chords: [],
        rhythms: [],
        originalSheetKey: "",
        sheetTree: reactive(new SheetNode(ENodeType.Root)),
      },
      editorMode: EditorModeMobileDrag,
      toolChordEvents: {},
      toolChordStyles: {
        titleRatio: 0.16,
        colorMain: "white",
        colorMarkText: "black",
        colorRootString: "red"
      },
      player: {
        instrument: "Oscillator",
      },
      dragChord: {
        isDragging: false,
        text: "",
      },
    };
  },
  created() {
    this.editorMode.init(this)
    if (this.editorMode.toolChordEvents)
      this.toolChordEvents = this.editorMode.toolChordEvents
    console.log(this.toolChordEvents)
  },
  mounted() {
    let that = this

    let sheetName = getQueryVariable("sheet");
    get(`sheets/${sheetName}.sheet`)
      .then((res) => {
        that.loadSheet(res)
      })
      .catch((e) => {
        console.error("加载失败", e);
      });
  },
  methods: {
    loadSheet(sheetText) {
      let rootNode = reactive(SheetParser.parse(sheetText));
      Editor.normalizeSheetTree(rootNode);
      if (!rootNode) {
        throw "曲谱解析失败！";
      }
      this.sheetInfo.title = rootNode.title ?? "";
      this.sheetInfo.singer = rootNode.singer ?? "";
      this.sheetInfo.by = rootNode.by ?? "";
      this.sheetInfo.originalKey = rootNode.originalKey ?? "C";
      this.sheetInfo.sheetKey = rootNode.sheetKey ?? "C";
      this.sheetInfo.chords = rootNode.chords ?? [];
      this.sheetInfo.rhythms = rootNode.rhythms ?? [];
      this.sheetInfo.sheetTree = rootNode;
      this.sheetInfo.originalSheetKey = rootNode.sheetKey;
      this.$nextTick(() => {
        this.loaded = true; // 下一帧才设为加载完成，避免触发watch
      })

      this.attachedChords = this.sheetInfo.chords ? this.sheetInfo.chords.map((chordName) =>
        ChordManager.getChord(chordName)
      ) : [];
      console.log(this.sheetInfo.chords, this.attachedChords);
    },
    openPanelChord() {
      this.showChordPanel = true;
    },
    playChord(chord) {
      const bpm = 120;
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
    },
    shiftKey(oldKey, newKey) {
      traverseNode(this.sheetInfo.sheetTree, (node) => {
        if (node.type == ENodeType.Chord || node.type == ENodeType.ChordPure) {
          node.chord = ChordManager.shiftKey(node.chord, oldKey, newKey);
        }
      });

      for (let i in this.attachedChords) {
        let chordName = this.attachedChords[i].name
        let newChordName = ChordManager.shiftKey(chordName, oldKey, newKey);
        this.attachedChords[i] = ChordManager.getChord(newChordName)
      }
    },
    onChangeSheetKey(e) {
      let oldKey = this.sheetInfo.sheetKey
      let newKey = e.currentTarget.value
      if (newKey == oldKey) return;
      this.sheetInfo.sheetKey = newKey
      let confirmed = confirm("你修改了曲谱调式，是否将和弦一起转调？")
      if (!confirmed) return
      this.shiftKey(oldKey, newKey)
    },
    disableOverscroll(e) {
      e.preventDefault()
    }
  },
  watch: {
    attachedChords: function() {
      this.sheetInfo.chords = this.attachedChords.map(chord => chord.name)
    }
  },
};
</script>

<style scoped src="./common.css"></style>

<style scoped lang="scss">
.title {
  overflow: hidden;
  white-space: nowrap;
  word-break: break-all;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.input {
  outline: none;
  border: none;
  background-color: transparent;
}
.input:focus {
  outline: 2% solid var(--theme-color);
}
.input::placeholder {
  color: rgb(192, 106, 106);
}

.select {
  height: 100%;
  margin: 0 10px;
  background-color: transparent;
  font-size: var(--base-font-size);
  border: none;
  outline: 2px solid grey;
}
.select option {
  background-color: black;
}
.select option:checked {
  background-color: grey;
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

.editor {
  width: 100%;
  height: 100%;
  display: flex;
}

#sheet_block {
  width: 100%;
  padding: 5vw 5vw 50vh 5vw;

  box-sizing: border-box;
  padding: 20px;
  padding-bottom: 50%;
  display: flex;
  flex-direction: column;

  &>*{
    flex-shrink: 0;
  }

  #sheet_padding {
    height: 50vh;
  }
}

#song_title_input {
  height: calc(var(--title-base-font-size) * 2);
  line-height: calc(var(--title-base-font-size) * 2);
  font-size: calc(var(--title-base-font-size) * 1.5);
}

#song_singer_input {
  height: calc(var(--title-base-font-size) * 0.9);
  line-height: calc(var(--title-base-font-size) * 0.9);
  font-size: calc(var(--title-base-font-size) * 0.8);
  color: #aaaaaa;
}

#sheet_key_block {
  margin-top: 10px;
  line-height: var(--title-base-font-size);
  font-size: calc(var(--title-base-font-size) * 0.9);

  display: flex;
  align-items: center;
}

#sheet_by {
  margin-top: 5px;
  height: calc(var(--title-base-font-size) * 0.8);
  line-height: calc(var(--title-base-font-size) * 0.8);
  font-size: calc(var(--title-base-font-size) * 0.7);
  color: rgb(156, 156, 156);
}

#sheet {
  margin-top: 10px;
  font-size: var(--base-font-size);
}

.context {
  position: fixed;
  display: flex;
  overflow: hidden;
  user-select: none;
  overflow: hidden;
  z-index: 20;

  border-radius: 10px;
}

.context::before {
  position: absolute;
  content: "";

  width: 100%;
  height: 100%;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgb(49, 100, 88);
  opacity: 0.9;
}

.panel {
  z-index: 30;

  position: fixed;
  height: 100%;
  width: 100%;
  left: 0;
  top: 0;
}

#raw_lyric_panel {
}
#raw_lyric_container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
}
#raw_lyric_title {
  padding: 20px 0;
}
#raw_lyric_textarea {
  font-family: inherit;
  color: black;
  font-size: var(--base-font-size);
  height: 60%;
  width: 60%;
}
#raw_lyric_button_confirm {
  background: var(--sheet-theme-color);
}
#raw_lyric_button_cancel {
  background: grey;
}
#edit_raw_lyric_button {
  background: var(--sheet-theme-color);
}

#drag_mark {
  position: fixed;
  pointer-events: none;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  box-sizing: border-box;
  opacity: 0.8;
  z-index: 21;

  #drag_mark_text {
    padding: 10px 20px;
    border: 2px rgb(17, 83, 58) solid;
    border-radius: 2vw;
    border-width: 1vw;
    font-size: 5vw;
    background-color: rgb(39, 124, 92);
    color: white;
  }

  #drag_mark_arrow {
    width: 0;
    height: 0;
    border-left: 4vw solid transparent;
    border-right: 4vw solid transparent;
    border-top: 8vw solid rgb(17, 83, 58);
    opacity: 0.8;

    left: calc(50% - 4vw);
  }
}

#help_button {
  position: fixed;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
  right: 20px;
  bottom: 20px;
  border-radius: 50%;
  background-color: #ff000080;
  opacity: 0.5;
  user-select: none;
}

#help_button:hover {
  opacity: 1;
}

#tools_block {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 20%;
  z-index: 20;

  display: flex;
  overflow-y: auto;
  overscroll-behavior: contain; /* 禁止滚动事件穿透，但似乎不一定有效 */
  background-color: rgba(86, 61, 73, 0.9);
  color: white;

  .padding {
    background: rgb(86, 61, 73);
    height: 100%;
    width: 10%;
  }

  #chord_tool {
    position: relative;
    left: 0;
    width: 80%;
    height: 100%;
    transform: none;
  }
}

</style>