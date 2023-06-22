<template>
  <div class="editor" :style="globalCssVar">
    <div class="flex_center fill" style="flex-direction: column;">
      <div class="flex_center fill"
        :style="`height: ${layout.showAudioPlayer ? ('calc(100% - ' + layout.audioPlayerHeight + 'px)') : '100%'}; position: relative;`">
        <div id="help_button" @click="helpPanel.show = true">?</div>
        <div id="tools_block" :style="`width: ${layout.toolWidthPercentage}%;`">
          <div id="tools_title" class="title flex_center">工具栏</div>
          <div id="tools_title" class="flex_center">
            <div :class="`button ${editor.canUndo() ? '' : 'disabled_button'}`"
              @click="editor.canUndo() ? editor.undo : null">
              撤销
            </div>
            <div class="button" v-if="editor.canRedo()" @click="editor.redo">
              重做
            </div>
          </div>
          <ToolChord id="chord_tool" v-model:chords="toolChord.attachedChords" @dragStart="onToolChordDragStart" />
          <div class="button" @click="this.toolChord.showPanel = true">
            编辑和弦
          </div>
          <div id="clear_sheet_button" class="button" @click="clearSheet">
            清空曲谱
          </div>
        </div>
        <div class="fill" style="display: flex; justify-content: center; overflow: auto;">
          <div id="sheet_block" :style="`width: ${100 - layout.toolWidthPercentage}%`">
            <input type="text" id="song_title_input" class="input" placeholder="在此处输入歌名" v-model="editor.meta.title"
              @focus="beginTyping" @blur="endTyping" />
            <input type="text" id="song_singer_input" class="input" placeholder="在此处输入歌手" v-model="editor.meta.singer"
              @focus="beginTyping" @blur="endTyping" />
            <div id="sheet_key_block">
              <div class="title">原调</div>
              <KeySelector class="select" v-model:value="editor.meta.originalKey" />
              <div class="title">选调</div>
              <KeySelector class="select" :value="editor.meta.sheetKey" @change="onChangeSheetKey" />
              <div id="sheet_capo_block">
                <div class="title">变调夹</div>
                <CapoSelector id="capo_selector" class="select" v-model:value="player.capo" />
              </div>
            </div>
            <div id="sheet_by" class="title">制谱 锦瑟</div>
            <div class="flex_center">
              <div id="edit_raw_sheet_button" class="button" @click="openRawSheetPanel">编辑原始曲谱</div>
              <div class="button" @click="saveSheet">保存</div>
              <div class="button" @click="loadSheetFromFile">载入</div>
            </div>
            <AntaresSheet id="sheet_box" :sheet-tree="editor.root" :events="nodeEventList" />
            <div id="sheet_padding"></div>
          </div>
        </div>
      </div>
      <div class="flex_center fill"
        :style="`height: ${layout.showAudioPlayer ? layout.audioPlayerHeight : '0'}px; position: relative;`">
        <div class="flex_center" v-show="!layout.showAudioPlayer" id="playerOpenTag"
          @click="layout.showAudioPlayer = true">打开音乐播放器</div>
        <AudioPlayer v-show="layout.showAudioPlayer" @close="layout.showAudioPlayer = false"
          :mute-hotkey="mutePlayerHotkey" />
      </div>
    </div>

    <input type="range" id="layout_slider" min="0" max="100" step="0.1" v-model="layout.toolWidthPercentage" />

    <div id="editor_context" class="context" v-show="contextMenu.show" :style="contextMenu.style"
      @click.stop="contextMenu.show = false">
      <div id="editor_context_menu">
        <div class="context_menu_item">
          <Svg v-for="item in contextMenu.insertMenu" :key="item.type" :src="`/icons/${item.svgName}.svg`"
            class="context_icon context_menu_button" @click="insertNode(item.type, true)"
            @mouseenter="onContextButtonMouseEnter('在左侧' + item.tip)" @mouseleave="onContextButtonMouseLeave()"></Svg>
        </div>
        <div class="context_menu_item">
          <Svg v-for="item in contextMenu.insertMenu" :key="item.type" :src="`/icons/${item.svgName}.svg`"
            class="context_icon context_menu_button" @click="insertNode(item.type, false)"
            @mouseenter="onContextButtonMouseEnter('在右侧' + item.tip)" @mouseleave="onContextButtonMouseLeave()"></Svg>
        </div>
        <div class="context_menu_item" @click="editContent()" v-show="contextMenu.enableEditContent">
          <Svg src="/icons/edit.svg" class="context_icon context_menu_button"
            @mouseenter="onContextButtonMouseEnter('编辑内容')" @mouseleave="onContextButtonMouseLeave()"></Svg>
        </div>
        <div class="context_menu_item" @click="editRemove()">
          <Svg src="/icons/trash.svg" class="context_icon context_menu_button"
            @mouseenter="onContextButtonMouseEnter('删除')" @mouseleave="onContextButtonMouseLeave()"></Svg>
        </div>
        <div class="context_menu_item" v-show="contextMenu.enableAddUnderline || contextMenu.enableRemoveUnderline">
          下划线
          <Svg src="/icons/add.svg" class="context_icon context_menu_button" @click="editAddUnderline()"
            v-show="contextMenu.enableAddUnderline" @mouseenter="onContextButtonMouseEnter('添加下划线')"
            @mouseleave="onContextButtonMouseLeave()"></Svg>
          <Svg src="/icons/trash.svg" class="context_icon context_menu_button" @click="editRemoveUnderline()"
            v-show="contextMenu.enableRemoveUnderline" @mouseenter="onContextButtonMouseEnter('删除下划线')"
            @mouseleave="onContextButtonMouseLeave()"></Svg>
        </div>
        <div class="context_menu_item" v-show="contextMenu.enableRecoverChord">
          和弦
          <Svg src="/icons/recover.svg" class="context_icon context_menu_button" @click="editRecoverChord()"
            v-show="contextMenu.enableRecoverChord" @mouseenter="onContextButtonMouseEnter('将和弦恢复成文本')"
            @mouseleave="onContextButtonMouseLeave()"></Svg>
          <Svg src="/icons/switch.svg" class="context_icon context_menu_button" @click="editSwitchChordType()"
            v-show="contextMenu.enableSwitchChordType" @mouseenter="onContextButtonMouseEnter('切换和弦类别')"
            @mouseleave="onContextButtonMouseLeave()"></Svg>
        </div>
      </div>
      <Transition name="trans_fade">
        <div id="editor_context_tip" v-show="contextMenu.tip.show" key="editor_context_tipxxx">
          {{ contextMenu.tip.content }}
        </div>
      </Transition>

    </div>

    <div id="drag_mark" v-show="dragChord.isDragging" ref="dragMark">{{ dragChord.text }}</div>
    <div id="raw_sheet_panel" class="panel" v-if="rawSheetPanel.show">
      <div id="raw_sheet_container">
        <div id="raw_sheet_title">在下方编辑原始曲谱，可以直接粘贴歌词~</div>
        <textarea id="raw_sheet_textarea" v-model="rawSheetPanel.data"></textarea>
        <div v-if="!rawSheetPanel.isValid" class="flex" style="color: red">
          曲谱格式格式有误，请检查qysnqys
        </div>
        <div class="flex">
          <div v-if="rawSheetPanel.isValid" id="raw_sheet_button_confirm" class="button" @click="confirmRawSheet">确认</div>
          <div id="raw_sheet_button_cancel" class="button" @click="rawSheetPanel.show = false">取消</div>
        </div>
      </div>
    </div>
    <PanelChordSelector id="chord_panel" class="panel" v-model:attachedChords="toolChord.attachedChords"
      v-model:show="toolChord.showPanel" :tonic="editor.meta.sheetKey" />
    <div id="drop_hint_panel">
      <div id="drop_hint_text">拖拽文件加载</div>
    </div>

    <div id="help_panel" class="panel" v-if="helpPanel.show">
      曲谱编辑教程：<br />
      {{ editorMode.getTip() }}
      <div class="button" @click="helpPanel.show = false">确认</div>
    </div>

    <DraggablePanel title="键盘" :initPos="{ left: 200, top: 200 }" v-model:isFocused="keyboard.isFocused"
      v-model:isFolded="keyboard.isFolded">
      <InstrumentSimulatorKeyboard :mute-hot-key="muteKeyboardHotKey" />
    </DraggablePanel>
  </div>
