<template>
  <div class="container" ref="container" :style="getGlobalCssVar()">
    <ChordError v-if="error" />
    <ChordPlaceholder v-else-if="usePlaceholder" :text="placeholder" />
    <div v-else class="chord" :style="calChordStyle()">
      <div class="name" ref="name" :style="`font-size: ${chordLayout.titleFontSize}px`">{{formattedChord.name}}</div>
      <div class="graph" ref="graph">
        <div v-if="isFretMarkVisable()" class="start_fret flex-center" :style="getFretMarkStyle()">{{formattedChord.startFret}}</div>
        <div class="board" :style="getChordPadding()" ref="board">
          <div v-for="string in formattedChord.disabledStrings" :key="string" class="cross" :style="getDisabledMarkStyle(string)"/>
          <div class="fret fret_bold" style="top: 0" />
          <div v-for="i in formattedChord.fretNum" :key="i" class="fret" :style="`top: ${i / formattedChord.fretNum * 100}%`" />
          <div v-for="i in formattedChord.stringNum" :key="i" :class="`string ${(formattedChord.stringNum - i + 1) == formattedChord.rootString ? 'string_root' : ''}`" :style="`left: ${(i - 1) / (formattedChord.stringNum - 1) * 100}%`"></div>
          <div class="fingerings">
            <div
              v-for="fingering in formattedChord.fingerings"
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
import ChordError from "./error.vue";
import ChordPlaceholder from "./placeholder.vue"
 
const MinChordGraphHeight = 400, MinChordGraphWidth = 300;
const FingerNameList = ["1", "2", "3", "4", "T"];

export default {
  name: "Chord",
  components: {
    ChordError, ChordPlaceholder
  },
  data() {
    return {
      error: false,
      usePlaceholder: false,
      $chordContainer: null,
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
      formattedChord: null,
    };
  },
  props: {
    chord: {
      type: Object,
      required: true,
    },
    placeholder: {
      type: String,
      default: "未知和弦"
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
  created() {
    this.updateLocalChord()
  },
  mounted() {
    this.$data.$chordContainer = this.$refs["container"]
    this.repaint()
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
      const fretInterval = 1 / this.formattedChord.fretNum;
      const stringInterval = 1 / (this.formattedChord.stringNum - 1);
      const markSize = this.chordLayout.markSize
      let fingeringStringNum = fingering.endString ? fingering.endString - fingering.startString + 1 : 1

      let top = `calc(${(fingering.fret - this.formattedChord.startFret + 0.5) * fretInterval * 100}% - ${markSize / 2}px)`
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
      if (!this.$data.$chordContainer) return {}

      let chordWidth = this.chordLayout.size.width
      let chordHeight = this.chordLayout.size.height
      let scaleX = this.$data.$chordContainer.clientWidth / chordWidth
      let scaleY = this.$data.$chordContainer.clientHeight / chordHeight
      return {
        width: `${chordWidth}px`,
        height: `${chordHeight}px`,
        transform: `scale(${scaleX}, ${scaleY})`,
      }
    },
    updateLocalChord()
    {
      this.error = false;

      let curChord = this.formatChordInfo(this.chord);
      if (!curChord || !this.checkChord(curChord)) {
        this.usePlaceholder = true;
        return;
      }
      this.formattedChord = curChord
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
    formatChordInfo(chord) {
      chord = JSON.parse(JSON.stringify(chord));
      let res = {};

      if (!chord) return null;
      res.name = chord.name ? chord.name : "";
      if (!chord.stringNum) return null; res.stringNum = chord.stringNum;
      res.startFret = parseInt(chord.startFret);
      if (chord.startFret == NaN) return null;
      res.fretNum = parseInt(chord.fretNum);
      if (res.fretNum == NaN) return null;
      res.rootString = parseInt(chord.rootString);
      if (res.rootString == NaN) return null;
      res.disabledStrings = chord.disabledStrings
        ? chord.disabledStrings
        : [];
      if (!Array.isArray(chord.disabledStrings)) return null;
      if (!Array.isArray(chord.fingerings)) return null;
      res.fingerings = [];
      for (let i in chord.fingerings) {
        let fingering = {}
        fingering.finger = chord.fingerings[i].finger
        fingering.fret = parseInt(chord.fingerings[i].fret);
        if (fingering.fret == NaN) return null;
        fingering.startString = parseInt(chord.fingerings[i].startString);
        if (fingering.startString == NaN) return null;
        if (chord.fingerings[i].endString == null) fingering.endString = null;
        else
        {
          fingering.endString = parseInt(chord.fingerings[i].endString);
          if (fingering.endString == NaN) return null;
        }
        res.fingerings.push(fingering);
      }
      return res;
    },
    checkChord(chord) {
      if (!chord) {
        console.error("和弦为空");
        return false;
      }

      if (!chord.stringNum) {
        console.error("和弦未指定弦数量");
        return false;
      }

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
      if (this.formattedChord.disabledStrings.length > 0)
        top += 0.08
      // 如果要显示品位标记，指板左侧需要预留
      if (this.isFretMarkVisable()) left += 0.05
      // 如果最左/右侧存在指法，则左/右侧需要预留
      let reserveLeft = false, reserveRight = false
      for(let fingering of this.formattedChord.fingerings) {
        if (fingering.startString == this.formattedChord.stringNum || fingering.endString == this.formattedChord.stringNum) 
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
      let fretInterval = 1 / this.formattedChord.fretNum
      let stringInterval = 1 / (this.formattedChord.stringNum - 1)
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
      return this.formattedChord.startFret > 1
    },
    getActualChordGraphLayout() {
      // 获取父元素长宽
      let parentWidth = this.$data.$chordContainer.clientWidth;
      let parentHeight = this.$data.$chordContainer.clientHeight;

      let actualWidth = parentWidth;
      let actualHeight = parentHeight;

      // 限制最低长宽，更小的使用缩放实现，避免chrome字体不能小于12px的限制
      if (parentWidth < MinChordGraphWidth) actualWidth = MinChordGraphWidth;
      if (parentHeight < MinChordGraphHeight)
        actualHeight = MinChordGraphHeight;
      return [actualWidth, actualHeight];
    },
    getFretMarkStyle() {
      const fretInterval = 1 / this.formattedChord.fretNum;
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
      const stringInterval = 1 / (this.formattedChord.stringNum - 1);
      return {
        width: `${markSize}px`,
        height: `${markThick}px`,
        top: `${-markSize * 0.7}px`,
        left: `${(this.formattedChord.stringNum - string) * stringInterval * 100}%`,
      }
    }
  },
  watch: {
    chord: function () {
      this.updateLocalChord()
      this.repaint()
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
