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
console.log(gKeyboardSize)

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
      pressedKeys: new Set(),
      keyboard: new Keyboard()
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
  },
  methods: {
    onPress(key) {
      key.pressed = true
      this.pressedKeys.add(key)

      this.keyboard.playKey(key.tone, 0.2)
    },
    onMouseRelease() {
      for (let key of this.pressedKeys)
        key.pressed = false
      this.pressedKeys.clear()
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
    background: rgb(164, 162, 140);
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
    background: rgb(58, 57, 19);
  }
}
</style>