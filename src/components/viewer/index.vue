<template>
  <div id="sheet" v-if="loaded">
    <div id="chord" :style="`opacity: ${this.drawChord ? 1 : 0}`"></div>
    <div id="song_title" class="title">加载中</div>
    <div id="song_singer" class="title">...</div>
    <div id="sheet_key_block">
      <div id="sheet_key" class="title">...</div>
      <div id="sheet_key_shift">
        <div id="sheet_key_shift_up">▲</div>
        <div id="sheet_key_shift_down">▼</div>
      </div>
    </div>
    <div id="sheet_by" class="title">...</div>
    <div id="sheet_body_block"></div>
  </div>
</template>

<script type="module">

import { getQueryVariable } from "@/utils/webCommon.js";
import { drawChord } from "@/utils/webChordRender.js";
import { DigitalSheet } from "@/utils/webSheetParser.js";
import { ChordManager } from "@/utils/webChordManager.js";

let g_ChordManager = new ChordManager();

export default {
  name: "Viewer",
  data() {
    return {
      env: "pc",
      sheetLoaded: false,
      sheetBaseKey: null,
      sheetInfo: {}
    }
  },
  mounted() {
    // 检查环境
    if (document.body.clientWidth / document.body.clientHeight < 0.8) {
      // 竖屏
      $(document.body).attr("env", "mobile");
      this.env = "mobile";
    } else {
      $(document.body).attr("env", "pc");
      this.env = "pc";
    }
    changeScale(1.0);
    $(window).bind("resize", resizedHandler);

    let sheetName = getQueryVariable("sheet");
    loadSheet(`sheets/${sheetName}.sheet`).then(() => {
      this.sheetLoaded = true;
      updateSheetInfo();
      setupEvents();
    });
  },
  methods: {
    changeScale(scale) {
      scale = parseFloat(scale);
      if (this.env == "pc") {
        var defaultFontSize = 18;
        var defaultTitleFontSize = 30;
        document.documentElement.style.setProperty(
          "--base-font-size",
          `${defaultFontSize * scale}px`
        );
        document.documentElement.style.setProperty(
          "--title-base-font-size",
          `${defaultTitleFontSize * scale}px`
        );
      } else {
        var defaultFontSize = 4;
        var defaultTitleFontSize = 8;
        document.documentElement.style.setProperty(
          "--base-font-size",
          `${defaultFontSize * scale}vw`
        );
        document.documentElement.style.setProperty(
          "--title-base-font-size",
          `${defaultTitleFontSize * scale}vw`
        );
      }

      $("#scale_text").text(scale.toFixed(1));
      if (this.sheetLoaded) resizedHandler();
    },
    loadSheet(url) {
      return $.get({
        url: encodeURI(url),
        success: function (data, status) {
          let parsedSheet = new DigitalSheet(data);
          this.sheetInfo = {
            title: parsedSheet.getUniqueValue("title"),
            singer: parsedSheet.getUniqueValue("singer"),
            by: parsedSheet.getUniqueValue("by"),
            originalKey: parsedSheet.getUniqueValue("originalKey"),
            sheetKey: parsedSheet.getUniqueValue("sheetKey"),
            chords: parsedSheet.getArrayValue("chords"),
            rhythms: parsedSheet.getArrayValue("rhythms"),
            $sheet: parsedSheet.getSheetElement(),
          };
          this.sheetBaseKey = this.sheetInfo.sheetKey;
        },
        error: function () {
          $("#song_title").text("未找到曲谱");
        },
      });
    },

    updateSheetInfo() {
      $("#song_title").text(this.sheetInfo.title);
      $("#song_singer").text(this.sheetInfo.singer);
      $("#sheet_key").text(
        `原调 ${this.sheetInfo.originalKey} 选调 ${this.sheetInfo.sheetKey}`
      );
      $("#sheet_by").text(`制谱 ${this.sheetInfo.by}`);
      updateSheetBody();
    },

    updateSheetBody() {
      console.log("resize update info");
      // paper模式效率很低..
      // 保存滚动位置
      let scrollTop = document.body.scrollTop;

      let $sheetBodyBlock = $("#sheet_body_block");
      $sheetBodyBlock.empty();
      if (g_PageType == "none") {
        let $sheetBody = $("<div>");
        $sheetBody.addClass("sheet_body");
        $sheetBody.append(this.sheetInfo.$sheet);
        $sheetBodyBlock.append($sheetBody);

        this.sheetInfo.$sheet.trigger("fit");
      } else if (g_PageType == "A4") {
        let $sheetBody = $("<div page='paper'>");
        $sheetBody.addClass("sheet_body");
        $sheetBodyBlock.append($sheetBody);
        $sheetBody.height($sheetBody.width() * Math.sqrt(2));
        let pageHeight = $sheetBody.height();

        let i = 0;
        while (i < this.sheetInfo.$sheet.length) {
          // 获取一行
          let line = [];
          while (i < this.sheetInfo.$sheet.length) {
            let $e = $(this.sheetInfo.$sheet[i]);
            line.push($e);
            ++i;
            if ($e.is("newline") || $e.is("tab-box")) break;
          }

          // 放入当前页
          for (let $e of line) {
            $sheetBody.append($e);
            if ($e.is("tab-box")) $e.trigger("fit");
          }

          // 测试是否溢出，溢出则换页
          let element = line[line.length - 1][0];
          let elementBottom = 0,
            elementHeight = 0;
          if (element.nodeType === 3) {
            let rect = getTextNodeRect(element, $sheetBody);
            elementBottom = rect.bottom;
            elementHeight = rect.height;
          } else {
            elementBottom =
              $(element).offset().top +
              $(element).height() -
              $sheetBody.offset().top;
            elementHeight = $(element).height();
          }
          if (elementHeight < pageHeight && elementBottom > pageHeight) {
            $sheetBody = $("<div page='paper'>");
            $sheetBody.addClass("sheet_body");
            $sheetBodyBlock.append($sheetBody);
            $sheetBody.height($sheetBody.width() * Math.sqrt(2));
            for (let $e of line) {
              $sheetBody.append($e);
              if ($e.is("tab-box")) $e.trigger("fit");
            }
          }
        }
      }

      // 还原滚动位置
      document.body.scrollTop = scrollTop;
    },

    setupEvents() {
      $("#sheet_body_block").on("mouseenter", "chord, chord_pure", (e) => {
        let $element = $(e.currentTarget);
        let chordName =
          $element.prop("nodeName") == "CHORD"
            ? $element.find("chord_name").text()
            : $element.text();
        if (!chordName) return;
        drawChord("#chord", g_ChordManager.getChord(chordName));
        $("#chord").css("opacity", 1);
      });

      $("#sheet_body_block").on("mouseleave", "chord, chord_pure", (e) => {
        $("#chord").css("opacity", 0);
      });

      $("#sheet_body_block").on("click", "chord, chord_pure", (e) => {
        let $element = $(e.currentTarget);
        let chordName =
          $element.prop("nodeName") == "CHORD"
            ? $element.find("chord_name").text()
            : $element.text();
        playChord(g_ChordManager.getChord(chordName));
      });

      $("#sheet_key_shift_up").click(() => shiftKey(1));
      $("#sheet_key_shift_down").click(() => shiftKey(-1));

      $(document).bind("mouseup", () => {
        if (longPressing) {
          longPressing = false;
          clearTimeout(longPressTimer);
        }
      });

      $("#instrument_combo").bind("change", (e) => {
        g_CurrentInstrument = $(e.currentTarget).val();
      });
    },

    shiftKey(offset) {
      let curKey = this.sheetInfo.sheetKey;
      let newKey = g_ChordManager.shiftKey(curKey, offset);

      let $chords = $("chord_name,chord_pure");
      $chords.each((i, e) => {
        let $chord = $(e);
        let originalChord = $chord.text();
        let newChord = g_ChordManager.shiftKey(originalChord, offset);
        $chord.text(newChord);
      });

      if (this.sheetBaseKey == newKey) {
        $("tab-box").attr("state", "normal");
      } else {
        $("tab-box").attr("state", "disabled");
      }

      this.sheetInfo.sheetKey = newKey;

      updateSheetInfo();
    },

    let g_ScrollTimer = false;
    let g_AutoScrollSpeed = 0;
    changeAutoScrollSpeed(speed) {
      speed = parseFloat(speed);
      g_AutoScrollSpeed = speed;
      let text = speed == 0 ? "停止" : `x${speed.toFixed(1)}`;
      $("#auto_scroll_text").text(text);
      if (speed > 0) {
        clearTimeout(g_ScrollTimer);
        startAutoScroll();
      }
    },

    startAutoScroll() {
      function scroll() {
        document.body.scrollTop++;
      }

      function scrollLoop() {
        if (g_AutoScrollSpeed == 0) {
          g_ScrollTimer = null;
          return;
        }
        scroll();

        let delay = 100 / g_AutoScrollSpeed;
        g_ScrollTimer = setTimeout(scrollLoop, delay, 1);
      }
      scrollLoop();
    },

    getTextNodeRect(textNode, $sheetBody) {
      let range = document.createRange();
      range.selectNodeContents(textNode);
      let rects = range.getClientRects();
      if (rects.length > 0)
        return {
          bottom:
            document.body.scrollTop + rects[0].bottom - $sheetBody.offset().top,
          height: rects[0].height,
        };
      else return 0;
    }
  }
}