</template>

<script lang="ts">
import AntaresSheet from "@/components/antaresSheet/index.vue";
import KeySelector from "@/components/keySelector.vue";
import ToolChord from "./toolChord.vue";
import PanelChordSelector from "./panelChordSelector.vue";
import Chord from "@/components/chord/index.vue";
import CapoSelector from "@/components/capoSelector.vue";
import Svg from "@/components/svg.vue";
import DraggablePanel from "@/components/draggablePanel.vue";
import InstrumentSimulatorKeyboard from "@/components/instrumentSimulator/keyboard.vue";
import Focusable from "@/components/focusable.vue";

import { defineAsyncComponent } from "vue";
import { startRepeatTimeout } from "@/utils/common.js";

import { ENodeType, traverseNode, validateTree } from "@/utils/sheetNode";
import { parseSheet } from "@/utils/sheetParser";
import { NodeUtils } from "@/utils/sheetEdit.js";
import { loadSheetFromUrlParam, ESheetSource } from "@/utils/sheetCommon";
import SheetEditor from "./editor";
import { EditorModeCombined } from './editorMode'
import EditorModeBasic from './editorModeBasic'
import { EditorModeDrag, DragChordInfo } from './editorModeDrag'
import EditorModeProgression from './editorModeProgression'

import { StringInstrument } from "@/utils/instrument.js";
import ChordManager from "@/utils/chordManager.js";
import Storage from "@/utils/storage.js";
import { Project } from "@/utils/project";
import HotKey from "@/utils/hotKey";
import { NodeEventList } from "@/utils/elementEvent";

