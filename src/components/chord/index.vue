<template>
  <div class="chord_container" ref="chord_container">
    <ChordError v-if="error" />
    <div class="chord" :style="`transform: scale(${scale.x}, ${scale.y})`">
      <div class="chord-name" :style="`fontSize: ${chordLayout.titleFontSize}px`">{{chord.name}}</div>
      <div class="chord-graph" ref="graph">
        <div class="chord-board" :style="chordLayout.boardPadding" ref="board">
          <div class="chord-fret-bold" style="top: 0" />
          <div v-for="i in chord.fretNum" :key="i" class="chord-fret" :style="`top: ${i / chord.fretNum * 100}%`" />
          <div v-for="i in chord.stringNum" :key="i" class="chord-string" :style="`left: ${(i - 1) / (chord.stringNum - 1) * 100}%`"></div>
          <div class="chord-fingerings">
            <div
              v-for="fingering in chord.fingerings"
              :key="fingering"
              class="chord-fingering"
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

const MinChordGraphHeight = 400,
  MinChordGraphWidth = 300;
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
          left: '10%',
          right: '10%',
          top: '5%',
          bottom: '10%'
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
    document.documentElement.style.setProperty(
      "--chord-renderer-title-ratio",
      `${TitleRatio * 100}%`
    );
    $(document).on("fit", ".chord", (e) => {
      // 缩放事件
      _chordBlockFit($(e.currentTarget));
    });

    this.$chordContainer = $(this.$refs["chord_container"])
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
    draw() {
      // 绘制和弦的核心函数
      this.error = false;

      let chord = this.chord;
      chord = this.formatChordInfo(chord);
      if (!chord || !this.checkChord(chord)) {
        this.error = true;
        return;
      }
      //this.$chordContainer.empty(); // 清除元素内容

      // 创建和弦
      let [chordWidth, chordHeight] = this.getActualChordGraphLayout();
      this.createChord(chord, chordWidth, chordHeight);
      // this.$chordContainer.append(this.$chord);
      this.$chordContainer.css({
        "transform-origin": "left top",
      });
      this.$chordContainer.trigger("fit");
    },
    drawChordNotFound(name) {
      let fontSize = 20;
      let $textChord = $(`<div></div>`);
      let $name = $(`<div>${name}</div>`);
      let $newFoundText = $("<div>未找到</div>");
      $textChord.addClass("chord-block chord-block-not-found");
      $textChord.css("font-size", `${fontSize}px`);
      $textChord.append($name);
      $textChord.append($newFoundText);
      this.$chordContainer.empty();
      this.$chordContainer.append($textChord);

      fontSize =
        (fontSize / $name.width()) * this.$chordContainer.width() * 0.8;
      $textChord.css("font-size", `${fontSize}px`);
    },
    createChord(chord, width, height) {
      // 添加标题
      let fontSize = height * TitleRatio * 0.8
      this.updateTitleFontSize(fontSize, width * 0.9)
      this.updateLayout()

      // 添加和弦图
      // let $chordGraph = this.createGraph(chord, width, height);
      // $chordContainer.append($chordGraph);

      // 添加事件
      // $chordGraph.on("fit", (e) => {
      //   if (e.target.tagName != "CHORD-BLOCK") return;
      //   _chordBlockFit($(e.target));
      // });
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
    updateTitleFontSize(fontSize, maxWidth) {
      this.$nextTick(() => {
        let $title = $(this.$refs['title'])
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
      // 如果要显示品位标记，指板左侧需要预留
      if (this.isFretMarkVisable()) left += 0.05
      // 如果最左/右侧存在指法，则左/右侧需要预留
      let reserveLeft = false, reserveRight = false
      for(let fingering of this.chord.fingerings) {
        if (fingering.startString == 1) reserveLeft = true
        else if (fingering.startString == this.chord.stringNum || fingering.endString == this.chrod.stringNum) reserveRight = true
      }
      if (reserveLeft) left += 0.05
      if (reserveRight) right += 0.05

      this.chordLayout.boardPadding = {
        top: (top * 100) + '%',
        bottom: (bottom * 100) + '%',
        left: (left * 100) + '%',
        right: (right * 100) + '%',
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
    createGraph(chord, width, height) {
      const PaddingLeft = 0.1;
      const PaddingRight = 0.1;
      const PaddingTop = 0.05;
      const PaddingBottom = 0.1;
      const StartFretMarkWidth = 0.14; // 起始品格占比
      const DisableStringMarkHeight = 0.05; // 禁用弦占比

      const predictButtonSize = 0.1; // 预测的指法大小，当执法在1弦和最后一弦时会突出一部分，需要预留空间

      let startFretReserve = chord.startFret > 1;
      let buttonReserveLeft = false,
        buttonReserveRight = false;
      for (let fingering of chord.fingerings) {
        if (fingering.startString == 1)
          // 如果1弦有指法，右边需要预留
          buttonReserveRight = true;
        if (fingering.startString == 4 || fingering.endString == 4) {
          // 如果最后弦有指法
          if (
            chord.startFret == 1 ||
            (chord.startFret > 1 && fingering.fret === chord.startFret)
          ) {
            // 如果没有起始标记，需要留；如果有标记，但标记挨着指法，也需要留；
            buttonReserveLeft = true;
          }
        }
      }

      // 计算琴弦范围
      let stringStart = 0.0,
        stringEnd = 1.0;
      if (PaddingLeft) stringStart += PaddingLeft;
      if (PaddingRight) stringEnd -= PaddingRight;
      if (startFretReserve) stringStart += StartFretMarkWidth;
      if (buttonReserveLeft) stringStart += predictButtonSize / 2;
      if (buttonReserveRight) stringEnd -= predictButtonSize / 2;

      let fretStart = 0.0,
        fretEnd = 1.0;
      if (PaddingTop) fretStart += PaddingTop;
      if (PaddingBottom) fretEnd -= PaddingBottom;
      let disableStringReserve = chord.disabledStrings.length > 0;

      if (disableStringReserve) fretStart += DisableStringMarkHeight;

      let fretInterval = 1 / chord.fretNum;
      let stringInterval = 1 / (chord.stringNum - 1);

      // 添加指板，存放琴弦和品丝
      let $chordGraph = $("<div></div>");
      $chordGraph.addClass("chord-graph");

      // 添加起始品位
      if (chord.startFret > 1) {
        let startFretWidth = StartFretMarkWidth;
        let startFretHeight = fretInterval * (fretEnd - fretStart);
        let fontSize =
          Math.min(width * startFretWidth, height * startFretHeight) * 0.8;
        let $startFretMark = _createStartFret(chord.startFret);
        $startFretMark.css({
          left: 0,
          top: `${fretStart * 100}%`,
          width: `${startFretWidth * 100}%`,
          height: `${startFretHeight * 100}%`,
          "font-size": `${fontSize}px`,
          "z-index": 1, // 保证在最上层
        });
        $chordGraph.append($startFretMark);
      }

      // 添加指板
      

      let $chordBoard = _createBoard(chord, markSize);
      $chordBoard.css({
        left: `${stringStart * 100}%`,
        right: `${(1 - stringEnd) * 100}%`,
        top: `${fretStart * 100}%`,
        bottom: `${(1 - fretEnd) * 100}%`,
      });
      $chordGraph.append($chordBoard);

      return $chordGraph;
    },
    createStartFret(fretName) {
      let $startFretMark = $("<div></div>");
      $startFretMark.addClass("chord-start-fret");
      $startFretMark.addClass("flex-center");
      $startFretMark.text(fretName);

      return $startFretMark;
    },
    createBoard(chord, markSize) {
      let $chordBoard = $("<div></div>");
      $chordBoard.addClass("chord-board");

      // 品丝
      let frets = _createFrets(chord.fretNum);
      for (let $fret of frets) $chordBoard.append($fret);

      // 琴弦
      let strings = _createStrings(chord.stringNum, chord.rootString);
      for (let $string of strings) $chordBoard.append($string);

      // 添加禁用弦
      let crossSize = 30;
      let crossThick = crossSize / 8;
      let disableMarks = _createDsiableStringMarks(
        chord.disabledStrings,
        chord.stringNum,
        crossSize,
        crossThick
      );
      for (let $mark of disableMarks) $chordBoard.append($mark);

      // 添加指法层
      let $fingerings = _createFingerings(
        chord.name,
        chord.fingerings,
        chord.stringNum,
        chord.startFret,
        chord.fretNum,
        markSize
      );
      $chordBoard.append($fingerings);

      return $chordBoard;
    },
    createFrets(fretNum) {
      let frets = [];

      let fretInterval = 1 / fretNum;
      for (let i = 0; i <= fretNum; i++) {
        let $fret = $("<div></div>");
        if (i == 0) $fret.addClass("chord-fret-bold");
        else $fret.addClass("chord-fret");

        $fret.css("top", `${i * fretInterval * 100}%`);
        frets.push($fret);
      }

      return frets;
    },
    createStrings(stringNum, rootString = null) {
      let strings = [];

      let stringInterval = 1 / (stringNum - 1);
      for (let i = 0; i < stringNum; i++) {
        let string = stringNum - i;
        let $string = $("<div></div>");
        if (rootString && string == rootString) {
          $string.addClass("chord-string-root");
        } else {
          $string.addClass("chord-string");
        }

        $string.css("left", `${i * stringInterval * 100}%`);
        strings.push($string);
      }
      return strings;
    },
    createDsiableStringMarks(
      disabledStrings,
      stringNum,
      markSize,
      markThickness
    ) {
      let marks = [];

      let stringInterval = 1 / (stringNum - 1);
      for (let string of disabledStrings) {
        let $mark = $("<div></div>");
        $mark.addClass("chord-cross");
        $mark.css({
          width: `${markSize}px`,
          height: `${markThickness}px`,
          top: `${-markSize * 0.7}px`,
          left: `${(stringNum - string) * stringInterval * 100}%`,
        });
        marks.push($mark);
      }

      return marks;
    },
    createFingerings(
      name,
      fingerings,
      stringNum,
      startFret,
      fretNum,
      markSize
    ) {
      let fretInterval = 1 / fretNum;
      let stringInterval = 1 / (stringNum - 1);

      let $fingerings = $("<div></div>");
      $fingerings.addClass("chord-fingerings");

      for (let fingering of fingerings) {
        let finger = fingering.finger;
        let fret = fingering.fret;
        let startString = fingering.startString;
        let endString = fingering.endString;
        let fingeringStringNum = endString ? endString - startString + 1 : 1;

        // 创建指法
        let $fingering = $("<div></div>");
        $fingering.addClass("chord-fingering");
        let fingeringWidth, fingeringHeight;
        let flexMethod;
        if (fingeringStringNum == 1) {
          // 无横按
          fingeringWidth = `${markSize}px`;
          fingeringHeight = `${markSize}px`;
          flexMethod = "center";
          $fingering.text(finger);
        } else {
          fingeringWidth = `calc(${markSize}px + ${
            (fingeringStringNum - 1) * stringInterval * 100
          }%)`;
          fingeringHeight = `${markSize}px`;
          flexMethod = "space-between";
          let number = `<div class='flex-center' style='width:${markSize}px;'>${finger}<div>`;
          $fingering.append(number);
          $fingering.append(number);
        }
        $fingering.css({
          top: `calc(${(fret - startFret + 0.5) * fretInterval * 100}% - ${
            markSize / 2
          }px)`,
          right: `calc(${(startString - 1) * stringInterval * 100}% - ${
            markSize / 2
          }px)`,
          width: fingeringWidth,
          height: fingeringHeight,
          "justify-content": flexMethod,
          "font-size": markSize * 0.7,
        });

        $fingerings.append($fingering);
      }

      return $fingerings;
    },

    /* 计算文本实际长度 */
    textLen(text, element) {
      let fontSize = $(element).css("font-size");
      let fontFamily = $(element).css("font-family");

      let font = fontSize + " " + fontFamily;
      let tempElement = $("<div>" + text + "</div>")
        .css({
          position: "absolute",
          float: "left",
          "white-space": "nowrap",
          visibility: "hidden",
          font: font,
        })
        .appendTo($("body"));
      let width = tempElement.width();

      tempElement.remove();
      return width;
    },
  },
  watch: {
    chord: function () {
      this.$nextTick(() => {
        this.draw();
      });
    },
  },
};
</script>

<style scoped>
.chord_container {
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

  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.chord-name {
  color: black;
  position: absolute;
  width: 100%;
  height: 16%;
  top: 0;

  text-align: center;
  overflow: visible;
  white-space: nowrap;

  font-size: 40px;

  background: none;
}
.chord-graph {
  position: absolute;
  width: 100%;
  height: calc(100% - 16%);
  bottom: 0;
}
.chord-board {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}
.chord-fingerings {
  position: absolute;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
}
.chord-fret {
  position: absolute;
  left: 0;
  height: 1%;
  min-height: 1px;
  width: 101%;
  background-color: black;
}

.chord-fret-bold {
  position: absolute;
  left: 0;
  height: 3%;
  min-height: 3px;
  width: 100%;
  background-color: black;
}

.chord-string {
  position: absolute;
  top: 0;
  width: 1%;
  min-width: 1px;
  height: 100%;
  background-color: black;
}

.chord-string-root {
  position: absolute;
  top: 0;
  width: 1%;
  min-width: 1px;
  height: 100%;
  background-color: red;
}

.chord-fingering {
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

.chord-start-fret {
  color: black;
  position: absolute;
}

.chord-cross {
  position: absolute;
  width: 12px;
  height: 2px;
  transform: translateX(-50%);
}
.chord-cross:before {
  position: absolute;
  left: 0;
  top: 0;
  content: "";
  width: 100%;
  height: 100%;
  background: black;
  transform: rotate(45deg);
}
.chord-cross:after {
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

/* 未找到和弦时使用的样式 */
.chord-block-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  white-space: pre-wrap;
}

.chord-block-error {
  font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  color: rgba(255, 0, 0, 0.5);
}
.chord-block-not-found {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.chord-block-not-found > *:first-child {
  font-size: 100%;
  color: tomato;
}
.chord-block-not-found > *:nth-child(2) {
  font-size: 20%;
  color: grey;
}
</style>