</script>

<style scoped src="@/utils/webChordRender.css"></style>
<style scoped src="@/utils/webSheet.css"></style>
<style scoped src="@/utils/webTab.css"></style>
<style scoped>
:root {
  font-size: var(--base-font-size);
  --base-font-size: 18px;
  --sheet-font-size: var(--base-font-size);
  --title-base-font-size: 30px;
  --title-scale: 1;
  --theme-color: #e9266a;
  --chord-renderer-theme-color: white;
  --chord-renderer-font-color: black;
  --sheet-theme-color: var(--theme-color);
  --page-size: 100%;
}

::selection {
  background: var(--theme-color);
}

chord_name::before,
chord_pure::before {
  content: "▶";
  position: absolute;
  font-size: 30px;
  color: white;
  transform: translate(-50%, -50%);
  top: 50%;
  left: 50%;
  opacity: 0;
  transition: all 0.2s ease-out;
}

chord:hover chord_name::before,
chord_pure:hover::before {
  opacity: 0.8;
}

html {
  color: white;
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.toggle {
  --size: 30px;
  position: relative;
  appearance: none;
  width: calc(var(--size) * 2);
  height: var(--size);
  border: #fff 2px solid;
  border-radius: calc(var(--size) / 2);
  background: transparent;
  transition: border 0.2s ease-out;

  display: flex;
  align-items: center;
}
.toggle::before {
  --ball-size: calc(var(--size) * 0.8);
  --margin-size: calc((var(--size) - var(--ball-size)) / 2);
  content: "";
  position: absolute;
  width: var(--ball-size);
  height: var(--ball-size);
  border-radius: 50%;
  background: grey;
  left: var(--margin-size);
  transition: all 0.2s ease-out;
}

.toggle:checked {
  background: #e9266a33;
}

.toggle:checked::before {
  left: calc(100% - var(--ball-size) - var(--margin-size));
  background: var(--theme-color);
}

.toggle:focus {
  outline: none;
}

a,
a:link,
a:visited,
a:active,
a:focus {
  text-decoration: none;
}

body {
  width: 100%;
  height: 100%;
  margin: 0;
  background-color: rgb(0, 6, 40);
  position: relative;
  font-size: var(--base-font-size);

  display: flex;
  flex-direction: column;
  align-items: center;
}

#sheet {
  padding-bottom: 50%;
  display: flex;
  flex-direction: column;
}

