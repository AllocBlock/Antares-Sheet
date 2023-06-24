<template>
  <div class="container" ref="container" :style="getGlobalCssVar()">
    <ChordError v-if="!isValid" />
    <ChordPlaceholder v-else-if="usePlaceholder" :text="placeholder" />
    <div v-else class="chord" :style="calChordStyle()">
      <div class="name" ref="name" :style="`font-size: ${chordLayout.titleFontSize}px`">{{fretChordOrChord.chord.toString()}}</div>
      <div class="graph" ref="graph">
        <div v-if="isFretMarkVisable()" class="start_fret flex-center" :style="getFretMarkStyle()">{{fretChordOrChord.startFret}}</div>
        <div class="board" :style="getChordPadding()" ref="board">
          <div v-for="string in fretChordOrChord.disabledStrings" :key="string" class="cross" :style="getDisabledMarkStyle(string)"/>
          <div class="fret fret_bold" style="top: 0" />
          <div v-for="i in fretChordOrChord.fretNum" :key="i" class="fret" :style="`top: ${i / fretChordOrChord.fretNum * 100}%`" />
          <div v-for="i in fretChordOrChord.stringNum" :key="i" :class="`string ${(fretChordOrChord.stringNum - i + 1) == fretChordOrChord.rootString ? 'string_root' : ''}`" :style="`left: ${(i - 1) / (fretChordOrChord.stringNum - 1) * 100}%`"></div>
          <div class="fingerings">
            <div
              v-for="fingering in fretChordOrChord.fingerings"
              :key="fingering"
              class="fingering"
              :style="calFingeringStyle(fingering)"
            >
              <div v-for="i in (isBarChord(fingering) ? 2 : 1)" :key="i" class="flex-center" :style="`width: ${chordLayout.markSize}px`">
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
import { log } from "tone/build/esm/core/util/Debug";
import ChordError from "./error.vue";
import ChordPlaceholder from "./placeholder.vue"
import { FretChord, Chord } from "@/utils/chord"

// TODO:!!!!!!!!!!!!!!!!
// use dynamic css property instead of manual updating!
 
const MinChordGraphHeight = 400, MinChordGraphWidth = 300;

