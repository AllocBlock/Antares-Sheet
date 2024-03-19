<template>
  <div class="container" ref="container">
    <ChordError v-if="!isValid" />
    <ChordPlaceholder class="placeholder" v-else-if="usePlaceholder" :chordOrMsg="chord" />
    <div v-else class="chord">
      <div class="name" ref="name" :style="`font-size: ${layout.titleFontSize}px`">{{fretChord.chord.toString()}}</div>
      <div class="graph" ref="graph">
        <div v-if="isFretMarkVisable()" class="start_fret flex_hv_center" :style="getStartFretMarkStyle()">{{fretChord.startFret}}</div>
        <div class="board" ref="board">
          <div v-for="string in fretChord.disabledStrings" :key="string" class="cross" :style="getDisabledMarkStyle(string)"/>
          <div class="fret fret_bold" style="top: 0" />
          <div v-for="i in fretChord.fretNum" :key="i" class="fret" :style="`top: ${i / fretChord.fretNum * 100}%`" />
          <div v-for="i in fretChord.stringNum" :key="i" :class="`string ${(fretChord.stringNum - i + 1) == fretChord.rootString ? 'string_root' : ''}`" :style="`left: ${(i - 1) / (fretChord.stringNum - 1) * 100}%`"></div>
          <div class="fingerings">
            <div
              v-for="(fingering, index) in fretChord.fingerings"
              :key="index"
              class="fingering"
              :style="getFingeringStyle(fingering)"
            >
              <div v-for="i in (isBarreFinger(fingering) ? 2 : 1)" :key="i" class="flex_hv_center" :style="`width: ${layout.fingerMarkSize}px`">
                {{fingering.finger}}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { assert } from "@/utils/assert";
import ChordError from "./error.vue";
import ChordPlaceholder from "./placeholder.vue"
import { FretChord, Chord } from "@/utils/chord"

const MIN_GRAPH_HEIGHT = 400, MIN_GRAPH_WIDTH = 300;

