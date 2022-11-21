<template>
  <div class="editor" :style="globalCssVar">
    <div class="flex_center fill" style="flex-direction: column;">
      <div class="flex_center fill" :style="`height: ${layout.showAudioPlayer ? ('calc(100% - ' + layout.audioPlayerHeight + 'px)') : '100%'}; position: relative;`">
        <div id="help_button">?</div>
        <div id="tools_block" :style="`width: ${layout.toolWidthPercentage}%;`">
          <div id="tools_title" class="title flex_center">工具栏</div>
          <ToolChord id="chord_tool" v-model:chords="toolChord.attachedChords" v-on="toolChord.events" />
          <div class="button" @click="this.toolChord.showPanel = true">
            编辑和弦
          </div>
          <div id="clear_sheet_button" class="button" @click="clearSheet">
            清空曲谱
          </div>
        </div>
        <div class="fill" style="display: flex; justify-content: center; overflow: auto;">
          <div
            id="sheet_block"
            :style="`width: ${100 - layout.toolWidthPercentage}%`"
          >
            <input
              type="text"
              id="song_title_input"
              class="input"
              placeholder="在此处输入歌名"
              v-model="sheetInfo.title"
              @focus="beginTyping"
              @blur="endTyping"
            />
            <input
              type="text"
              id="song_singer_input"
              class="input"
              placeholder="在此处输入歌手"
              v-model="sheetInfo.singer"
              @focus="beginTyping"
              @blur="endTyping"
            />
            <div id="sheet_key_block">
              <div class="title">原调</div>
              <KeySelector class="select" v-model:value="sheetInfo.originalKey" />
              <div class="title">选调</div>
              <KeySelector class="select" :value="sheetInfo.sheetKey" @change="onChangeSheetKey" />
              <div id="sheet_capo_block">
                <div class="title">变调夹</div>
                <CapoSelector id="capo_selector" v-model:value="player.capo"/>
              </div>
            </div>
            <div id="sheet_by" class="title">制谱 锦瑟</div>
            <div class="flex_center">
              <div id="edit_raw_lyric_button" class="button" @click="openRawLyricPanel">编辑歌词</div>
              <div class="button" @click="saveSheetToFile">保存</div>
              <div class="button" @click="loadSheetFromFile">载入</div>
            </div>
            <AntaresSheet
              id="sheet_box"
              :sheet-tree="sheetInfo.sheetTree"
              :events="editorMode.componentEvents"
            />
            <div id="sheet_padding"></div>
          </div>
        </div>
      </div>
      <div class="flex_center fill" :style="`height: ${layout.showAudioPlayer ? layout.audioPlayerHeight : '0'}px; position: relative;`">
        <div class="flex_center" v-show="!layout.showAudioPlayer" id="playerOpenTag" @click="layout.showAudioPlayer = true">打开音乐播放器</div>
        <AudioPlayer v-show="layout.showAudioPlayer" @close="layout.showAudioPlayer = false" :mute-hotkey="mutePlayerHotkey"/>
      </div>
    </div>

    <input type="range" id="layout_slider" min="0" max="100" step="0.1" v-model="layout.toolWidthPercentage"/>

    <div id="editor_context" class="context" v-show="contextMenu.show" :style="contextMenu.style" 
      @click.stop="contextMenu.show = false"
    >
      <div id="editor_context_menu">
        <div class="context_menu_item">
          <Svg v-for="item in contextMenu.insertMenu" :key="item.type" :src="`/icons/${item.svgName}.svg`" class="context_icon context_menu_button" 
            @click="insertNode(item.type, true)" 
            @mouseenter="onContextButtonMouseEnter('在左侧' + item.tip)"
            @mouseleave="onContextButtonMouseLeave()"
          />
        </div>
        <div class="context_menu_item">
          <Svg v-for="item in contextMenu.insertMenu" :key="item.type" :src="`/icons/${item.svgName}.svg`" class="context_icon context_menu_button" 
            @click="insertNode(item.type, false)" 
            @mouseenter="onContextButtonMouseEnter('在右侧' + item.tip)"
            @mouseleave="onContextButtonMouseLeave()"
          />
        </div>
        <div class="context_menu_item" @click="editContent()" v-show="contextMenu.enableEditContent">
          <Svg src="/icons/edit.svg" class="context_icon context_menu_button" 
            @mouseenter="onContextButtonMouseEnter('编辑内容')"
            @mouseleave="onContextButtonMouseLeave()"
          />
        </div>
        <div class="context_menu_item" @click="editRemove()">
          <Svg src="/icons/trash.svg" class="context_icon context_menu_button" 
            @mouseenter="onContextButtonMouseEnter('删除')"
            @mouseleave="onContextButtonMouseLeave()"
          />
        </div>
        <div class="context_menu_item" v-show="contextMenu.enableAddUnderline || contextMenu.enableRemoveUnderline">
          下划线
          <Svg src="/icons/add.svg" class="context_icon context_menu_button" @click="editAddUnderline()" v-show="contextMenu.enableAddUnderline" 
            @mouseenter="onContextButtonMouseEnter('添加下划线')"
            @mouseleave="onContextButtonMouseLeave()"
          />
          <Svg src="/icons/trash.svg" class="context_icon context_menu_button" @click="editRemoveUnderline()" v-show="contextMenu.enableRemoveUnderline"
            @mouseenter="onContextButtonMouseEnter('删除下划线')"
            @mouseleave="onContextButtonMouseLeave()"
          />
        </div>
        <div class="context_menu_item" v-show="contextMenu.enableRecoverChord">
          和弦
          <Svg src="/icons/recover.svg" class="context_icon context_menu_button" @click="editRecoverChord()" v-show="contextMenu.enableRecoverChord" 
            @mouseenter="onContextButtonMouseEnter('将和弦恢复成文本')"
            @mouseleave="onContextButtonMouseLeave()"
          />
          <Svg src="/icons/switch.svg" class="context_icon context_menu_button" @click="editSwitchChordType()" v-show="contextMenu.enableSwitchChordType" 
            @mouseenter="onContextButtonMouseEnter('切换和弦类别')"
            @mouseleave="onContextButtonMouseLeave()"
          />
        </div>
      </div>
      <Transition name="trans_fade">
        <div id="editor_context_tip" v-show="contextMenu.tip.show" key="editor_context_tipxxx">
          {{contextMenu.tip.content}}
        </div>
      </Transition>
      
    </div>

    <div id="drag_mark" v-show="dragChord.isDragging" ref="dragMark">{{dragChord.text}}</div>
    <div id="temp_tip" @click="$toast('wow', 3)">{{editorMode.tip}}</div>
    <div id="raw_lyric_panel" class="panel" v-if="rawLyricPanel.show">
      <div id="raw_lyric_container">
        <div id="raw_lyric_title">在下方输入歌词</div>
        <textarea id="raw_lyric_textarea" v-model="rawLyricPanel.lyrics"></textarea>
        <div style="display: flex">
          <div id="raw_lyric_button_confirm" class="button" @click="confirmLyric">确认歌词</div>
          <div id="raw_lyric_button_cancel" class="button" @click="rawLyricPanel.show = false">取消</div>
        </div>
      </div>
    </div>
    <PanelChordSelector
      id="chord_panel"
      class="panel"
      v-model:attachedChords="toolChord.attachedChords"
      v-model:show="toolChord.showPanel"
      :tonic="sheetInfo.sheetKey"
    />
    <div id="drop_hint_panel">
      <div id="drop_hint_text">拖拽文件加载</div>
    </div>
  </div>
