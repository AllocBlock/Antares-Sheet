<template>
  <img alt="Vue logo" src="./assets/logo.png">
  <Chord style="width: 300px; height: 400px" :chord="chord" />
</template>

<script>
import Chord from '@/components/chord'
import ChordManager from '@/utils/chordManager'

const g_ChordManager = new ChordManager()

export default {
  name: 'App',
  components: {
    Chord
  },
  data() {
    return {
      chord: {
        name: 'Test#b7'
      },
    }
  },
  mounted() {
    this.chord = g_ChordManager.getChord("Cm")
    console.log(this.chord)
  }
}
</script>