export default {
  name: "FretChordGraph",
  components: {
    ChordError, ChordPlaceholder
  },
  data() {
    return {
      layout: {
        width: MIN_GRAPH_WIDTH,
        height: MIN_GRAPH_HEIGHT,
        scale: 1,
        titleRatio: 0.16,
        titleFontSize: 14,
        fingerMarkSize: 0,
        disableMarkSize: 0,
        boardPadding: {
          left: 0.1,
          right: 0.1,
          top: 0.05,
          bottom: 0.1
        },
      },
    };
  },
  props: {
    fretChordOrChord: {
      type: [FretChord, Chord],
    },
    styles: {
      type: Object,
      default: {
        foregroundColor: "var(--foreground-color)",
        backgroundColor: "var(--background-color)",
        rootStringColor: "var(--theme-color)",
      }
    }
  },
  mounted() {
    this.refresh()
  },
  computed: {
    isValid() {
      if (!this.fretChordOrChord) {
        return false;
      }
      if (this.fretChordOrChord instanceof FretChord) {
        return this.fretChordOrChord.isValid()
      }
      return true
    },
    usePlaceholder() {
      return this.fretChordOrChord instanceof Chord
    },
    fretChord() {
      assert(this.fretChordOrChord instanceof FretChord)
      return this.fretChordOrChord as FretChord
    },
    chord() {
      assert(this.fretChordOrChord instanceof Chord)
      return this.fretChordOrChord as Chord
    }
  },
  methods: {
    isBarreFinger(fingering) {
      let fingeringStringNum = fingering.endString ? fingering.endString - fingering.startString + 1 : 1
      return fingeringStringNum > 1
    },
    refresh() {
      if (!this.$refs["container"]) return;
      if (!(this.fretChordOrChord instanceof FretChord)) return;

      // 计算和弦图尺寸
      let parentWidth = this.$refs["container"].clientWidth;
      let parentHeight = this.$refs["container"].clientHeight;
      if (parentWidth == 0 || parentHeight == 0) return;

      let parentAspect = parentWidth / parentHeight;
      let [width, height, scale] = [parentWidth, parentHeight, 1];
      if (width < MIN_GRAPH_WIDTH) {
        scale *= width / MIN_GRAPH_WIDTH
        width = MIN_GRAPH_WIDTH
        height = MIN_GRAPH_WIDTH / parentAspect
      }
      if (height < MIN_GRAPH_HEIGHT) {
        scale *= height / MIN_GRAPH_HEIGHT
        width = MIN_GRAPH_HEIGHT * parentAspect
        height = MIN_GRAPH_HEIGHT
      }

      this.layout.width = width
      this.layout.height = height
      this.layout.scale = scale

      // 计算和弦名称字体大小
      let $title = this.$refs['name']
      const titleHeight = this.layout.height * this.layout.titleRatio
      const maxWidth = width * 0.9
      this.layout.titleFontSize = titleHeight * 0.9
      this.$nextTick(() => {
        let curWidth = $title.clientWidth
        if (curWidth > maxWidth) {
          // 如果过长则减小字体
          this.layout.titleFontSize /= (maxWidth / curWidth);
        }
      })

      // 需要根据品位、指法调整布局
      let left = 0.1
      let right = 0.1
      let top = 0.05
      let bottom = 0.1
      // 如果有禁用弦，上方需要预留
      if (this.fretChordOrChord.disabledStrings.length > 0)
        top += 0.08
      // 如果要显示品位标记，指板左侧需要预留
      if (this.isFretMarkVisable())
        left += 0.05
      // 如果最左/右侧存在指法，则左/右侧需要预留
      let reserveLeft = false, reserveRight = false
      for(let fingering of this.fretChordOrChord.fingerings) {
        if (fingering.startString == this.fretChordOrChord.stringNum || 
            fingering.endString == this.fretChordOrChord.stringNum) 
          reserveLeft = true
        if (fingering.startString == 1) 
          reserveRight = true
      }
      if (reserveLeft) left += 0.05
      if (reserveRight) right += 0.05

      this.layout.boardPadding = {
        top, bottom, left, right
      }

      // 更新指法标记、禁用弦标记大小
      let fretInterval = 1 / this.fretChordOrChord.fretNum
      let stringInterval = 1 / (this.fretChordOrChord.stringNum - 1)
      let boardWidth = this.layout.width * (1 - left - right);
      let boardHeight = this.layout.height * (1 - this.layout.titleRatio) * (1 - top - bottom);
      let fingerMarkSize = Math.min(
        boardWidth * stringInterval * 1.2,
        boardHeight * fretInterval * 0.7,
      );
      this.layout.fingerMarkSize = fingerMarkSize
      this.layout.disableMarkSize = fingerMarkSize * 0.5
    },
    isFretMarkVisable() {
      return this.fretChordOrChord.startFret > 1
    },
    
    getFingeringStyle(fingering) {
      const fretInterval = 1 / this.fretChordOrChord.fretNum;
      const stringInterval = 1 / (this.fretChordOrChord.stringNum - 1);
      const markSize = this.layout.fingerMarkSize
      let fingeringStringNum = fingering.endString ? fingering.endString - fingering.startString + 1 : 1

      let top = `calc(${(fingering.fret - this.fretChordOrChord.startFret + 0.5) * fretInterval * 100}% - ${markSize / 2}px)`
      let right = `calc(${(fingering.startString - 1) * stringInterval * 100}% - ${markSize / 2}px)`
      let width = markSize + "px"
      let height = markSize + "px"
      let justify = "center"
      let fontSize = (markSize * 0.7) + "px"
      if (this.isBarreFinger(fingering)) {
        width = `calc(${markSize}px + ${(fingeringStringNum - 1) * stringInterval * 100}%)`
        justify = 'space-between'
      }
    
      let style = {
        top, right, width, height, 
        'justify-content': justify,
        'font-size': fontSize
      }
      return style
    },
    getStartFretMarkStyle() {
      const fretInterval = 1 / this.fretChordOrChord.fretNum;
      const padding = this.layout.boardPadding
      let top = padding.top
      const widthRatio = 0.1
      const heightRatio = fretInterval * (1 - padding.top - padding.bottom)
      let fontSize = Math.min(this.layout.width * widthRatio, this.layout.height * heightRatio) * 0.9
      return {
        top: `${top * 100}%`,
        height: `${heightRatio * 100}%`,
        width: `${widthRatio * 100}%`,
        fontSize: `${fontSize}px`,
      }
    },
    getDisabledMarkStyle(string) {
      const markSize = this.layout.disableMarkSize
      const markThick = markSize / 8
      const stringInterval = 1 / (this.fretChordOrChord.stringNum - 1);
      return {
        width: `${markSize}px`,
        height: `${markThick}px`,
        top: `${-markSize * 0.7}px`,
        left: `${(this.fretChordOrChord.stringNum - string) * stringInterval * 100}%`,
      }
    }
  },
  watch: {
    fretChordOrChord() {
      this.refresh()
    },
  },
};
</script>

