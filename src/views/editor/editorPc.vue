<template>
  <div class="editor" :env="getEnv()" :style="globalCssVar">
    <input
      type="range"
      id="layout_slider"
      min="0"
      max="100"
      v-model="layout.toolWidthPercentage"
      step="0.1"
    />
    <div class="flex_center fill" style="flex-direction: column;">
      <div class="flex_center fill" :style="`height: ${layout.showAudioPlayer ? '80' : '100'}%; position: relative;`">
        <div id="help_button">?</div>
        <div id="tools_block" :style="`width: ${layout.toolWidthPercentage}%;`">
          <div id="tools_title" class="title flex_center">工具栏</div>
          <ToolChord id="chord_tool" v-model:chords="attachedChords" @dragStart="onChordDragStart" />
          <div id="chord_tool_edit_button" class="button" @click="openPanelChord">
            编辑和弦
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
              <WebKeySelector class="select" v-model:value="sheetInfo.originalKey" />
              <div class="title">选调</div>
              <WebKeySelector class="select" :value="sheetInfo.sheetKey" @change="onChangeSheetKey" />
            </div>
            <div id="sheet_by" class="title">制谱 锦瑟</div>
            <div class="flex_center">
              <div id="edit_raw_lyric_button" class="button" @click="openRawLyricPanel">编辑歌词</div>
              <div class="button" @click="saveSheetToFile">保存</div>
              <div class="button" @click="loadSheetFromFile">载入</div>
            </div>
            <WebSheet
              id="sheet_box"
              :sheet-tree="sheetInfo.sheetTree"
              :events="editorMode.componentEvents"
            />
            <div id="sheet_padding"></div>
          </div>
        </div>
      </div>
      <div class="flex_center fill" :style="`height: ${layout.showAudioPlayer ? '20' : '0'}%; position: relative;`">
        <div class="flex_center" v-show="!layout.showAudioPlayer" id="playerOpenTag" @click="layout.showAudioPlayer = true">打开音乐播放器</div>
        <AudioPlayer v-show="layout.showAudioPlayer" @close="layout.showAudioPlayer = false"/>
      </div>
    </div>

    <div
      id="editor_context"
      class="context"
      v-if="contextMenu.show"
      :style="contextMenu.style"
    >
      <div id="editor_context_menu">
        <div class="editor_context_menu_item" @click="contextMenu.insertState.showInsertPos = true">插入</div>
        <div class="editor_context_menu_item" @click="editContent()">编辑</div>
        <div class="editor_context_menu_item" @click="editRemove()">删除</div>
        <div class="editor_context_menu_item" @click="editAddUnderline()" v-show="contextMenu.enableAddUnderline">
          添加下划线
        </div>
        <div class="editor_context_menu_item" @click="editRemoveUnderline()" v-show="contextMenu.enableRemoveUnderline">
          删除下划线
        </div>
        <div class="editor_context_menu_item" @click="editRecoverChord()" v-show="contextMenu.enableRecoverChord">
          恢复和弦为文字
        </div>
      </div>
    </div>

    <div id="editor_context_insert_pos" class="context" v-if="contextMenu.insertState.showInsertPos" :style="contextMenu.style">
      <div id="editor_context_menu_insert_pos">
        <div class="editor_context_menu_item" @click="onClickInsertPos(true)">前方</div>
        <div class="editor_context_menu_item"  @click="onClickInsertPos(false)">后方</div>
      </div>
    </div>

    <div id="editor_context_insert_type" class="context" v-if="contextMenu.insertState.showInsertType" :style="contextMenu.style">
      <div id="editor_context_menu_insert_type">
        <div class="editor_context_menu_item" @click="onClickInsertMark()">标记</div>
        <div class="editor_context_menu_item" @click="onClickInsertText()">文本</div>
        <div class="editor_context_menu_item" @click="onClickInsertNewLine()">换行</div>
      </div>
    </div>

    <div id="drag_mark" v-show="dragChord.is" ref="dragMark">{{dragChord.chord ? dragChord.chord.name : '错误'}}</div>
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
      v-model:attachedChords="attachedChords"
      v-model:show="showChordPanel"
      :key="sheetInfo.sheetKey"
    />
    <div id="drop_hint_panel">
      <div id="drop_hint_text">拖拽文件加载</div>
    </div>
  </div>
</template>

<script>
import { reactive } from "vue";
import { getQueryVariable, getMouseOrTouchClient, getEnv } from "@/utils/webCommon.js";
import { WebInstrument } from "@/utils/webInstrument.js";
import WebChordManager from "@/utils/webChordManager.js";
import { SheetNode, ENodeType, traverseNode } from "@/utils/sheetNode.js";