export default {
  name: "SheetEditorPc",
  components: {
    Svg,
    ToolChord,
    PanelChordSelector,
    Chord,
    AntaresSheet,
    KeySelector,
    CapoSelector,
    DraggablePanel,
    InstrumentSimulatorKeyboard,
    Focusable,
    "AudioPlayer": defineAsyncComponent(() => import('./audioPlayer.vue'))
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
      layout: {
        toolWidthPercentage: 20,
        audioPlayerHeight: 180,
        showAudioPlayer: false
      },
      editor: new SheetEditor(),
      pid: null,
      toolChord: {
        showPanel: false,
        attachedChords: [],
      },
      editorMode: null,
      player: {
        instrument: "Oscillator",
        bpm: 120,
        stum: true,
        capo: 0
      },
      keyboard: {
        isFocused: false,
        isFolded: true,
      },
      contextMenu: {
        show: false,
        node: null,
        style: {
          left: 0,
          top: 0,
        },
        enableEditContent: false,
        enableAddUnderline: false,
        enableRemoveUnderline: false,
        enableRecoverChord: false,
        enableSwitchChordType: false,
        insertMenu: [
          { svgName: "marker", type: "mark", tip: "插入标记" },
          { svgName: "space", type: "space", tip: "插入空格" },
          { svgName: "enter", type: "newline", tip: "插入换行" },
          { svgName: "text", type: "text", tip: "插入文本" },
        ],
        tip: {
          show: false,
          content: ""
        }
      },
      dragChord: new DragChordInfo(),
      rawSheetPanel: {
        show: false,
        data: "",
        isValid: true,
      },
      helpPanel: {
        show: false,
      },
      isTyping: false,
      ukulelePlayer: new StringInstrument("Ukulele", "Ukulele"),
      oscillatorPlayer: new StringInstrument("Ukulele", "Oscillator")
    };
  },
  computed: {
    nodeEventList() {
      return this.editorMode ? this.editorMode.nodeEventList : new NodeEventList()
    },
    mutePlayerHotkey() {
      return !this.layout.showAudioPlayer || this.rawSheetPanel.show || this.isTyping;
    },
    muteEditorModeHotkey() {
      return this.rawSheetPanel.show || this.isTyping;
    },
    muteKeyboardHotKey() {
      return this.rawSheetPanel.show || this.isTyping || !this.keyboard.isFocused || this.keyboard.isFolded;
    }
  },
  created() {
  },
  mounted() {

    let modeBasic = new EditorModeBasic(this.editor)
    let modeDrag = new EditorModeDrag(this.dragChord, this.$refs.dragMark, this.editor)
    let modeProgression = new EditorModeProgression(this.editor)
    let editorMode = new EditorModeCombined([modeBasic, modeDrag, modeProgression])

    // context
    editorMode.nodeEventList.text.contentMenus.push(this.openContext.bind(this))
    editorMode.nodeEventList.chord.contentMenus.push(this.openContext.bind(this))
    editorMode.nodeEventList.mark.contentMenus.push(this.openContext.bind(this))
    editorMode.nodeEventList.newline.contentMenus.push(this.openContext.bind(this))
    
    // play chord
    editorMode.nodeEventList.chord.mouseDowns.push((e, node) => this.playChord(ChordManager.getChord(node.chord)))

    editorMode.hook()
    if (editorMode.toolChordEvents)
      this.toolChord.events = editorMode.toolChordEvents

    this.editorMode = editorMode

    loadSheetFromUrlParam().then(res => {
      let [sheetSource, sheetData, pid] = res
      this.sheetSource = sheetSource
      this.pid = pid
      this.loadSheet(sheetData)
    })

    let that = this
    startRepeatTimeout(() => {
      that._saveSheet()
    }, 5000)

    document.addEventListener("click", () => this.closeContext());
    HotKey.addKeyDownListener("KeyS", (e) => {
      this.saveSheet()
      e.preventDefault()
    }, true, false, false)
  },
  methods: {
    clearSheet() {
      if (!confirm("是否清空曲谱？"))
        return

      this.editor.meta.reset()

      this.editor.pauseHistory()
      this.editor.clearSheet()

      // 初始文本
      NodeUtils.append(this.editor.root, NodeUtils.createTextNodes("歌词"))
      NodeUtils.append(this.editor.root, NodeUtils.createNewLineNode())
      this.editor.resumeHistory(true)

      this.toolChord.attachedChords = []
    },
    loadSheet(sheetText) {
      let [meta, root] = parseSheet(sheetText)
      validateTree(root)
      NodeUtils.normalizeSheetTree(root);
      if (!root) {
        throw "曲谱解析失败！";
      }
      this.editor.meta = meta
      this.editor.replaceSheet(root, true)

      this.toolChord.attachedChords = this.editor.meta.chords ? this.editor.meta.chords.map((chordName) =>
        ChordManager.getChord(chordName)
      ) : [];
      console.log("已加载曲谱：", meta, root);
    },
    openPanelChord() {
      this.showChordPanel = true;
    },
    openContext(e, node) {
      this.closeContext()
      e.preventDefault();
      this.contextMenu.show = true;
      this.contextMenu.node = node;
      this.contextMenu.style.left = `${e.clientX}px`;
      this.contextMenu.style.top = `${e.clientY}px`;

      let isChord = node && node.isChord();
      let isNewLine = node && node.isNewLine();
      this.contextMenu.enableEditContent = !isNewLine;
      this.contextMenu.enableAddUnderline = isChord;
      this.contextMenu.enableRemoveUnderline = isChord && NodeUtils.hasUnderlineToNextChord(node);
      this.contextMenu.enableRecoverChord = isChord;
      this.contextMenu.enableSwitchChordType = isChord;
    },
    closeContext() {
      this.contextMenu.show = false;
    },
    beginTyping() {
      this.isTyping = true
    },
    endTyping() {
      this.isTyping = false
    },
    playChord(chord) {
      let volume = 0.3;
      let duration = this.player.stum ? 0 : (1 / this.player.bpm) * 60 * 4;
      let player = null;
      switch (this.player.instrument) {
        case "Oscillator":
          player = this.oscillatorPlayer;
          break;
        case "Ukulele":
          player = this.ukulelePlayer;
          break;
        default:
          throw "未知错误";
      }
      const capo = parseInt(this.player.capo) ?? 0
      player.setCapo(capo);
      player.playChord(chord, volume, duration);
    },
    editContent(node = null) {
      node = node ?? this.contextMenu.node;

      if (!node) throw "节点为空"

      let newContent = prompt("编辑内容", node.content);
      if (!newContent) return;
      this.editor.updateContent(node, newContent)
      validateTree(this.editor.root)
    },
    editRemove(node = null) {
      node = node ?? this.contextMenu.node;
      this.editor.remove(node);
    },
    editRemoveUnderline(node = null) {
      node = node ?? this.contextMenu.node;
      this.editor.removeUnderlineOnChord(node);
      validateTree(this.editor.root)
    },
    editRecoverChord(node = null) {
      node = node ?? this.contextMenu.node;
      this.editor.convertChordToText(node);
    },
    editSwitchChordType(node = null) {
      node = node ?? this.contextMenu.node;
      this.editor.switchChordType(node)
    },
    editAddUnderline(node = null) {
      node = node ?? this.contextMenu.node;
      this.editor.addUnderlineForChord(node);
    },
    onChangeSheetKey(e) {
      let oldKey = this.editor.meta.sheetKey
      let newKey = e.currentTarget.value
      if (newKey == oldKey) return;
      let confirmed = confirm("你修改了曲谱调式，是否将和弦一起转调？")
      if (!confirmed) return
      this.editor.shiftKey(newKey)

      for (let i in this.toolChord.attachedChords) {
        let chordName = this.toolChord.attachedChords[i].name
        let newChordName = ChordManager.shiftKey(chordName, oldKey, newKey);
        this.toolChord.attachedChords[i] = ChordManager.getChord(newChordName)
      }
    },
    onToolChordDragStart(e, node) {
      if (this.editorMode) {
        this.editorMode.toolChordEvents.trigger(e, node)
      }
    },  
    openRawSheetPanel() {
      this.rawSheetPanel.data = this.editor.toText([], true)
      this.rawSheetPanel.show = true
    },
    confirmRawSheet() {
      if (!confirm("是否确认修改？将会覆盖原本的曲谱")) return;

      let [meta, root] = parseSheet(this.rawSheetPanel.data)
      NodeUtils.normalizeSheetTree(root);
      validateTree(root);
      this.editor.replaceSheet(root)
      this.rawSheetPanel.show = false
    },
    saveSheetToFile() {
      // TODO: remove un used chord?
      let fileData = this.editor.toText(this.toolChord.attachedChords.map(n => n.name))
      let time = new Date().toLocaleDateString().replace(/\//g, "_")

      let blob = new Blob([fileData], { type: 'text/plain' })
      let download = document.createElement("a");
      download.href = window.URL.createObjectURL(blob)
      download.setAttribute('download', `${this.editor.meta.title}-${this.editor.meta.singer}-${time}.atrs`)
      download.click()
      download.remove()
    },
    loadSheetFromFile() {
      let input = document.createElement('input');
      input.type = 'file';
      input.accept = ".atrs"
      input.onchange = e => {
        if (!confirm("确定：导入当前项目\n取消：单独作为新项目")) {
          this.sheetSource = ESheetSource.FILE
          this.pid = null
        }

        let file = e.target.files[0];
        let fileReader = new FileReader()
        fileReader.onload = () => this.loadSheet(fileReader.result)
        fileReader.readAsText(file)
      }
      input.click();
      input.remove()
    },
    saveSheet() {
      if (this._saveSheet())
        this.$toast("曲谱已保存~")
      else
        this.$toast("曲谱保存失败...本曲谱并非你的项目，或保存过程中遇到其他错误")
    },
    _saveSheet() {
      if (this.sheetSource == ESheetSource.PROJECT) {
        Project.update(this.pid, this.editor.meta, this.editor.root, this.toolChord.attachedChords.map(n => n.name))
        console.log("曲谱已保存")
        return true
      }
      else {
        console.log("警告：并非项目，无法保存")
        return false
      }
    },
    insertNode(type, insertBefore) {
      this.editor.insertNode(this.contextMenu.node, type, insertBefore)
    },
    onContextButtonMouseEnter(tip) {
      this.contextMenu.tip.show = true
      this.contextMenu.tip.content = tip
    },
    onContextButtonMouseLeave() {
      this.contextMenu.tip.show = false
    },
  },
  watch: {
    "layout.toolWidthPercentage": function () {
      this.layout.toolWidthPercentage = Math.min(
        70,
        Math.max(10, this.layout.toolWidthPercentage)
      );
    },
    "toolChord.attachedChords": function () {
      this.editor.meta.chords = this.toolChord.attachedChords.map(chord => chord.name)
    },
    "rawSheetPanel.data": function () {
      console.log("changed", this.rawSheetPanel.data)
      if (!this.rawSheetPanel.show) return;
      this.rawSheetPanel.isValid = false
      try {
        let [meta, root] = parseSheet(this.rawSheetPanel.data)
        NodeUtils.normalizeSheetTree(root);
        validateTree(root);
        this.rawSheetPanel.isValid = true
      }
      catch { }
    },
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
  color: var(--foreground-color);

  &:focus {
    outline: 2% solid var(--theme-color);
  }

  &::placeholder {
    color: rgb(192, 106, 106);
  }
}

.select {
  height: 100%;
  margin: 0 10px;
  background-color: transparent;
  color: var(--foreground-color);
  font-size: var(--base-font-size);
  border: none;
  outline: 2px solid grey;

  option {
    background-color: black;
  }

  option:checked {
    background-color: grey;
  }
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

  &::before {
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

  &:checked {
    background: #e9266a33;
  }

  &:checked::before {
    left: calc(100% - var(--ball-size) - var(--margin-size));
    background: var(--theme-color);
  }

  &:focus {
    outline: none;
  }
}

.editor {
  width: 100%;
  height: 100%;
  display: flex;
}

#layout_slider {
  position: fixed;
  width: calc(100% + 14px);
  height: 14px;
  top: 0;
  left: -7px;

  appearance: none;
  background-color: transparent;

  z-index: 2;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: none;
    background: var(--theme-color);
  }
}

