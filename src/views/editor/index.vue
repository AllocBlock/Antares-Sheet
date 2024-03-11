<template>
  <div class="editor" :style="globalCssVar">
    <div class="flex_hv_center fill" style="flex-direction: column;">
      <div class="flex_hv_center fill"
        :style="`height: ${layout.showAudioPlayer ? ('calc(100% - ' + layout.audioPlayerHeight + 'px)') : '100%'}; position: relative;`">
        <div id="help_button" @click="layout.showHelpPanel = true">?</div>
        <div id="tools_block" :style="`width: ${layout.toolWidthPercentage}%;`">
          <div class="tools_title flex_hv_center">工具栏</div>
          <ToolChord id="chord_tool" v-model:chords="toolChord.attachedChords" @dragStart="onToolChordDragStart" />
          <div class="button" @click="toolChord.showPanel = true">
            编辑和弦
          </div>

          <div class="tools_title flex_hv_center">曲谱操作</div>
          <div class="flex_hv_center">
            <div class="button" v-if="editor.canUndo()" @click="editor.undo">
              撤销
            </div>
            <div class="button" v-if="editor.canRedo()" @click="editor.redo">
              重做
            </div>
          </div>
          <div id="clear_sheet_button" class="button" @click="clearSheet">
            清空曲谱
          </div>
          
        </div>
        <div class="fill" style="display: flex; justify-content: center; overflow: auto;">
          <div id="sheet_block" :style="`width: ${100 - layout.toolWidthPercentage}%`">
            <input type="text" id="song_title_input" class="input" placeholder="在此处输入歌名" v-model="sheetMeta.title"
              @focus="beginTyping" @blur="endTyping" />
            <input type="text" id="song_singer_input" class="input" placeholder="在此处输入歌手" v-model="sheetMeta.singer"
              @focus="beginTyping" @blur="endTyping" />
            <div id="sheet_key_block">
              <div class="title">原调</div>
              <KeySelector class="select" v-model:value="sheetMeta.originalKey" />
              <div class="title">选调</div>
              <KeySelector class="select" :value="sheetMeta.sheetKey" @update:value="onChangeSheetKey" />
              <div id="sheet_capo_block">
                <div class="title">变调夹</div>
                <CapoSelector id="capo_selector" class="select" v-model:value="sheetMeta.capo" />
              </div>
            </div>
            <div id="sheet_by" class="title">制谱 锦瑟</div>
            <div class="flex_hv_center">
              <div id="edit_raw_editor_button" class="button" @click="openRawEditorPanel">编辑原始曲谱</div>
              <div class="button" @click="saveSheet(true)">保存</div>
              <div class="button" @click="editor.loadSheetFromFile">载入</div>
              <div class="button" @click="editor.exportSheetToFile(toolChord.attachedChords, `${sheetMeta.title}.atrs`)">导出</div>
            </div>
            <AntaresSheet id="sheet_box" :sheet-tree="sheetRoot" :events="nodeEventList" />
            <div id="sheet_padding"></div>
          </div>
        </div>
      </div>
      <div class="flex_hv_center fill"
        :style="`height: ${layout.showAudioPlayer ? layout.audioPlayerHeight : '0'}px; position: relative;`">
        <div class="flex_hv_center" v-show="!layout.showAudioPlayer" id="playerOpenTag"
          @click="layout.showAudioPlayer = true">打开音乐播放器</div>
        <AudioPlayer v-show="layout.showAudioPlayer" @close="layout.showAudioPlayer = false"
          :mute-hotkey="mutePlayerHotkey" />
      </div>
    </div>

    <input type="range" id="layout_slider" min="0" max="100" step="0.1" v-model="layout.toolWidthPercentage" />

    <EditorContextMenu 
      :show="contextMenu.show"
      :pos="contextMenu.position"
      :entries="contextMenu.entries"
      @close="closeContext"
      @insert="(type, insertBefore) =>  editor.insert(contextMenu.node, type, insertBefore)"
      @edit="editor.editContent(contextMenu.node)"
      @remove="editor.remove(contextMenu.node)"
      @addUnderline="editor.addUnderline(contextMenu.node)"
      @removeUnderline="editor.removeUnderline(contextMenu.node)"
      @recoverChord="editor.recoverChord(contextMenu.node)"
      @toggleChordType="editor.toggleChordType(contextMenu.node)"
      />

    <div id="drag_mark" v-show="dragChord.isDragging" ref="dragMark">{{ dragChord.text }}</div>

    <RawEditorPanel
      :show="rawEditorPanel.show"
      :sheet-text="rawEditorPanel.sheetText"
      @confirm="onRawSheetConfirm"
      @cancel="rawEditorPanel.show = false"
    />
    <PanelChordSelector id="chord_panel" class="panel" 
      v-model:attachedChords="toolChord.attachedChords"
      v-model:show="toolChord.showPanel" 
      :tonic="sheetMeta.sheetKey" 
    />
    <div id="drop_hint_panel">
      <div id="drop_hint_text">拖拽文件加载</div>
    </div>

    <div id="help_panel" class="panel" v-if="layout.showHelpPanel">
      曲谱编辑教程：<br />
      {{ editorMode.getTip() }}
      <div class="button" @click="layout.showHelpPanel = false">确认</div>
    </div>

    <DraggablePanel title="键盘" :initPos="{ left: 200, top: 200 }" v-model:isFocused="keyboard.isFocused"
      v-model:isFolded="keyboard.isFolded">
      <InstrumentSimulatorKeyboard :mute-hot-key="!keyboard.isFocused" />
    </DraggablePanel>

    
    <DraggablePanel title="曲谱播放" :initPos="{ left: 200, top: 250 }" :isFolded="false">
      <SheetPlayer :player="playerInfo.player" :root="sheetRoot" />
    </DraggablePanel>

    <TopCover :show="!isLoaded">{{ loadCoverMessage }}</TopCover> 
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref, onMounted, watch } from "vue";
import AntaresSheet from "@/components/antaresSheet/index.vue";
import KeySelector from "@/components/keySelector.vue";
import ToolChord from "./toolChord.vue";
import PanelChordSelector from "./panelChordSelector.vue";
import CapoSelector from "@/components/capoSelector.vue";
import DraggablePanel from "@/components/draggablePanel.vue";
import EditorContextMenu from "@/components/editorContextMenu.vue";
import RawEditorPanel from "@/components/rawEditorPanel.vue";
import InstrumentSimulatorKeyboard from "@/components/instrumentSimulator/keyboard.vue";
import TopCover from "@/components/topCover.vue";
import SheetPlayer from "@/components/sheetPlayer.vue";
import AudioPlayer from "./audioPlayer.vue"