import WebSheetParser from "@/utils/webSheetParser";
import { toSheetFileString } from "@/utils/webSheetWriter";
import WebSheet from "@/components/webSheet/index.vue";
import WebKeySelector from "@/components/keySelector.vue";
import Chord from "@/components/chord/index.vue";
import { get } from "@/utils/request.js";
import ToolChord from "./toolChord.vue";
import PanelChordSelector from "./panelChordSelector.vue";

import { defineAsyncComponent } from 'vue'
import HotKey from "@/utils/hotKey.js";

import { Editor, EditorAction } from "./editor.js";
import { setPos } from "@/utils/common.js";

let gThis = null
let g_ChordManager = new WebChordManager();
let g_UkulelePlayer = new WebInstrument("Ukulele", "Ukulele");
let g_OscillatorPlayer = new WebInstrument("Ukulele", "Oscillator");

function getInputText(tips, defaultText = "") {
  return prompt(tips, defaultText);
}

// const g_EditEventModeDrag = {
//   text: {
//     click: (e, node) => {
//       console.log("text", node);
//     },
//     dblclick: (e, node) => {
//       gThis.editContent(node);
//     },
//     contextmenu: (e, node) => gThis.openContext(e, node),
//     mouseenter: (e, node) => {
//       if (!gThis.dragChord.is) return
//       if (node == gThis.dragChord.chordNode) return
//       gThis.highlightNode(node)
//     },
//   },
//   chord: {
//     click: (e, node) => {
//       gThis.playChord(g_ChordManager.getChord(node.chord));
//     },
//     dblclick: (e, node) => {
//       gThis.editAddUnderline(node);
//     },
//     contextmenu: (e, node) => gThis.openContext(e, node),
//     mouseenter: (e, node) => {
//       if (!gThis.dragChord.is) return
//       if (node == gThis.dragChord.chordNode) return
//       gThis.highlightNode(node)
//     },
//   },
//   mark: {
//     click: (e, node) => {
//       console.log("mark", node);
//     },
//     dblclick: (e, node) => {
//       gThis.editContent(node);
//     },
//     contextmenu: (e, node) => gThis.openContext(e, node),
//   },
//   newline: {
//     contextmenu: (e, node) => gThis.openContext(e, node),
//   },

//   tip: `双击可以编辑文字/添加下划线\n按住Ctrl可以复制和弦\n按住Shift可以移动和弦\n拖入保存的文件可以直接加载`
// }

let gCurOnNode = null
const g_EditEventModeHotkey = {
  tip: `【和弦级数模式】\n鼠标移动到文字上，按下1-7键修改和弦\n重复按同一个键可切换大小调\n按下~键可移除和弦\ntab键可在前方快速添加一个空格\nshift+tab在后方添加空格`,
  componentEvents: {
    text: {
      click: (e, node) => {
        console.log("text", node);
      },
      dblclick: (e, node) => {
        gThis.editContent(node);
      },
      contextmenu: (e, node) => gThis.openContext(e, node),
      mouseenter: (e, node) => {
        gCurOnNode = node
        if (!gThis.dragChord.is) return
        if (node == gThis.dragChord.chordNode) return
        gThis.highlightNode(node)
      },
      mouseleave: () => {
        gCurOnNode = null
      }
    },
    chord: {
      click: (e, node) => {
        gThis.playChord(g_ChordManager.getChord(node.chord));
      },
      dblclick: (e, node) => {
        if (!e.shiftKey) {
          gThis.editAddUnderline(node);
        }
        else if (Editor.hasUnderlineToNextChord(node)){
          gThis.editRemoveUnderline(node);
        }
      },
      contextmenu: (e, node) => gThis.openContext(e, node),
      mouseenter: (e, node) => {
        gCurOnNode = node
        if (!gThis.dragChord.is) return
        if (node == gThis.dragChord.chordNode) return
        gThis.highlightNode(node)
      },
    },
    mark: {
      click: (e, node) => {
        console.log("mark", node);
      },
      dblclick: (e, node) => {
        gThis.editContent(node);
      },
      contextmenu: (e, node) => gThis.openContext(e, node),
    },
    newline: {
      contextmenu: (e, node) => gThis.openContext(e, node),
    },
  },
  documentEvents: {
  },
  init: function() {
    const progressionList = [
      [0, true], // distance to tonic, is major
      [2, false],
      [4, false],
      [5, true],
      [7, true],
      [9, false],
      [11, false],
    ]

    // 按下1-7应用对应级数的和弦
    progressionList.forEach(function([shift, isMajor], i) {
      const keyName = (i + 1).toString()
      HotKey.addListener(keyName, false, false, false, (e, [shift, isMajor]) => {
        if (!gCurOnNode) return
        let chordName = g_ChordManager.shiftKey(gThis.sheetInfo.sheetKey, shift)
        if (Editor.isChord(gCurOnNode)) {
          if (g_ChordManager.getDistance(gCurOnNode.chord, chordName) == 0) { // 同级的和弦，再次按下则切换大小和弦
            let isCurMajor = g_ChordManager.isMajor(gCurOnNode.chord)
            isMajor = !isCurMajor
          }
        }

        if (!isMajor) chordName += "m"
        gCurOnNode = EditorAction.convertToChord(gCurOnNode, chordName)
      }, [shift, isMajor])
    })

    // 按下~移除和弦
    HotKey.addListener("`", false, false, false, (e) => {
      if (!gCurOnNode) return

      if (Editor.isChord(gCurOnNode)) {
        gCurOnNode = EditorAction.convertToText(gCurOnNode)
      }
    })

    // 按下tab快速在前方添加文本节点，而后可以快速添加和弦
    HotKey.addListener("Tab", false, false, false, (e) => {
      e.preventDefault()
      if (!gCurOnNode) return
      
      let emptyNode = Editor.createTextNode(" ")
      Editor.insertBefore(gCurOnNode, emptyNode)
      gCurOnNode = emptyNode
    })

    // 按下shift+tab快速在后方添加
    HotKey.addListener("Tab", false, true, false, (e) => {
      e.preventDefault()
      if (!gCurOnNode) return
      
      let emptyNode = Editor.createTextNode(" ")
      Editor.insertAfter(gCurOnNode, emptyNode)
      gCurOnNode = emptyNode
    })
  }
}

