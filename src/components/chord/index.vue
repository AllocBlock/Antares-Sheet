<template>
  <div class="container" ref="container">
    <ChordError v-if="error" />
    <div class="chord" :style="`transform: scale(${scale.x}, ${scale.y})`">
      <div class="name" ref="name" :style="`font-size: ${chordLayout.titleFontSize}px`">{{chord.name}}</div>
      <div class="graph" ref="graph">
        <div v-if="isFretMarkVisable()" class="start_fret flex-center" :style="getFretMarkStyle()">{{chord.startFret}}</div>
        <div class="board" :style="getChordPadding()" ref="board">
          <div v-for="string in chord.disabledStrings" :key="string" class="cross" :style="getDisabledMarkStyle(string)"/>
          <div class="fret fret_bold" style="top: 0" />
          <div v-for="i in chord.fretNum" :key="i" class="fret" :style="`top: ${i / chord.fretNum * 100}%`" />
          <div v-for="i in chord.stringNum" :key="i" :class="`string ${(chord.stringNum - i + 1) == chord.rootString ? 'string_root' : ''}`" :style="`left: ${(i - 1) / (chord.stringNum - 1) * 100}%`"></div>
          <div class="fingerings">
            <div
              v-for="fingering in chord.fingerings"
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

<script>
import $ from "jquery";
import ChordError from "./error";

const MinChordGraphHeight = 400, MinChordGraphWidth = 300;
const FingerNameList = ["1", "2", "3", "4", "T"];
const TitleRatio = 0.16;