#sheet_block {
  box-sizing: border-box;
  padding: 20px;
  display: flex;
  flex-direction: column;

  &>* {
    flex-shrink: 0;
  }

  #sheet_padding {
    height: 50vh;
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

  #sheet_capo_block {
    display: flex;
    line-height: var(--title-base-font-size);
    font-size: calc(var(--title-base-font-size) * 0.9);
    color: #888;
  }

  #capo_selector {
    margin: 0 10px;
    background-color: transparent;
    font-size: calc(var(--title-base-font-size) * 0.8);
    border: none;
    outline: 2px solid grey;
  }

  #sheet_by {
    margin-top: 5px;
    height: calc(var(--title-base-font-size) * 0.8);
    line-height: calc(var(--title-base-font-size) * 0.8);
    font-size: calc(var(--title-base-font-size) * 0.7);
    color: rgb(156, 156, 156);
  }

  #edit_raw_sheet_button {
    background: var(--sheet-theme-color);
    color: white;
  }

  #sheet_box {
    width: 100%;
    margin-top: 10px;
    font-size: var(--base-font-size);
  }
}

#clear_sheet_button {
  background: var(--sheet-theme-color);
  color: white;
}

.context {
  position: fixed;
  display: flex;
  user-select: none;
  z-index: 20;
}

