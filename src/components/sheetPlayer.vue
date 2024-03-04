<template>
  <div id="sheet_player">
    <div id="play_button" @click="togglePlay">{{ started ? "■" : "▶" }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Ukulele } from "@/utils/instrument"
import { IntervalTicker, DeltaTimer } from "@/utils/timer";
import { ENodeType, SheetNode } from "@/utils/sheetNode";
import { Chord, FretChord } from "@/utils/chord";
import { assert } from "@/utils/assert";
import FretChordManager from "@/utils/fretChordManager";
import { Rhythm } from "@/utils/rhythm";

const props = defineProps({
  player: {
    type: Ukulele,
    required: true
  },
  root: {
    type: SheetNode,
    required: true
  }
})

const started = ref(false)

class TimelinePoint {
  time : number
  durationMs : number
  node: SheetNode
  fretChord : FretChord

  constructor(time : number, node: SheetNode, chord : FretChord, durationMs : number) {
    assert(durationMs, "duration must be positive")
    this.time = time
    this.node = node
    this.fretChord = chord
    this.durationMs = durationMs
  }
}

function highlightNode(node : SheetNode) {
  node.style.background = 'rgba(255, 255, 0, 0.7)'
}

function unhighlightNode(node : SheetNode) {
  node.style.background = ''
}

const defaultRhythm = Rhythm.createFromString("{(124)3231323}")

class SheetPlayer {
  ticker : IntervalTicker
  deltaTime : DeltaTimer
  bpm : number
  curFrontIndex : number // wait to start
  curBackIndex : number // wait to end
  curTime : number
  points : TimelinePoint[]
  onStop : () => void

  constructor(bpm = 120.0, onStop : () => void) {
    this.ticker = new IntervalTicker(() => this._tick())
    this.deltaTime = new DeltaTimer
    this.bpm = bpm
    this.onStop = onStop
  }

  _tick() {
    let deltaMs = this.deltaTime.tick()
    this.curTime += deltaMs

    // mark played and un highlight
    while(this.curBackIndex < this.curFrontIndex) {
      let point = this.points[this.curBackIndex]
      if (this.curTime >= point.time + point.durationMs) {
        unhighlightNode(point.node)
      } else {
        break;
      }
      this.curBackIndex++
    }

    // play and highlight
    while(this.curFrontIndex < this.points.length) {
      let point = this.points[this.curFrontIndex]
      if (this.curTime >= point.time) {
        props.player.playChord(point.fretChord, .8, point.durationMs / 1000, defaultRhythm)
        highlightNode(point.node)
      } else {
        break;
      }
      this.curFrontIndex++
    }

    if (this.curBackIndex == this.points.length) {
      this.onStop()
      this.ticker.stop()
    }
  }

  play(timeline : TimelinePoint[]) {
    this.stop()

    this.curFrontIndex = 0
    this.curBackIndex = 0
    this.curTime = 0
    this.points = timeline
    this.deltaTime.start()
    this.ticker.start()
  }

  stop() {
    while(this.curBackIndex < this.curFrontIndex) {
      let point = this.points[this.curBackIndex]
      unhighlightNode(point.node)
      this.curBackIndex++
    }

    props.player.stop()
    this.ticker.stop()
  }
}

const sheetPlayer = new SheetPlayer(120.0, () => {
  started.value = false
})

function addChord(timeline, node : SheetNode, curTime, intervalMs) {
  if (node.isChord()) {
    let fretChord = FretChordManager.getFretChord(node.chord)
    timeline.push(new TimelinePoint(curTime, node, fretChord, intervalMs))
    curTime += intervalMs
  }
  if (node.isUnderline()) intervalMs /= 2;

  for (let child of node.children) { 
    curTime = addChord(timeline, child, curTime, intervalMs); 
  }
  if (node.isUnderline()) intervalMs *= 2;

  return curTime
}

function togglePlay() {
  assert(props.player.isReady(), "Call load before play")
  started.value = !started.value;
  if (started.value) {
    const intervalMs = (4 * 60000) / sheetPlayer.bpm // 4/4
    let timeline = []
    addChord(timeline, props.root, 0, intervalMs)
    
    sheetPlayer.play(timeline);
  } else {
    sheetPlayer.stop();
  }
}
</script>

<style scoped lang="scss">
#sheet_player {
  display: flex;
  justify-content: center;
  align-items: center;
}
#play_button {
  height: 30px;
  width: 30px;
  margin: 5px 0;
  border-radius: 50%;
  border: 4px var(--foreground-color) solid;

  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
</style>