import { ELoadState, Position, getQueryVariable, startRepeatTimeout } from "@/utils/common";

import { NodeUtils, SheetNode } from "@/utils/sheetNode";
import { parseSheet } from "@/utils/sheetParser";
import { useEditor } from "./editorInterface"
import { EditorMode, EditorModeCombined } from './editorMode'
import EditorModeBasic from './editorModeBasic'
import { EditorModeDrag, DragChordInfo } from './editorModeDrag'
import EditorModeProgression from './editorModeProgression'

import { Ukulele, Oscillator } from "@/utils/instrument";
import FretChordManager from "@/utils/fretChordManager";
import { gProjectManager } from "@/utils/project";
import HotKey from "@/utils/hotKey";
import { NodeEventList } from "@/utils/elementEvent";
import { Key } from "@/utils/chord";
import { generateSheetText } from "@/utils/sheetWriter";
import addToast from "@/utils/toast";
import SheetMeta from "@/utils/sheetMeta";

function createUkulele(audioSource) {
  audioSource.load()
  return new Ukulele(audioSource)
}

// layout and style
const globalCssVar = ref({
  "--sheet-font-size": "var(--base-font-size)",
  "--title-base-font-size": "calc(var(--base-font-size) * 1.8)",
  "--title-scale": "1",
  "--sheet-theme-color": "var(--theme-color)",
  "--tip-text-background-color": "var(--theme-color)",
  "--tip-button-background-color": "seagreen",
})

const layout = ref({
  toolWidthPercentage: 20,
  audioPlayerHeight: 180,
  showAudioPlayer: false,
  showHelpPanel: false
})

const isLoaded = computed(() => project.value.loadState == ELoadState.Loaded)
const loadCoverMessage = computed(() => { 
  switch(project.value.loadState) {
    case ELoadState.Loaded: return "加载完成";
    case ELoadState.Loading: return "加载中...";
    case ELoadState.Failed: return "加载失败，项目不存在";
    default: return "加载遇到未知问题"
  }
})