body[env="pc"] #sheet {
  width: calc(100% - 400px);
}

body[env="mobile"] #sheet {
  width: 90%;
}

.title {
  overflow: hidden;
  white-space: nowrap;
  word-break: break-all;
  text-overflow: ellipsis;
}

#song_title {
  margin-top: var(--title-base-font-size);
  height: calc(var(--title-base-font-size) * 2);
  line-height: calc(var(--title-base-font-size) * 2);
  font-size: calc(var(--title-base-font-size) * 1.5);
  color: white;
}

#song_singer {
  height: calc(var(--title-base-font-size) * 0.9);
  line-height: calc(var(--title-base-font-size) * 0.9);
  font-size: calc(var(--title-base-font-size) * 0.8);
  color: #aaaaaa;
}

#sheet_key_block {
  margin-top: 10px;
  line-height: var(--title-base-font-size);
  font-size: calc(var(--title-base-font-size) * 0.9);
  color: white;

  display: flex;
  align-items: center;
}

#sheet_key {
}

#sheet_key_shift {
  height: 100%;
  width: 30px;
  margin: 0 10px;

  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
}

#sheet_key_shift_up,
#sheet_key_shift_down {
  width: 100%;

  display: flex;
  justify-content: center;
  align-items: center;

  transition: all 0.2s ease-out;
}

#sheet_key_shift_up:hover,
#sheet_key_shift_down:hover {
  color: rgb(187, 73, 73);
}

#sheet_by {
  margin-top: 5px;
  height: calc(var(--title-base-font-size) * 0.8);
  line-height: calc(var(--title-base-font-size) * 0.8);
  font-size: calc(var(--title-base-font-size) * 0.7);
  color: rgb(156, 156, 156);
}

#sheet_body_block {
  margin-top: 10px;

  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
}

.sheet_body {
  white-space: pre-wrap;
  margin: 0;
  width: 100%;
}

.sheet_body[page="paper"] {
  margin: 10px;
  padding: 10px 20px;
  /* width: calc(100% - 60px); */
  width: calc(var(--page-size) - 60px);
  min-width: 300px;
  max-width: 600px;
  outline: 2px white solid;
  overflow: hidden;
}

#chord {
  position: fixed;
  right: 40px;
  top: 30px;
  height: 200px;
  width: 150px;
  transition: opacity 0.2s ease-out;

  z-index: 10;
}

</style>