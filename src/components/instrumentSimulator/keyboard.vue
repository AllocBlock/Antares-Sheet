<template>
  <div class="instrument_keyboard_container" :style="boardSize">
    <div v-for="(key, index) in whiteKeys" :key="index" 
      class="instrument_keyboard_white_key" 
      :style="getWhiteKeyStyle(key)"
      :pressed="key.pressed ? true : null"
      @mousedown="onPress(key)"
    />
    <div v-for="(key, index) in blackKeys" :key="index" 
      class="instrument_keyboard_black_key" 
      :style="getBlackKeyStyle(key)" 
      :pressed="key.pressed ? true : null"
      @mousedown="onPress(key)"
    />
  </div>
</template>

<script setup lang="ts">
import { Keyboard, Oscillator, Note } from "@/utils/instrument"
import HotKey from "@/utils/hotKey";
import { onMounted, reactive } from "vue";

const ScaleRatio = 20.0; // cm to px
const StandardWhiteKeyWidth = 2.2; // cm
const StandardBlackKeyWidth = 1.1; // cm
const StandardWhiteKeyLength = 15; // cm
const StandardBlackKeyLength = 9.5; // cm

class KeyLayout {
  width : number
  length : number
  constructor(width : number, length : number) {
    this.width = width
    this.length = length
  }
}

class KeyboardLayout {
  whiteKeyLayout : KeyLayout
  blackKeyLayout : KeyLayout
  constructor(whiteKeyLayout : KeyLayout, blackKeyLayout : KeyLayout) {
    this.whiteKeyLayout = whiteKeyLayout
    this.blackKeyLayout = blackKeyLayout
  }
}

function calcKeyboardSize(whiteKeyWidth : number, length : number) : KeyboardLayout {
  return new KeyboardLayout(
    new KeyLayout(whiteKeyWidth, length),
    new KeyLayout(whiteKeyWidth * (StandardBlackKeyWidth / StandardWhiteKeyWidth), length * (StandardBlackKeyLength / StandardWhiteKeyLength)),
  )
}

const KeyboardSize = calcKeyboardSize(StandardWhiteKeyWidth * ScaleRatio, StandardWhiteKeyLength * ScaleRatio)
const OctaveWidth = KeyboardSize.whiteKeyLayout.width * 7
const OctaveHeight = KeyboardSize.whiteKeyLayout.length
const OctaveNum = 2
const StartOctave = 4

function toPx(num) : string {
  return num + "px"
}

const OctaveWhiteKey = ["C", "D", "E", "F", "G", "A", "B"]
const BlackKeyPoses = [0, 1, 3, 4, 5]
const OctaveBlackKey = ["#C", "#D", "#F", "#G", "#A"]

class KeyboardKey {
  note : Note
  pressed : boolean
  constructor(note : Note) {
    this.note = note
    this.pressed = false
  }
}

function getWhiteKeyStyle(key : KeyboardKey) {
  let index = whiteKeys.indexOf(key)
  let keyInterval = KeyboardSize.whiteKeyLayout.width
  // let octaveWidth = KeyboardSize.whiteKeyLayout.width * 7
  return {
      width: toPx(KeyboardSize.whiteKeyLayout.width),
      height: toPx(KeyboardSize.whiteKeyLayout.length),
      left: toPx(index * keyInterval),
  }
}

function getBlackKeyStyle(key : KeyboardKey) {
  let index = blackKeys.indexOf(key)
  let octaveIndex = Math.trunc(index / 5)
  let localIndex = index % 5
  let octaveWidth = KeyboardSize.whiteKeyLayout.width * 7
  let startOffset = KeyboardSize.whiteKeyLayout.width - KeyboardSize.blackKeyLayout.width * 0.5
  let keyInterval = KeyboardSize.whiteKeyLayout.width

  return {
      width: toPx(KeyboardSize.blackKeyLayout.width),
      height: toPx(KeyboardSize.blackKeyLayout.length),
      left: toPx(startOffset + octaveIndex * octaveWidth + BlackKeyPoses[localIndex] * keyInterval),
  }
}