export default {
  name: "FretChordGraph",
  components: {
    ChordError, ChordPlaceholder
  },
  data() {
    return {
      graphSize: {
        w: 0, h: 0
      },
      chordLayout: {
        size: {
          width: MinChordGraphWidth,
          height: MinChordGraphHeight,
        },
        titleFontSize: 12,
        boardPadding: {
          left: 0.1,
          right: 0.1,
          top: 0.05,
          bottom: 0.1
        },
        markSize: 0,
      },
    };
  },
  props: {
    fretChordOrChord: {
      type: [FretChord, Chord],
    },
    styles: {
      type: Object,
      default: function() {
        return {
          titleRatio: 0.16,
          colorMain: "var(--foreground-color)",
          colorMarkText: "var(--background-color)",
          colorRootString: "red"
        }
      }
    }
  },
  mounted() {
    this.repaint()
  },
  computed: {
    isValid() {
      if (!this.fretChordOrChord) return false;
      if (this.fretChordOrChord instanceof FretChord) {
        return this.fretChordOrChord.isValid()
      }
      return true
    },
    usePlaceholder() {
      return this.fretChordOrChord instanceof Chord
    },
    placeholder() {
      return "暂无和弦图" + this.fretChordOrChord.toString()
    },
  },
  methods: {
    getGlobalCssVar() {
      return {
        "--color-main": this.styles.colorMain ?? "black",
        "--color-mark-text": this.styles.colorMarkText ?? "white",
        "--color-root-string": this.styles.colorRootString ?? "red",
      }
    },
    isBarChord(fingering) {
      let fingeringStringNum = fingering.endString ? fingering.endString - fingering.startString + 1 : 1
      return fingeringStringNum > 1
    },
    calFingeringStyle(fingering) {
      const fretInterval = 1 / this.fretChordOrChord.fretNum;
      const stringInterval = 1 / (this.fretChordOrChord.stringNum - 1);
      const markSize = this.chordLayout.markSize
      let fingeringStringNum = fingering.endString ? fingering.endString - fingering.startString + 1 : 1

      let top = `calc(${(fingering.fret - this.fretChordOrChord.startFret + 0.5) * fretInterval * 100}% - ${markSize / 2}px)`
      let right = `calc(${(fingering.startString - 1) * stringInterval * 100}% - ${markSize / 2}px)`
      let width = markSize + "px"
      let height = markSize + "px"
      let justify = "center"
      let fontSize = (markSize * 0.7) + "px"
      if (this.isBarChord(fingering)) {
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
    calChordStyle() {
      if (!this.$refs["container"]) return {}

      let chordWidth = this.chordLayout.size.width
      let chordHeight = this.chordLayout.size.height
      let scaleX = this.$refs["container"].clientWidth / chordWidth
      let scaleY = this.$refs["container"].clientHeight / chordHeight
      return {
        width: `${chordWidth}px`,
        height: `${chordHeight}px`,
        transform: `scale(${scaleX}, ${scaleY})`,
      }
    },
    repaint() {
      let [width, height] = this.getActualChordGraphLayout()
      this.chordLayout.size.width = width
      this.chordLayout.size.height = height

      this.$nextTick(() => {
        if (!this.$refs.graph) return;

        this.graphSize.w = this.$refs.graph.clientWidth
        this.graphSize.h = this.$refs.graph.clientHeight

        this.updateTitleFontSize()
        this.updateLayout()
      })
    },
    updateTitleFontSize() {
      let $title = this.$refs['name']
      const width = this.chordLayout.size.width
      const height = $title.clientHeight
      const maxWidth = width * 0.9
      this.chordLayout.titleFontSize = height * 0.9
      this.$nextTick(() => {
        let curWidth = $title.clientWidth
        if (curWidth > maxWidth) {
          // 如果过长则减小字体
          this.chordLayout.titleFontSize = fontSize * (maxWidth / curWidth);
        }
      })
    },
    updateLayout() {
      // 需要根据品位、指法调整布局

      // 初始化指板布局
      let left = 0.1
      let right = 0.1
      let top = 0.05
      let bottom = 0.1
      // 如果有禁用弦，上方需要预留
      if (this.fretChordOrChord.disabledStrings.length > 0)
        top += 0.08
      // 如果要显示品位标记，指板左侧需要预留
      if (this.isFretMarkVisable()) left += 0.05
      // 如果最左/右侧存在指法，则左/右侧需要预留
      let reserveLeft = false, reserveRight = false
      for(let fingering of this.fretChordOrChord.fingerings) {
        if (fingering.startString == this.fretChordOrChord.stringNum || fingering.endString == this.fretChordOrChord.stringNum) 
          reserveLeft = true
        if (fingering.startString == 1) 
          reserveRight = true
      }
      if (reserveLeft) left += 0.05
      if (reserveRight) right += 0.05

      this.chordLayout.boardPadding = {
        top, bottom, left, right
      }

      // 更新按钮大小
      let fretInterval = 1 / this.fretChordOrChord.fretNum
      let stringInterval = 1 / (this.fretChordOrChord.stringNum - 1)
      let graphWidthPx = this.graphSize.w
      let graphHeightPx = this.graphSize.h
      let boardWidthPx = graphWidthPx * (1 - left - right);
      let boardHeightPx = graphHeightPx * (1 - top - bottom);
      let markSize = Math.min(
        boardWidthPx * stringInterval * 1.2,
        boardHeightPx * fretInterval * 0.7,
      );
      this.chordLayout.markSize = markSize
    },
    isFretMarkVisable() {
      return this.fretChordOrChord.startFret > 1
    },
    getActualChordGraphLayout() {
      // 获取父元素长宽
      let parentWidth = this.$refs["container"].clientWidth;
      let parentHeight = this.$refs["container"].clientHeight;

      let actualWidth = parentWidth;
      let actualHeight = parentHeight;

      // 限制最低长宽，更小的使用缩放实现，避免chrome字体不能小于12px的限制
      if (parentWidth < MinChordGraphWidth) actualWidth = MinChordGraphWidth;
      if (parentHeight < MinChordGraphHeight)
        actualHeight = MinChordGraphHeight;
      return [actualWidth, actualHeight];
    },
    getFretMarkStyle() {
      const fretInterval = 1 / this.fretChordOrChord.fretNum;
      const padding = this.chordLayout.boardPadding
      let top = padding.top
      const width = 0.1
      let height = fretInterval * (1 - padding.top - padding.bottom)
      let fontSize = Math.min(this.graphSize.w * width, this.graphSize.h * height) * 0.9
      return {
        top: `${top * 100}%`,
        height: `${height * 100}%`,
        width: `${width * 100}%`,
        fontSize: `${fontSize}px`,
      }
    },
    getChordPadding() {
      let padding = this.chordLayout.boardPadding
      return {
        top: `${padding.top * 100}%`,
        left: `${padding.left * 100}%`,
        right: `${padding.right * 100}%`,
        bottom: `${padding.bottom * 100}%`,
      }
    },
    getDisabledMarkStyle(string) {
      const markSize = 30
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
      this.repaint()
    },  },
};
</script>

<style scoped>
.container {
  position: relative;
  width: 100%;
  height: 100%;
}

.chord {
  position: absolute;
  width: 100%;
  height: 100%;
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
  color: var(--color-main);
  position: absolute;
  height: 16%;
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
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
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
  background-color: var(--color-main);
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
  background-color: var(--color-main);
}

.string_root {
  background-color: var(--color-root-string) !important;
}

.fingering {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 40px;

  display: flex;
  align-items: center;

  background-color: var(--color-main);
  color: var(--color-mark-text);
  font-weight: bold;
}

.start_fret {
  color: var(--color-main);
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
  background: var(--color-main);
  transform: rotate(45deg);
}
.cross::after {
  position: absolute;
  left: 0;
  top: 0;
  content: "";
  width: 100%;
  height: 100%;
  background: var(--color-main);
  transform: rotate(-45deg);
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
