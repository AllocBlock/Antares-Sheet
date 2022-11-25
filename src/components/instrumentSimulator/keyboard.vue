<template>
  <div class="instrument_keyboard_container" :style="boardSize">
    <div v-for="(key, index) in whiteKeys" :key="index" 
      class="instrument_keyboard_white_key" 
      :style="key.style"
      :pressed="key.pressed ? true : null"
      @mousedown="onPress(key)"
    />
    <div v-for="(key, index) in blackKeys" :key="index" 
      class="instrument_keyboard_black_key" 
      :style="key.style" 
      :pressed="key.pressed ? true : null"
      @mousedown="onPress(key)"
    />
  </div>
</template>

<script>
import { Keyboard } from "@/utils/instrument.js"
import HotKey from "@/utils/hotKey.js";

function calcKeyboardSize(whiteKeyWidth, length) {
  return {
    whiteKey: {
      width: whiteKeyWidth,
      length: length
    },
    blackKey: {
      width: whiteKeyWidth * (StandardBlackKeyWidth / StandardWhiteKeyWidth),
      length: length * (StandardBlackKeyLength / StandardWhiteKeyLength),
    },
  }
}

function toPx(num) {
  return num + "px"
}

const octaveWhiteKeyTone = ["C", "D", "E", "F", "G", "A", "B"]
const blackKeyPoses = [0, 1, 3, 4, 5]
const octaveBlackKeyTone = ["#C", "#D", "#F", "#G", "#A"]
function addOctave(keyboardSize, offset, octave, outWhiteKeys, outBlackKeys) {
  let keyInterval = keyboardSize.whiteKey.width

  for (let i = 0; i < 7; ++i) {
    outWhiteKeys.push({
      style: {
        width: toPx(keyboardSize.whiteKey.width),
        height: toPx(keyboardSize.whiteKey.length),
        left: toPx(offset + i * keyInterval),
      },
      tone: {
        name: octaveWhiteKeyTone[i],
        octave: i < 5 ? octave : octave + 1
      }
    })
  }

  let blackKeyStart = keyboardSize.whiteKey.width - keyboardSize.blackKey.width * 0.5

  for (let i = 0; i < 5; ++i) {
    outBlackKeys.push({
      style: {
        width: toPx(keyboardSize.blackKey.width),
        height: toPx(keyboardSize.blackKey.length),
        left: toPx(offset + blackKeyStart + blackKeyPoses[i] * keyInterval),
      },
      tone: {
        name: octaveBlackKeyTone[i],
        octave: i < 4 ? octave : octave + 1
      }
    })
  }
}

const ScaleRatio = 20.0; // cm to px
const StandardWhiteKeyWidth = 2.2; // cm
const StandardBlackKeyWidth = 1.1; // cm
const StandardWhiteKeyLength = 15; // cm
const StandardBlackKeyLength = 9.5; // cm
const gKeyboardSize = calcKeyboardSize(StandardWhiteKeyWidth * ScaleRatio, StandardWhiteKeyLength * ScaleRatio)

export default {
  name: "InstrumentSimulatorKeyboard",
  data(){
    return {
      boardSize: {
        width: 0,
        height: 0
      },
      whiteKeys: [],
      blackKeys: [],
      pressedKeys: new Map(),
      keyboard: new Keyboard(),
    }
  },
  props: {
    muteHotKey: {
      type: Boolean,
      default: false
    }
  },
  mounted() {
    let octaveWidth = gKeyboardSize.whiteKey.width * 7
    let octaveHeight = gKeyboardSize.whiteKey.length

    let octaveNum = 2
    let startOctave = 4
    
    this.boardSize.width = toPx(octaveWidth * octaveNum)
    this.boardSize.height = toPx(octaveHeight)

    for (let i = 0; i < octaveNum; ++i)
      addOctave(gKeyboardSize, i * octaveWidth, startOctave + i, this.whiteKeys, this.blackKeys)

    document.addEventListener("mouseup", this.onMouseRelease)
    this.bindHotKeys()
  },
  methods: {
    onPress(key) {
      this.pressKey(key, true)
    },
    onMouseRelease() {
      this.pressedKeys.forEach((entry, key) =>{
        if (entry.isMouse) {
          this.releaseKey(key)
        }
      })
    },
    pressKey(key, isMouse) {
      key.pressed = true
      let nodes = this.keyboard.playKey(key.tone, 0.2)
      this.pressedKeys.set(key, {
        nodes,
        isMouse
      })
    },
    releaseKey(key) {
      key.pressed = false
      if (!this.pressedKeys.has(key)) return
      this.keyboard.stopKey(key.tone)
      this.pressedKeys.delete(key)
    },
    bindHotKeys() {
      let that = this
      function hotkeySwitcher(callback, preventDefault = false) {
        return (e) => {
          if (that.muteHotKey) return
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
        HotKey.addKeyDownListener(whiteKeyHotKeys[i], hotkeySwitcher((e) => this.pressKey(this.whiteKeys[i])))
        HotKey.addKeyUpListener(whiteKeyHotKeys[i], hotkeySwitcher((e) => this.releaseKey(this.whiteKeys[i])))
      }

      for (let i = 0; i < blackKeyHotKeys.length; ++i) {
        HotKey.addKeyDownListener(blackKeyHotKeys[i], hotkeySwitcher((e) => this.pressKey(this.blackKeys[i])))
        HotKey.addKeyUpListener(blackKeyHotKeys[i], hotkeySwitcher((e) => this.releaseKey(this.blackKeys[i])))
      }
    }
  }
};

</script>

<style scoped lang="scss">
.instrument_keyboard_container {
  position: relative;
  background: red;
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