watch(() => layout.value.toolWidthPercentage, () => {
  layout.value.toolWidthPercentage = Math.min(
    70,
    Math.max(10, layout.value.toolWidthPercentage)
  )
})

// typeing state
const isTyping = ref(false)
function beginTyping() {
  isTyping.value = true
}
function endTyping() {
  isTyping.value = false
}

// project info
const project = ref({
  loadState: ELoadState.Loading,
  pid: null,
})

const nodeEventList = computed(() => {
  return editorMode.value ? editorMode.value.nodeEventList : new NodeEventList()
})

// player
const playerInfo = ref({
  instrument: "Oscillator",
  bpm: 60,
  stum: true,
  player: createUkulele(new Oscillator(new AudioContext())),
})

function playChord(chord) {
  let volume = 0.3;
  let duration = playerInfo.value.stum ? 0 : (1 / playerInfo.value.bpm) * 60 * 4;
  const capo = sheetMeta.capo
  playerInfo.value.player.setCapo(capo);
  playerInfo.value.player.playChord(chord, volume, duration);
}

const mutePlayerHotkey = computed(() => {
  return !layout.value.showAudioPlayer || rawEditorPanel.value.show || isTyping.value || toolChord.value.showPanel;
})

// keyboard
const keyboard = ref({
  isFocused: false,
  isFolded: true,
})

// const muteKeyboardHotKey = computed(() => {
//   return rawEditorPanel.value.show || isTyping.value || !keyboard.value.isFocused || keyboard.value.isFolded || toolChord.value.showPanel;
// })

// editor
const sheetMeta = reactive(new SheetMeta())
const sheetRoot = reactive(NodeUtils.createRootNode())
const {
  toolChord,
  editor
} = useEditor(sheetMeta, sheetRoot)

// -- drag chord and tool chord panel
const dragChord = ref(new DragChordInfo())
const dragMark = ref<Element>(null) // refs 

function onToolChordDragStart(e, chord) {
  if (editorMode.value) {
    editorMode.value.toolChordEvents.trigger(e, chord)
  }
}  

watch(() => toolChord.value.attachedChords, () => {
  sheetMeta.chords = toolChord.value.attachedChords
})

// -- raw editor panel
const rawEditorPanel = ref({
  show: false,
  sheetText: "",
  isValid: true,
  invalidReason: ""
})

function openRawEditorPanel() {
  rawEditorPanel.value.sheetText = generateSheetText(sheetRoot)
  rawEditorPanel.value.show = true
}
``
function onRawSheetConfirm(root) {
  editor.setSheet(sheetMeta, root)
  rawEditorPanel.value.show = false
}

// -- editor mode
const editorMode = ref<EditorMode>(null)
const muteEditorHotkey = computed(() => {
  return layout.value.showAudioPlayer || rawEditorPanel.value.show || isTyping.value || toolChord.value.showPanel;
})
watch(muteEditorHotkey, () => {
  console.log("updated")
  if (muteEditorHotkey.value) editorMode.value.disableHotkey()
  else editorMode.value.enableHotkey()
})

// -- editing
function saveSheet(showTip = false) {
  gProjectManager.update(project.value.pid, sheetMeta, editor.getSheetString(toolChord.value.attachedChords))
  if (showTip)
    addToast("曲谱已保存~")
}

function clearSheet() {
  if (!confirm("是否清空曲谱？"))
      return
  toolChord.value.attachedChords = []
  editor.clearSheet()
}

function loadSheet(sheetData : string) {
  editor.loadSheet(sheetData)
  toolChord.value.attachedChords = editor.meta.chords ?? [];
}

function onChangeSheetKey(newKey) {
  let oldKey = sheetMeta.sheetKey
  if (Key.isEqual(newKey, oldKey)) return;
  
  let shiftChord = confirm("你修改了曲谱调式，是否将和弦一起转调？")
  editor.setKey(newKey, shiftChord)

  // shift tool chords
  if (shiftChord) {
    let offset = Key.getOffset(oldKey, newKey)
    console.log(oldKey, newKey, offset)
    for (let i in toolChord.value.attachedChords) {
      let chord = toolChord.value.attachedChords[i]
      chord = chord.shiftKey(offset);
      toolChord.value.attachedChords[i] = chord
    }
  }
}