export default {
  name: "SheetEditorPc",
  components: {
    ToolChord,
    PanelChordSelector,
    Chord,
    WebSheet,
    WebKeySelector,
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
      env: "pc",
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
      editorMode: g_EditEventModeHotkey,
      player: {
        instrument: "Oscillator",
        bpm: 120,
        stum: true
      },
      contextMenu: {
        show: false,
        node: null,
        style: {
          left: 0,
          top: 0,
        },
        insertState: {
          showInsertPos: false,
          showInsertType: false,
          onLeft: true,
          insertType: ENodeType.Text
        },
        enableAddUnderline: false,
        enableRemoveUnderline: false,
        enableRecoverChord: false,
      },
      dragChord: {
        is: false,
        chord: {},
        chordNode: null,
        originalNode: null
      },
      rawLyricPanel: {
        show: false,
        lyrics: "",
      },
      layout: {
        toolWidthPercentage: 20,
        vertRatio: 0.7,
        showAudioPlayer: false
      },
    };
  },
  created() {
    gThis = this
    this.editorMode.init()
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

    document.addEventListener("click", () => this.closeContext());
    document.addEventListener("mousemove", (e) => this.onCursorMove(e));
    document.addEventListener("mouseup", () => this.onCursorUp());
  },
  methods: {
    getEnv,
    formatSheetTree(node) {
      Editor.traverseDFS(node, (n) => {
        // 文本拆分
        if (n.type == ENodeType.Text && n.content.length > 1) {
          Editor.replace(n, Editor.createTextNodes(n.content));
        }
        // 和弦内容拆分
        else if (n.type == ENodeType.Chord && n.content.length > 1) {
          EditorAction.editContent(n, n.content);
        }
      });
    },
    loadSheet(sheetText) {
      let rootNode = reactive(WebSheetParser.parse(sheetText));
      this.formatSheetTree(rootNode);
      console.log(rootNode);
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
        g_ChordManager.getChord(chordName)
      ) : [];
      console.log(this.sheetInfo.chords, this.attachedChords);
    },
    openPanelChord() {
      this.showChordPanel = true;
    },
    openContext(e, node) {
      e.preventDefault();
      this.contextMenu.show = true;
      this.contextMenu.node = node;
      this.contextMenu.style.left = `${e.clientX}px`;
      this.contextMenu.style.top = `${e.clientY}px`;

      let isChord = Editor.isChord(node);
      this.contextMenu.enableAddUnderline = isChord;
      this.contextMenu.enableRemoveUnderline = isChord && Editor.hasUnderlineToNextChord(node);
      this.contextMenu.enableRecoverChord = isChord;
    },
    closeContext() {
      this.contextMenu.show = false;
    },
    playChord(chord) {
      let volume = 0.5;
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
      player.playChord(chord, volume, duration);
    },
    shiftKey(oldKey, newKey) {
      traverseNode(this.sheetInfo.sheetTree, (node) => {
        if (node.type == ENodeType.Chord || node.type == ENodeType.ChordPure) {
          node.chord = g_ChordManager.shiftKey(node.chord, oldKey, newKey);
        }
      });

      for (let i in this.attachedChords) {
        let chordName = this.attachedChords[i].name
        let newChordName = g_ChordManager.shiftKey(chordName, oldKey, newKey);
        this.attachedChords[i] = g_ChordManager.getChord(newChordName)
      }
    },
    editContent(node = null) {
      node = node ?? this.contextMenu.node;
      let newContent = getInputText("标记内容", node.content);
      if (!newContent) return;
      switch (node.type) {
        case ENodeType.Text: {
          EditorAction.updateTextContent(node, newContent);
          break;
        }
        case ENodeType.Mark: {
          EditorAction.updateMarkContent(node, newContent);
          break;
        }
        case ENodeType.Chord: {
          EditorAction.updateChordContent(node, newContent);
          break;
        }
        default: {
          throw "未知的节点，无法编辑内容";
          break;
        }
      }
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
    editAddUnderline(node = null) {
      node = node ?? this.contextMenu.node;
      EditorAction.addUnderlineForChord(node);
    },
    highlightNode(node) {
      if (this.dragChord.originalNode)
        delete this.dragChord.originalNode.style.opacity
      node.style.opacity = 0.5
      this.dragChord.originalNode = node
    },
    onChordDragStart(e, chord) {
      this.dragChord.is = true
      this.dragChord.chord = chord
      this.dragChord.chordNode = reactive(new SheetNode(ENodeType.Chord))
      this.dragChord.chordNode.chord = chord.name
      this.dragChord.originalNode = null
        // e.preventDefault()
      this.onCursorMove(e)
    },
    onCursorMove(e) {
      if (!this.dragChord.is) return

      let [x, y] = getMouseOrTouchClient(e);
      setPos(this.$refs.dragMark, x, y)
    },
    onCursorUp() {
      if (this.dragChord.is) {
        if (this.dragChord.originalNode) {
          const targetNode = this.dragChord.originalNode
          let chordNode = this.dragChord.chordNode
          if (targetNode.type == ENodeType.ChordPure) {
            chordNode.type = targetNode.type
            chordNode.content = ''
          } else {
            chordNode.type = ENodeType.Chord
            chordNode.content = targetNode.content
          }
          Editor.replace(targetNode, chordNode)
        }
        this.dragChord.is = false
        this.dragChord.chord = null
        this.dragChord.chordNode = null
        this.dragChord.originalNode = null
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
    saveSheetToFile() {
      // TODO: remove un used chord?
      let fileData = toSheetFileString(
        this.sheetInfo.sheetTree,
        this.sheetInfo.title,
        this.sheetInfo.singer,
        this.sheetInfo.by,
        this.sheetInfo.originalKey,
        this.sheetInfo.sheetKey,
        this.attachedChords.map(n => n.name),
      )
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
    onClickInsertPos(isOnLeft) {
      this.contextMenu.insertState.onLeft = isOnLeft;
      this.contextMenu.insertState.showInsertPos = false;
      this.contextMenu.insertState.showInsertType = true;
    },
    onClickInsertType(type) {
      this.contextMenu.insertState.showInsertType = false;

      let nodes = null
      switch(type) {
        case ENodeType.Text: {
          let text = prompt("文本内容", "请输出文本")
          if (!text) return;
          nodes = Editor.createTextNodes(text)
          break
        }
        case ENodeType.Mark: {
          let text = prompt("标记内容", "标记")
          if (!text) return;
          nodes = Editor.createMarkNode(text)
          break
        }
        case ENodeType.NewLine: {
          nodes = Editor.createNewLineNode()
          break
        }
      }
      console.log(this.contextMenu.node)
      if (this.contextMenu.insertState.onLeft)
        Editor.insertBefore(this.contextMenu.node, nodes)
      else
        Editor.insertAfter(this.contextMenu.node, nodes)
    },
    onClickInsertMark() { this.onClickInsertType(ENodeType.Mark) },
    onClickInsertText() { this.onClickInsertType(ENodeType.Text) },
    onClickInsertNewLine() { this.onClickInsertType(ENodeType.NewLine) }
  },
  watch: {
    "layout.toolWidthPercentage": function () {
      this.layout.toolWidthPercentage = Math.min(
        70,
        Math.max(10, this.layout.toolWidthPercentage)
      );
    },
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

.context {
  position: fixed;
  display: flex;
  overflow: hidden;
  user-select: none;
  z-index: 20;

  border-radius: 10px;

  &::before {
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
}

#editor_context {
  #editor_context_menu {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 10px;

    width: 100%;
  }
}

#editor_context_insert_pos {
  #editor_context_menu_insert_pos,
  #editor_context_menu_insert_type {
    display: flex;
    height: 30px;
  }
}

.editor_context_menu_item {
  position: relative;
  color: white;
  padding: 5% calc(var(--base-font-size));
  transition: all 0.2s ease-out;
  cursor: pointer;
  border-radius: 10px;

  display: flex;
  justify-content: flex-start;
  align-items: center;

  z-index: 21;

  &:hover {
    text-decoration: underline;
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

<style scoped lang="scss">
.editor[env=pc] {
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
  }
}
</style>