const boardSize = reactive({width: "0px", height: "0px"})
const whiteKeys = reactive<Array<KeyboardKey>>([])
const blackKeys = reactive<Array<KeyboardKey>>([])
const pressedKeys = reactive(new Map())
const keyboard = new Keyboard(new Oscillator(new AudioContext()).load())

const props = defineProps({
    muteHotKey: {
      type: Boolean,
      default: false
    }
})

function pressKey(key : KeyboardKey, isMouse) {
  key.pressed = true
  keyboard.playNote(key.note, 0.2)
  pressedKeys.set(key, {isMouse})
}

function releaseKey(key : KeyboardKey) {
  key.pressed = false
  if (!pressedKeys.has(key)) return
  keyboard.stopNote(key.note)
  pressedKeys.delete(key)
}

function onPress(key : KeyboardKey) {
  pressKey(key, true)
}

function onMouseRelease() {
  pressedKeys.forEach((entry, key) =>{
    if (entry.isMouse) {
      releaseKey(key)
    }
  })
}

function bindHotKeys() {
  function hotkeySwitcher(callback, preventDefault = false) {
    return (e) => {
      if (props.muteHotKey) return
      if (preventDefault) e.preventDefault()
      callback(e)
    }
  }

  const whiteKeyHotKeys = [
    "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash", "ShiftRight"
  ]
  const blackKeyHotKeys = [
    "KeyS", "KeyD", "KeyG", "KeyH", "KeyJ", "KeyL", "Semicolon", 
  ]

  for (let i = 0; i < whiteKeyHotKeys.length; ++i) {
    HotKey.addKeyDownListener(whiteKeyHotKeys[i], hotkeySwitcher((e) => pressKey(whiteKeys[i], false)))
    HotKey.addKeyUpListener(whiteKeyHotKeys[i], hotkeySwitcher((e) => releaseKey(whiteKeys[i])))
  }

  for (let i = 0; i < blackKeyHotKeys.length; ++i) {
    HotKey.addKeyDownListener(blackKeyHotKeys[i], hotkeySwitcher((e) => pressKey(blackKeys[i], false)))
    HotKey.addKeyUpListener(blackKeyHotKeys[i], hotkeySwitcher((e) => releaseKey(blackKeys[i])))
  }
}

onMounted(() => {
    boardSize.width = toPx(OctaveWidth * OctaveNum)
    boardSize.height = toPx(OctaveHeight)

    for (let octave = StartOctave; octave < StartOctave + OctaveNum; ++octave) {
      for (let i = 0; i < 7; ++i) {
        whiteKeys.push(new KeyboardKey(new Note(OctaveWhiteKey[i], octave)))
      }
      for (let i = 0; i < 5; ++i) {
        blackKeys.push(new KeyboardKey(new Note(OctaveBlackKey[i], octave)))
      }
    }

    document.addEventListener("mouseup", onMouseRelease)
    bindHotKeys()
})

</script>

<style scoped lang="scss">
.instrument_keyboard_container {
  position: relative;
  user-select: none;
}

.instrument_keyboard_white_key {
  position: absolute;
  background: rgb(238, 239, 243);
  left: 0;
  top: 0;
  box-shadow: inset -2px 0 black;

  &:hover {
    background: rgb(226, 224, 182);
  }

  &[pressed] {
    background: rgb(165, 165, 165);
  }
}

.instrument_keyboard_black_key {
  position: absolute;
  background: rgb(12, 13, 52);
  left: 0;
  top: 0;
  box-shadow: inset -5px -3px 10px grey;
  
  &:hover {
    background: rgb(85, 84, 61);
  }
  &[pressed] {
    background: rgb(62, 62, 62);
  }
}
</style>