// -- context menu
const contextMenu = ref({
  show: false,
  node: null,
  position: new Position(),
  entries: Array<string>()
})

function openContext(e : MouseEvent, node : SheetNode) {
  e.preventDefault();
  contextMenu.value.show = true;
  contextMenu.value.node = node;
  contextMenu.value.position.left = e.clientX;
  contextMenu.value.position.top = e.clientY;

  let isChord = node && node.isChord();
  let isNewLine = node && node.isNewLine();

  let entries : string[] = []
  if (!isNewLine) { entries.push("editContent") }
  if (isChord) { 
    entries.push("addUnderline") 
    if (NodeUtils.hasUnderlineToNextChord(node)) { 
      entries.push("removeUnderline") 
    }
    entries.push("toggleChordType")
  }
  contextMenu.value.entries = entries
  console.log(contextMenu)
}

function closeContext() {
  contextMenu.value.show = false;
}

const AUTO_SAVE_INTERVAL = 5000
onMounted(() => {
  // editor mode
  let modeBasic = new EditorModeBasic(editor)
  let modeDrag = new EditorModeDrag(dragChord.value, dragMark.value, editor)
  let modeProgression = new EditorModeProgression(editor)
  let newEditorMode = new EditorModeCombined([modeBasic, modeDrag, modeProgression])

  // context
  newEditorMode.nodeEventList.text.contentMenus.push(openContext)
  newEditorMode.nodeEventList.chord.contentMenus.push(openContext)
  newEditorMode.nodeEventList.mark.contentMenus.push(openContext)
  newEditorMode.nodeEventList.newline.contentMenus.push(openContext)
  document.addEventListener("click", closeContext);

  // play chord
  newEditorMode.nodeEventList.chord.mouseDowns.push((e, node) => playChord(FretChordManager.
  getFretChord(node.chord)))

  newEditorMode.hook()

  // tool chord
  if (newEditorMode.toolChordEvents)
    toolChord.value.events = newEditorMode.toolChordEvents

  editorMode.value = newEditorMode

  // project
  let pid = getQueryVariable("pid");
  let projectInfo = gProjectManager.get(pid)

  if (!projectInfo) {
    project.value.loadState = ELoadState.Failed;
    return;
  }

  project.value.loadState = ELoadState.Loaded
  project.value.pid = pid
  loadSheet(projectInfo.sheetData)

  // auto save
  startRepeatTimeout(() => {
    saveSheet(false)
  }, AUTO_SAVE_INTERVAL)

  // hot key
  HotKey.addKeyDownListener("KeyS", (e) => {
    saveSheet(true)
    e.preventDefault()
  }, true, false, false)
})
</script>

<style scoped src="@/components/editorCommon.css" />

<style scoped lang="scss">
.title {
  overflow: hidden;
  white-space: nowrap;
  word-break: break-all;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.tools_title {
  width: 100%;
  font-size: 120%;
  font-weight: bold;
  border-top: 2px black solid;
  border-bottom: 2px black solid;
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
  color: var(--foreground-color);
  font-size: var(--base-font-size);
}

.toggle {
  --size: 24px;
  position: relative;
  appearance: none;
  width: calc(var(--size) * 2);
  height: var(--size);
  border: #fff 2px solid;
  border-radius: calc(var(--size) / 2);
  background: transparent;
  transition: border 0.2s ease-out;
  outline: none;
  border: 2px grey solid;
  transition: background 0.2s ease-out;

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
    border: 2px var(--theme-color) solid;
  }

  &:checked::before {
    left: calc(100% - var(--ball-size) - var(--margin-size));
    background: var(--theme-color);
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
  pointer-events: none;

  z-index: 2;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: none;
    background: var(--theme-color);
    pointer-events: all;
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
    font-size: calc(var(--title-base-font-size) * 0.6);
  }

  #sheet_by {
    margin-top: 5px;
    height: calc(var(--title-base-font-size) * 0.8);
    line-height: calc(var(--title-base-font-size) * 0.8);
    font-size: calc(var(--title-base-font-size) * 0.7);
    color: rgb(156, 156, 156);
  }

  #edit_raw_editor_button {
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

.panel {
  z-index: 30;

  position: fixed;
  height: 100%;
  width: 100%;
  left: 0;
  top: 0;
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
./editorx