#editor_context {
  z-index: 21;
  width: 140px;
  flex-direction: column;

  #editor_context_menu {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
    background: rgb(49, 100, 88, 0.9);
  }

  #editor_context_tip {
    left: 50%;
    bottom: -40px;
    transform: translateX(-50%);
    position: absolute;
    padding: 10px;
    font-size: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    white-space: nowrap;

    border-radius: 10px;
    background: rgb(49, 100, 88, 0.9);
  }
}

.context_menu_item {
  position: relative;
  color: white;
  padding: 5%;
  transition: all 0.2s ease-out;
  border-radius: 10px;

  display: flex;
  justify-content: flex-start;
  align-items: center;
  white-space: nowrap;

  .context_icon {
    margin: 5px;
    height: 20px;
    width: 20px;
    fill: white;
    transition: fill 0.1s ease-out;
  }
}

.context_menu_button {
  cursor: pointer;

  &:hover {
    fill: var(--theme-color); // for svg icon
    text-decoration: underline; // for text
  }
}

.panel {
  z-index: 30;

  position: fixed;
  height: 100%;
  width: 100%;
  left: 0;
  top: 0;
}

#raw_sheet_panel {
  #raw_sheet_container {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.8);
  }

  #raw_sheet_title {
    font-size: 20px;
    padding: 20px 0;
    color: white;
  }

  #raw_sheet_textarea {
    font-family: inherit;
    color: black;
    font-size: var(--base-font-size);
    height: 60%;
    width: 60%;
  }

  #raw_sheet_button_confirm {
    background: var(--sheet-theme-color);
    color: white;
  }

  #raw_sheet_button_cancel {
    background: grey;
    color: white;
  }
}