<style scoped>
.container {
  position: relative;
  width: 100%;
  height: 100%;
}

.placeholder {
  color: v-bind('styles.foregroundColor');
}
.chord {
  position: absolute;
  width: calc(v-bind('layout.width') * 1px);
  height: calc(v-bind('layout.height') * 1px);
  transform: scale(v-bind('layout.scale'));
  left: 0;
  top: 0;
  transform-origin: left top;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  user-select: none;
}

.name {
  color: v-bind('styles.foregroundColor');
  position: absolute;
  height: calc(v-bind('layout.titleRatio') * 100 * 1%);
  top: 0;

  text-align: center;
  overflow: visible;
  white-space: nowrap;

  font-size: 40px;

  background: none;
}
.graph {
  position: absolute;
  width: 100%;
  height: calc(100% - 16%);
  bottom: 0;
}
.board {
  position: absolute;
  left: calc(v-bind('layout.boardPadding.left') * 100 * 1%);
  right: calc(v-bind('layout.boardPadding.right') * 100 * 1%);
  top: calc(v-bind('layout.boardPadding.top') * 100 * 1%);
  bottom: calc(v-bind('layout.boardPadding.bottom') * 100 * 1%);
}
.fingerings {
  position: absolute;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
}
.fret {
  position: absolute;
  left: 0;
  height: 1%;
  min-height: 1px;
  width: 101%;
  background-color: v-bind('styles.foregroundColor');
}

.fret_bold {
  height: 3% !important;
  min-height: 3px !important;
  width: 100% !important;
}

.string {
  position: absolute;
  top: 0;
  width: 1%;
  min-width: 1px;
  height: 100%;
  background-color: v-bind('styles.foregroundColor');
}

.string_root {
  background-color: v-bind('styles.rootStringColor') !important;
}

.fingering {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 40px;

  display: flex;
  align-items: center;

  background-color: v-bind('styles.foregroundColor');
  color: v-bind('styles.backgroundColor');
  font-weight: bold;
}

.start_fret {
  color: v-bind('styles.foregroundColor');
  position: absolute;
  z-index: 1;
}

.cross {
  position: absolute;
  width: 12px;
  height: 2px;
  transform: translateX(-50%);
}
.cross::before {
  position: absolute;
  left: 0;
  top: 0;
  content: "";
  width: 100%;
  height: 100%;
  background: v-bind('styles.foregroundColor');
  transform: rotate(45deg);
}
.cross::after {
  position: absolute;
  left: 0;
  top: 0;
  content: "";
  width: 100%;
  height: 100%;
  background: v-bind('styles.foregroundColor');
  transform: rotate(-45deg);
}
</style>
