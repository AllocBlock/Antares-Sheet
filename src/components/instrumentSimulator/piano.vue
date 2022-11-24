<template>
  <div class="instrument_piano_board" :style="boardSize">
    <div v-for="(key, index) in whiteKeys" :key="index" 
      class="instrument_piano_white_key" 
      :style="key.style"
      :pressed="key.pressed ? true : null"
      @mousedown="onPress(key)"
    />
    <div v-for="(key, index) in blackKeys" :key="index" 
      class="instrument_piano_black_key" 
      :style="key.style" 
      :pressed="key.pressed ? true : null"
      @mousedown="onPress(key)"
    />
  </div>
</template>

<script>

function calcPianoSize(whiteKeyWidth, length) {
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

const blackKeyPoses = [0, 1, 3, 4, 5]
function addOctave(pianoSize, offset, outWhiteKeys, outBlackKeys) {
  let keyInterval = pianoSize.whiteKey.width

  for (let i = 0; i < 7; ++i) {
    outWhiteKeys.push({
      style: {
        width: toPx(pianoSize.whiteKey.width),
        height: toPx(pianoSize.whiteKey.length),
        left: toPx(offset + i * keyInterval),
      }
    })
  }

  let blackKeyStart = pianoSize.whiteKey.width - pianoSize.blackKey.width * 0.5

  for (let pos of blackKeyPoses) {
    outBlackKeys.push({
      style: {
        width: toPx(pianoSize.blackKey.width),
        height: toPx(pianoSize.blackKey.length),
        left: toPx(offset + blackKeyStart + pos * keyInterval),
      }
    })
  }
}

const ScaleRatio = 20.0; // cm to px
const StandardWhiteKeyWidth = 2.2; // cm
const StandardBlackKeyWidth = 1.1; // cm
const StandardWhiteKeyLength = 15; // cm
const StandardBlackKeyLength = 9.5; // cm
const gPianoSize = calcPianoSize(StandardWhiteKeyWidth * ScaleRatio, StandardWhiteKeyLength * ScaleRatio)
console.log(gPianoSize)

export default {
  name: "InstrumentSimulatorPiano",
  data(){
    return {
      boardSize: {
        width: 0,
        height: 0
      },
      whiteKeys: [],
      blackKeys: [],
      pressedKeys: new Set()
    }
  },
  mounted() {
    let octaveWidth = gPianoSize.whiteKey.width * 7
    let octaveHeight = gPianoSize.whiteKey.length

    let octaveNum = 2
    
    this.boardSize.width = toPx(octaveWidth * octaveNum)
    this.boardSize.height = toPx(octaveHeight)

    for (let i = 0; i < octaveNum; ++i)
      addOctave(gPianoSize, i * octaveWidth, this.whiteKeys, this.blackKeys)

    document.addEventListener("mouseup", this.onMouseRelease)
  },
  methods: {
    onPress(key) {
      key.pressed = true
      this.pressedKeys.add(key)
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
.instrument_piano_board {
  position: relative;
  background: red;
  user-select: none;
}

.instrument_piano_white_key {
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

.instrument_piano_black_key {
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