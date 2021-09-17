<template>
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
        name: 'Test'
      },
    }
  },
  mounted() {
    // this.chord = g_ChordManager.getChord("#Cm")
    this.chord = {
      name: "Fm",
      stringNum: 6,
      startFret: 1,
      fretNum: 4,
      rootString: null,
      disabledStrings: [5, 4],
      fingerings: [
          {
              finger: 1,
              fret: 1,
              startString: 1,
              endString: 6
          },
          {
              finger: 3,
              fret: 3,
              startString: 5,
              endString: null
          },
          {
              finger: 4,
              fret: 3,
              startString: 4,
              endString: null
          },
      ]
    }
    console.log(this.chord)
  }
}
</script>