</template>

<script>
import AntaresSheet from "@/components/antaresSheet/index.vue";
import KeySelector from "@/components/keySelector.vue";
import ToolChord from "./toolChord.vue";
import PanelChordSelector from "./panelChordSelector.vue";
import Chord from "@/components/chord/index.vue";
import CapoSelector from "@/components/capoSelector.vue";
import Svg from "@/components/svg.vue";

import { reactive, defineAsyncComponent } from "vue";
import { getQueryVariable, startRepeatTimeout } from "@/utils/common.js";
import { get } from "@/utils/request.js";

import { ENodeType, traverseNode } from "@/utils/sheetNode.js";
import { parseSheet } from "@/utils/sheetParser.js";
import { toSheetFileString } from "@/utils/sheetWriter.js";
import { Editor, EditorAction } from "./editor.js";
import EditorModeBasic from './editorModeBasic.js'
import EditorModeDrag from './editorModeDrag.js'
import EditorModeProgression from './editorModeProgression.js'
import { mergeEditorModeArray } from "./editorModeCommon.js";

import Instrument from "@/utils/instrument.js";
import ChordManager from "@/utils/chordManager.js";
import Storage from "@/utils/storage.js";

let g_UkulelePlayer = new Instrument("Ukulele", "Ukulele");
let g_OscillatorPlayer = new Instrument("Ukulele", "Oscillator");
const g_EditorMode = mergeEditorModeArray([EditorModeBasic, EditorModeDrag, EditorModeProgression],  `【组合编辑模式】详细操作见其他模式的介绍`)

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
    "AudioPlayer" : defineAsyncComponent(() => import('./audioPlayer.vue'))
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
      sheetInfo: {
        title: "加载中",
        singer: "",
        by: "",
        originalKey: "C",
        sheetKey: "C",
        chords: [],
        rhythms: [],
        originalSheetKey: "C",
        sheetTree: Editor.createRootNode(),
      },
      toolChord: {
        showPanel: false,
        attachedChords: [],
        events: {}
      },
      editorMode: g_EditorMode,
      player: {
        instrument: "Oscillator",
        bpm: 120,
        stum: true,
        capo: 0
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
          { svgName: "marker", type: "mark", tip: "插入标记"},
          { svgName: "space", type: "space", tip: "插入空格"},
          { svgName: "enter", type: "newline", tip: "插入换行"},
          { svgName: "text", type: "text", tip: "插入文本"},
        ],
        tip: {
          show: false,
          content: ""
        }
      },
      dragChord: {
        isDragging: false,
        text: '',
      },
      rawLyricPanel: {
        show: false,
        lyrics: "",
      },
      isTyping: false
    };
  },
  computed: {
    mutePlayerHotkey() {
      return !this.layout.showAudioPlayer || this.rawLyricPanel.show || this.isTyping;
    },
    muteEditorModeHotkey() {
      return this.rawLyricPanel.show || this.isTyping;
    },
  },
  created() {
    this.editorMode.init(this)
    if (this.editorMode.toolChordEvents)
      this.toolChord.events = this.editorMode.toolChordEvents
  },
  mounted() {
    let that = this

    let storageSheet = Storage.load("tempSheet")
    if (!storageSheet) {
      console.log("从文件加载曲谱...");
      let sheetName = getQueryVariable("sheet");
      get(`sheets/${sheetName}.sheet`)
        .then((res) => {
          that.loadSheet(res)
        })
        .catch((e) => {
          console.error("加载失败", e);
        });
    }
    else {
      console.log("从上次会话加载曲谱...");
      that.loadSheet(storageSheet)
    }
    
    document.addEventListener("click", () => this.closeContext());

    function saveSheetToStorage() {
      let data = that.getSheetRaw()
      Storage.save("tempSheet", data)
    }
    startRepeatTimeout(()=>{
      console.log("Save sheet...")
      saveSheetToStorage()
    }, 5000)
  },
  methods: {
    clearSheet() {
      if (!confirm("是否清空曲谱？（无法撤销！）"))
        return

      this.sheetInfo.title = "请输入歌名"
      this.sheetInfo.singer = "请输入歌手"
      this.sheetInfo.by = "锦瑟"
      this.sheetInfo.originalKey = "C"
      this.sheetInfo.sheetKey = "C"
      this.sheetInfo.chords = []
      this.sheetInfo.rhythms = []
      this.sheetInfo.originalSheetKey = "C"
      this.sheetInfo.sheetTree = Editor.createRootNode()

      // 初始文本
      Editor.append(this.sheetInfo.sheetTree, Editor.createTextNodes("歌词"))
      Editor.append(this.sheetInfo.sheetTree, Editor.createNewLineNode())
    },
    loadSheet(sheetText) {
      let rootNode = reactive(parseSheet(sheetText));
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

      this.toolChord.attachedChords = this.sheetInfo.chords ? this.sheetInfo.chords.map((chordName) =>
        ChordManager.getChord(chordName)
      ) : [];
      console.log("加载曲谱：", this.sheetInfo, rootNode);
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

      let isChord = Editor.isChord(node);
      let isNewLine = Editor.isNewLine(node);
      this.contextMenu.enableEditContent = !isNewLine;
      this.contextMenu.enableAddUnderline = isChord;
      this.contextMenu.enableRemoveUnderline = isChord && Editor.hasUnderlineToNextChord(node);
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
          player = g_OscillatorPlayer;
          break;
        case "Ukulele":
          player = g_UkulelePlayer;
          break;
        default:
          throw "未知错误";
      }
      const capo = parseInt(this.player.capo) ?? 0
      player.setCapo(capo);
      player.playChord(chord, volume, duration);
    },
    shiftKey(oldKey, newKey) {
      traverseNode(this.sheetInfo.sheetTree, (node) => {
        if (Editor.isChord(node)) {
          node.chord = ChordManager.shiftKey(node.chord, oldKey, newKey);
        }
      });

      for (let i in this.toolChord.attachedChords) {
        let chordName = this.toolChord.attachedChords[i].name
        let newChordName = ChordManager.shiftKey(chordName, oldKey, newKey);
        this.toolChord.attachedChords[i] = ChordManager.getChord(newChordName)
      }
    },
    editContent(node = null) {
      node = node ?? this.contextMenu.node;
      EditorAction.editContent(node)
    },
    editRemove(node = null) {
      node = node ?? this.contextMenu.node;
      EditorAction.remove(node);
    },
    editRemoveUnderline(node = null) {
      node = node ?? this.contextMenu.node;
      EditorAction.removeUnderlineOfChord(node);
    },
    editRecoverChord(node = null) {
      node = node ?? this.contextMenu.node;
      EditorAction.convertToText(node);
    },
    editSwitchChordType(node = null) {
      node = node ?? this.contextMenu.node;
      if (node.type == ENodeType.Chord) { // 标注和弦转纯和弦
        // 如果没有下划线，直接转换
        if (!Editor.isInUnderline(node)) node.type = ENodeType.ChordPure
        else {
          // 获取最顶层的下划线
          let cur = node
          let topUnderline = null
          while (cur) {
            if (Editor.isUnderline(cur)) topUnderline = cur;
            cur = cur.parent
          }

          // 检查是否有非空文本存在
          let hasNonEmptyTextNode = false
          Editor.traverseDFS(topUnderline, (n) => {
            if (n.type == ENodeType.Text && n.content != " ")
              hasNonEmptyTextNode = true;
          })

          // 如果有非空文本，则不能整体转为纯和弦，断开所有下划线并独立转为纯和弦
          // TODO: 是否加一个选项让用户选择？
          if (hasNonEmptyTextNode) {
            EditorAction.removeAllUnderlineOnChord(node)
            node.type = ENodeType.ChordPure
          }
          else { // 否则，underline转underlinepure，chord转chordpure
            Editor.traverseDFS(topUnderline, (n) => {
              if (n.type == ENodeType.Chord)
                n.type = ENodeType.ChordPure;
              if (n.type == ENodeType.Underline)
                n.type = ENodeType.UnderlinePure;
            })
          }
        }
        
      }
      else if (node.type == ENodeType.ChordPure) {
        // 如果没有下划线，直接转换
        if (!Editor.isInUnderline(node)) node.type = ENodeType.Chord
        else { // 否则整体转换
          // 获取最顶层的下划线
          let cur = node
          let topUnderline = null
          while (cur) {
            if (Editor.isUnderline(cur)) topUnderline = cur;
            cur = cur.parent
          }

          Editor.traverseDFS(topUnderline, (n) => {
            if (n.type == ENodeType.ChordPure)
              n.type = ENodeType.Chord;
            if (n.type == ENodeType.UnderlinePure)
              n.type = ENodeType.Underline;
          })
        }
        
      }
      else throw "节点类型错误"
    },
    editAddUnderline(node = null) {
      node = node ?? this.contextMenu.node;
      EditorAction.addUnderlineForChord(node);
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
    openRawLyricPanel() {
      this.rawLyricPanel.lyrics = Editor.toString(this.sheetInfo.sheetTree, true)
      this.rawLyricPanel.show = true
    },
    confirmLyric() {
      if (!confirm("是否确认覆盖歌词？此前制作的和弦将全部被删除！！")) return;

      let root = Editor.createRootNode()
      Editor.append(root, Editor.createTextNodes(this.rawLyricPanel.lyrics))
      this.sheetInfo.sheetTree = root
      this.rawLyricPanel.show = false
    },
    getSheetRaw() {
      return toSheetFileString(
        this.sheetInfo.sheetTree,
        this.sheetInfo.title,
        this.sheetInfo.singer,
        this.sheetInfo.by,
        this.sheetInfo.originalKey,
        this.sheetInfo.sheetKey,
        this.toolChord.attachedChords.map(n => n.name),
      )
    },
    saveSheetToFile() {
      // TODO: remove un used chord?
      let fileData = this.getSheetRaw()
      let time = new Date().toLocaleDateString().replace(/\//g, "_")
    
      let blob = new Blob([fileData], {type: 'text/plain'})
      let download = document.createElement("a");
      download.href = window.URL.createObjectURL(blob)
      download.setAttribute('download', `${this.sheetInfo.title}-${this.sheetInfo.singer}-${time}.sheetEdit`)
      download.click()
      download.remove()
    },
    loadSheetFromFile() {
      let input = document.createElement('input');
      input.type = 'file';
      input.accept = ".sheet,.sheetEdit"
      input.onchange = e => { 
        let file = e.target.files[0]; 
        let fileReader = new FileReader()
        fileReader.onload = ()=> this.loadSheet(fileReader.result)
        fileReader.readAsText(file)
      }
      input.click();
      input.remove()
    },
    insertNode(type, isOnLeft) {
      // init node
      let nodes = null
      switch(type) {
        case "text": {
          let text = prompt("插入文本", "请输入文本")
          if (!text) return;
          nodes = Editor.createTextNodes(text)
          break
        }
        case "space": {
          nodes = Editor.createTextNodes(" ")
          break
        }
        case "mark": {
          let text = prompt("插入标记", "请输入标记内容")
          if (!text) return;
          nodes = Editor.createMarkNode(text)
          break
        }
        case "newline": {
          nodes = Editor.createNewLineNode()
          break
        }
        default: {
          throw "插入节点类型有误：" + type
        }
      }

      // insert
      if (isOnLeft)
        Editor.insertBefore(this.contextMenu.node, nodes)
      else
        Editor.insertAfter(this.contextMenu.node, nodes)
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
    "toolChord.attachedChords": function() {
      this.sheetInfo.chords = this.toolChord.attachedChords.map(chord => chord.name)
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

  &>*{
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

  #edit_raw_lyric_button {
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

#raw_lyric_panel {
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
    font-size: 20px;
    padding: 20px 0;
    color: white;
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
    color: white;
  }
  #raw_lyric_button_cancel {
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

#temp_tip {
  position: absolute;
  z-index: 10;
  max-width: 30%;
  min-height: 40px;
  top: 20px;
  right: 20px;
  padding: 10px 20px;

  background-color: rgba(37, 160, 143, 0.5);
  border-radius: 20px;
  overflow: hidden;
  white-space: pre-wrap;

  opacity: 0.6;
  transition: opacity 0.2s ease-out;
  &:hover {
    opacity: 1.0;
  }
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

#playerOpenTag {
  position: absolute;
  z-index: 10000;
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
  flex-shrink: 0;flex-shrink: 0;

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