export default {
  name: "Chord",
  components: {
    ChordError,
  },
  data() {
    return {
      error: true,
      $chordContainer: null,
      $chord: null,
      $graph: null,
      $board: null,
      chordLayout: {
        titleFontSize: 12,
        boardPadding: {
          left: 0.1,
          right: 0.1,
          top: 0.05,
          bottom: 0.1
        },
        markSize: 80,
      },
      scale: {
        x: 1.0,
        y: 1.0
      },
      style: {
        titleRatio: 0.16,
        colorString: "black",
        colorText: "white",
        colorRootString: "red"
      }
    };
  },
  props: {
    chord: {
      type: Object,
      required: true,
      default: function() {
        return {
          name: '😘'
        }
      }
    },
  },
  mounted() {
    this.$chordContainer = $(this.$refs["container"])
    this.$graph = $(this.$refs["graph"])
    this.$board = $(this.$refs["board"])
  },
  methods: {
    isBarChord(fingering) {
      let fingeringStringNum = fingering.endString ? fingering.endString - fingering.startString + 1 : 1
      return fingeringStringNum > 1
    },
    calFingeringStyle(fingering) {
      const fretInterval = 1 / this.chord.fretNum;
      const stringInterval = 1 / (this.chord.stringNum - 1);
      const markSize = this.chordLayout.markSize
      let fingeringStringNum = fingering.endString ? fingering.endString - fingering.startString + 1 : 1

      let top = `calc(${(fingering.fret - this.chord.startFret + 0.5) * fretInterval * 100}% - ${markSize / 2}px)`
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
    // 自动适配
    fit() {
      let scaleX = $chordContainer.width() / this.$chord.width();
      let scaleY = $chordContainer.height() / this.$chord.height();
      this.$chordContainer.css({
        transform: `scale(${scaleX}, ${scaleY})`,
      });
    },
    update() {
      // 绘制和弦的核心函数
      this.error = false;

      let chord = this.chord;
      chord = this.formatChordInfo(chord);
      if (!chord || !this.checkChord(chord)) {
        this.error = true;
        return;
      }
      this.updateTitleFontSize()
      this.updateLayout()
    },
    formatChordInfo(chord) {
      if (!chord) return null;
      chord.name = chord.name ? chord.name : "";
      if (!chord.stringNum) return null;
      chord.startFret = parseInt(chord.startFret);
      if (chord.startFret == NaN) return null;
      chord.fretNum = parseInt(chord.fretNum);
      if (chord.fretNum == NaN) return null;
      if (chord.rootString) chord.rootString = parseInt(chord.rootString);
      if (chord.rootString == NaN) return null;
      chord.disabledStrings = chord.disabledStrings
        ? chord.disabledStrings
        : [];
      if (!Array.isArray(chord.disabledStrings)) return null;
      chord.fingerings = chord.fingerings ? chord.fingerings : [];
      if (!Array.isArray(chord.fingerings)) return null;
      for (let i in chord.fingerings) {
        chord.fingerings[i].fret = parseInt(chord.fingerings[i].fret);
        if (chord.fingerings[i].fret == NaN) return null;
        chord.fingerings[i].startString = parseInt(
          chord.fingerings[i].startString
        );
        if (chord.fingerings[i].startString == NaN) return null;
        chord.fingerings[i].endString = parseInt(chord.fingerings[i].endString);
        if (chord.fingerings[i].endString == NaN) return null;
      }
      return chord;
    },
    checkChord(chord) {
      if (chord.name.length == 0)
        console.warn("和弦渲染：和弦没有指定名称");
      if (chord.stringNum <= 0) {
        console.error(
          `和弦渲染：琴弦数量需要大于0，而当前的值为${chord.stringNum}`
        );
        return false;
      }
      if (chord.startFret <= 0) {
        if (chord.startFret == 0)
          console.warn(`和弦渲染：起始品格不能为0，已自动修正为1`);
        else {
          console.error(
            `和弦渲染：起始品格需要大于0，而当前的值为${chord.startFret}`
          );
          return false;
        }
      }
      if (chord.fretNum <= 0) {
        console.error(
          `和弦渲染：品格数需要大于0，而当前的值为${chord.fretNum}`
        );
        return false;
      }
      if (
        chord.rootString != null &&
        (chord.rootString <= 0 || chord.rootString > chord.stringNum)
      ) {
        console.error(
          `和弦渲染：根音弦为null或取[1-${chord.stringNum}]，而当前的值为${chord.rootString}`
        );
        return false;
      }
      for (let disabledString of chord.disabledStrings) {
        if (disabledString <= 0 || disabledString > chord.stringNum) {
          console.error(
            `和弦渲染：禁用弦的范围是[1-${chord.stringNum}]，而存在禁用弦的值为${disabledString}`
          );
          return false;
        }
      }
      for (let fingering of chord.fingerings) {
        // 指法检查
        let fingerIndex = FingerNameList.findIndex(
          (f) => f == fingering.finger
        );
        if (fingerIndex < 0 || fingerIndex > FingerNameList.length) {
          console.error(
            `和弦渲染：指法存在错误，手指标号可选的值为`,
            FingerNameList,
            `，而当前值为${fingering.finger}`
          );
          return false;
        }
        if (
          fingering.fret < chord.startFret ||
          fingering.fret >= chord.fretNum + chord.startFret
        ) {
          console.error(
            `和弦渲染：指法存在错误，品位标号的范围是[${chord.startFret}-${
              chord.startFret + chord.fretNum
            }]，而存在值为${fingering.fret}`
          );
          return false;
        }
        if (
          fingering.startString < 1 ||
          fingering.startString > chord.stringNum
        ) {
          console.error(
            `和弦渲染：指法存在错误，起始琴弦标号的范围是[1-${chord.stringNum}]，而存在值为${fingering.startString}`
          );
          return false;
        }
        if (
          fingering.endString &&
          (fingering.startString > fingering.endString ||
            fingering.endString > chord.stringNum)
        ) {
          console.error(
            `和弦渲染：指法存在错误，结束琴弦标号可以为null或取[${fingering.startString}（起始）-${chord.stringNum}]，而存在值为${fingering.endString}`
          );
          return false;
        }
      }

      return true;
    },
    updateTitleFontSize() {
      let $title = $(this.$refs['name'])
      const width = this.$chordContainer.width()
      const height = $title.height()
      const maxWidth = width * 0.9
      this.chordLayout.titleFontSize = height * 0.9
      this.$nextTick(() => {
        let curWidth = $title.width()
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
      if (this.chord.disabledStrings.length > 0)
        top += 0.08
      // 如果要显示品位标记，指板左侧需要预留
      if (this.isFretMarkVisable()) left += 0.05
      // 如果最左/右侧存在指法，则左/右侧需要预留
      let reserveLeft = false, reserveRight = false
      for(let fingering of this.chord.fingerings) {
        if (fingering.startString == this.chord.stringNum || fingering.endString == this.chord.stringNum) 
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
      let fretInterval = 1 / this.chord.fretNum
      let stringInterval = 1 / (this.chord.stringNum - 1)
      let graphWidthPx = this.$graph.width()
      let graphHeightPx = this.$graph.height()
      let boardWidthPx = graphWidthPx * (1 - left - right);
      let boardHeightPx = graphHeightPx * (1 - top - bottom);
      let markSize = Math.min(
        boardWidthPx * stringInterval * 1.2,
        boardHeightPx * fretInterval * 0.6,
      );
      this.chordLayout.markSize = markSize
    },
    isFretMarkVisable() {
      return this.chord.startFret > 1
    },
    getActualChordGraphLayout() {
      // 获取父元素长宽
      let parentWidth = this.$chordContainer.width();
      let parentHeight = this.$chordContainer.height();

      let actualWidth = parentWidth;
      let actualHeight = parentHeight;

      // 限制最低长宽，更小的使用缩放实现，避免chrome字体不能小于12px的限制
      if (parentWidth < MinChordGraphWidth) actualWidth = MinChordGraphWidth;
      if (parentHeight < MinChordGraphHeight)
        actualHeight = MinChordGraphHeight;
      return [actualWidth, actualHeight];
    },
    getFretMarkStyle() {
      const fretInterval = 1 / this.chord.fretNum;
      const padding = this.chordLayout.boardPadding
      let top = padding.top
      const width = 0.1
      let height = fretInterval * (1 - padding.top - padding.bottom)
      let fontSize = Math.min(this.$graph.width() * width, this.$graph.height() * height) * 0.9
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
      const stringInterval = 1 / (this.chord.stringNum - 1);
      return {
        width: `${markSize}px`,
        height: `${markThick}px`,
        top: `${-markSize * 0.7}px`,
        left: `${(this.chord.stringNum - string) * stringInterval * 100}%`,
      }
    }
  },
  watch: {
    chord: function () {
      this.$nextTick(() => {
        this.update();
      });
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
  color: black;
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
  background-color: black;
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
  background-color: black;
}

.string_root {
  background-color: red !important;
}

.fingering {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 40px;

  display: flex;
  align-items: center;

  background-color: black;
  color: white;
  font-weight: bold;
}

.start_fret {
  color: black;
  position: absolute;
  z-index: 1;
}

.cross {
  position: absolute;
  width: 12px;
  height: 2px;
  transform: translateX(-50%);
}
.cross:before {
  position: absolute;
  left: 0;
  top: 0;
  content: "";
  width: 100%;
  height: 100%;
  background: black;
  transform: rotate(45deg);
}
.cross:after {
  position: absolute;
  left: 0;
  top: 0;
  content: "";
  width: 100%;
  height: 100%;
  background: black;
  transform: rotate(-45deg);
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