#drag_mark {
  position: fixed;
  pointer-events: none;

  padding: 5px 10px;
  border: 2px rgb(17, 83, 58) solid;
  border-radius: 5px;
  background-color: rgb(39, 124, 92);
  color: white;

  z-index: 20;
}

#drop_hint_panel {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 20;
  display: none;

  #drop_hint_text {
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);

    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 100px;
    color: var(--theme-color);
    user-select: none;
  }
}

#help_button {
  position: absolute;
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

  &:hover {
    opacity: 1;
  }
}

#help_panel {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  white-space: pre;
}

#playerOpenTag {
  position: absolute;
  z-index: 30;
  left: 0;
  top: -30px;
  height: 30px;
  padding: 0 5px;
  user-select: none;
  cursor: pointer;
  background-color: var(--sheet-theme-color);
  color: white;
  opacity: 0.5;
  transition: opacity 0.2s ease-out;

  &:hover {
    opacity: 1.0;
  }
}

#tools_block {
  position: relative;
  width: 20%;
  height: 100%;

  box-sizing: border-box;
  outline: 2px black solid;

  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
  flex-shrink: 0;
  flex-shrink: 0;

  z-index: 1;

  #chord_tool {
    width: 100%;
    overflow-y: auto;
  }
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
  box-shadow: 0 0 5px 2px rgba(0, 0, 0, 0.3);
}

:deep(chord-ruby::before),
:deep(chord-pure::before) {
  content: "";
  position: absolute;
  font-size: 20px;
  color: black;
  transform: translate(-50%, -50%);
  top: 50%;
  left: 50%;
  opacity: 0;
  transition: all 0.2s ease-out;
}

:deep(text) {
  position: relative;
}

:deep(text::after) {
  content: "";
  position: absolute;
  left: -4px;
  top: -2px;
  right: -4px;
  bottom: -2px;
  border: 2px solid transparent;
  transition: 0.3s ease-out;
  border-radius: 5px;
  z-index: 1;
  pointer-events: none;
}

:deep(text:hover::after) {
  border: 2px solid var(--sheet-theme-color);
  box-shadow: 0 0 5px 2px rgba(0, 0, 0, 0.3);
}

:deep(newline) {
  transition: color 0.1s ease-out;
}

:deep(newline:hover) {
  color: var(--sheet-theme-color);
  font-weight: bold;
}
</style>

<style scoped>
.trans_fade-enter-active,
.trans_fade-leave-active {
  transition: opacity 0.3s ease-out;
}

.trans_fade-enter-from,
.trans_fade-leave-to {
  opacity: 0;
}
</style>
