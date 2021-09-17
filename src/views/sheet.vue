<template>
  <div id="tools_block_1" class="tools_block">
    <div id="scale_block">
      <div class="tools_text">缩放</div>
      <input
        id="scale_slider"
        type="range"
        step="0.01"
        min="1"
        max="5"
        value="1"
      />
      <div id="scale_text" class="tools_text">1.0</div>
    </div>
    <div id="auto_scroll_block">
      <div class="tools_text">自动滚动</div>
      <input
        id="auto_scroll_slider"
        type="range"
        step="0.1"
        min="0"
        max="10"
        value="0"
      />
      <div id="auto_scroll_text" class="tools_text">停止</div>
    </div>
  </div>

  <div id="tools_block_2" class="tools_block">
    <div id="metronome_block">
      <div class="flex-center">节拍器</div>
      <div id="metronome_control">▶</div>
      <div id="metronome_bpm_block">
        <div id="metronome_bpm_decrease">-</div>
        <input type="text" id="metronome_bpm_input" value="120" />
        <div id="metronome_bpm_increase">+</div>
      </div>
    </div>
    <select id="instrument_combo">
      <option value="Oscillator">振荡器</option>
      <option value="Ukulele">尤克里里音源</option>
    </select>
    <div id="page_type_block">
      <div>阅读</div>
      <input id="toggle_page_type" type="checkbox" class="toggle" />
      <div>纸张</div>
    </div>
    <input
      id="paper_size_slider"
      type="range"
      min="0.2"
      max="1"
      value="1"
      step="0.02"
    />
  </div>

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
// TODO: 突然想到，给不同和弦加上颜色是不是很炫酷
// TODO: 再整一个节拍器，可以随节拍换颜色

import { getQueryVariable } from "@/utils/webCommon.js";
import { drawChord } from "@/utils/webChordRender.js";
import { WebPlayer } from "@/utils/webPlayer.js";
import { WebMetronome } from "@/utils/webMetronome.js";
import { DigitalSheet } from "@/utils/webSheetParser.js";
import { ChordManager } from "@/utils/webChordManager.js";

let g_ChordManager = new ChordManager();
let g_Metronome = new WebMetronome();
let g_SheetInfo = {};
let g_OriginalSheetKey;
let g_SheetLoaded = false;
let g_Env = null;
let g_PageType = "none";

function changeScale(scale) {
  scale = parseFloat(scale);
  if (g_Env == "pc") {
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
  if (g_SheetLoaded) resizedHandler();
}

window.onload = function () {
  // 检查环境
  if (document.body.clientWidth / document.body.clientHeight < 0.8) {
    // 竖屏
    $(document.body).attr("env", "mobile");
    g_Env = "mobile";
  } else {
    $(document.body).attr("env", "pc");
    g_Env = "pc";
  }
  changeScale(1.0);
  $(window).bind("resize", resizedHandler);

  let sheetName = getQueryVariable("sheet");
  loadSheet(`sheets/${sheetName}.sheet`).then(() => {
    g_SheetLoaded = true;
    updateSheetInfo();
    setupEvents();
  });
};

function loadSheet(url) {
  return $.get({
    url: encodeURI(url),
    success: function (data, status) {
      let parsedSheet = new DigitalSheet(data);
      g_SheetInfo = {
        title: parsedSheet.getUniqueValue("title"),
        singer: parsedSheet.getUniqueValue("singer"),
        by: parsedSheet.getUniqueValue("by"),
        originalKey: parsedSheet.getUniqueValue("originalKey"),
        sheetKey: parsedSheet.getUniqueValue("sheetKey"),
        chords: parsedSheet.getArrayValue("chords"),
        rhythms: parsedSheet.getArrayValue("rhythms"),
        $sheet: parsedSheet.getSheetElement(),
      };
      g_OriginalSheetKey = g_SheetInfo.sheetKey;
    },
    error: function () {
      $("#song_title").text("未找到曲谱");
    },
  });
}

function updateSheetInfo() {
  $("#song_title").text(g_SheetInfo.title);
  $("#song_singer").text(g_SheetInfo.singer);
  $("#sheet_key").text(
    `原调 ${g_SheetInfo.originalKey} 选调 ${g_SheetInfo.sheetKey}`
  );
  $("#sheet_by").text(`制谱 ${g_SheetInfo.by}`);
  updateSheetBody();
}

function updateSheetBody() {
  console.log("resize update info");
  // paper模式效率很低..
  // 保存滚动位置
  let scrollTop = document.body.scrollTop;

  let $sheetBodyBlock = $("#sheet_body_block");
  $sheetBodyBlock.empty();
  if (g_PageType == "none") {
    let $sheetBody = $("<div>");
    $sheetBody.addClass("sheet_body");
    $sheetBody.append(g_SheetInfo.$sheet);
    $sheetBodyBlock.append($sheetBody);

    g_SheetInfo.$sheet.trigger("fit");
  } else if (g_PageType == "A4") {
    let $sheetBody = $("<div page='paper'>");
    $sheetBody.addClass("sheet_body");
    $sheetBodyBlock.append($sheetBody);
    $sheetBody.height($sheetBody.width() * Math.sqrt(2));
    let pageHeight = $sheetBody.height();

    let i = 0;
    while (i < g_SheetInfo.$sheet.length) {
      // 获取一行
      let line = [];
      while (i < g_SheetInfo.$sheet.length) {
        let $e = $(g_SheetInfo.$sheet[i]);
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
}

let resizedTimer = null;
function resizedHandler() {
  clearTimeout(resizedTimer);
  if (g_PageType == "A4") {
    resizedTimer = setTimeout(updateSheetBody, 200);
  }
}

let g_MetronomeStarted = false;

function setupEvents() {
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

  $("#scale_slider").on("input", () => changeScale($("#scale_slider").val()));
  $("#auto_scroll_slider").on("change", () =>
    changeAutoScrollSpeed($("#auto_scroll_slider").val())
  );

  $("#metronome_control").click(() => {
    g_MetronomeStarted = !g_MetronomeStarted;
    if (g_MetronomeStarted) {
      if (!g_Metronome.start()) {
        alert("节拍器加载未完成，请稍后");
        return;
      }

      $("#metronome_control").text("❚❚");
    } else {
      $("#metronome_control").text("▶");
      g_Metronome.stop();
    }
  });

  $("#metronome_bpm_input").bind("change", (e) => {
    let bpm = $(e.currentTarget).val();
    g_Metronome.bpm = Math.max(30, Math.min(240, bpm));
  });

  $("#metronome_bpm_decrease").bind("click", () => {
    if (g_Metronome.bpm > 30) g_Metronome.bpm--;
    $("#metronome_bpm_input").val(g_Metronome.bpm);
  });

  $("#metronome_bpm_increase").bind("click", () => {
    if (g_Metronome.bpm < 240) g_Metronome.bpm++;
    $("#metronome_bpm_input").val(g_Metronome.bpm);
  });

  let longPressTimer,
    longPressing = false;
  $("#metronome_bpm_decrease, #metronome_bpm_increase").bind(
    "mousedown",
    (e) => {
      function longPress(element) {
        if (longPressing) {
          $(element).trigger("click");
          setTimeout(longPress, 50, element);
        }
      }

      longPressing = true;
      longPressTimer = setTimeout(() => {
        longPress(e.currentTarget);
      }, 500);
    }
  );

  $("#toggle_page_type").bind("change", (e) => {
    if ($(e.currentTarget).prop("checked") == true) {
      g_PageType = "A4";
      $("#paper_size_slider").show();
    } else {
      g_PageType = "none";
      $("#paper_size_slider").hide();
    }
    updateSheetBody();
  });

  $("#paper_size_slider").bind("change", (e) => {
    document.documentElement.style.setProperty(
      "--page-size",
      `${e.currentTarget.value * 100}%`
    );
    updateSheetBody();
  });

  $(document).bind("mouseup", () => {
    if (longPressing) {
      longPressing = false;
      clearTimeout(longPressTimer);
    }
  });

  $("#instrument_combo").bind("change", (e) => {
    g_CurrentInstrument = $(e.currentTarget).val();
  });
}

function shiftKey(offset) {
  let curKey = g_SheetInfo.sheetKey;
  let newKey = g_ChordManager.shiftKey(curKey, offset);

  let $chords = $("chord_name,chord_pure");
  $chords.each((i, e) => {
    let $chord = $(e);
    let originalChord = $chord.text();
    let newChord = g_ChordManager.shiftKey(originalChord, offset);
    $chord.text(newChord);
  });

  if (g_OriginalSheetKey == newKey) {
    $("tab-box").attr("state", "normal");
  } else {
    $("tab-box").attr("state", "disabled");
  }

  g_SheetInfo.sheetKey = newKey;

  updateSheetInfo();
}

let g_ScrollTimer = false;
let g_AutoScrollSpeed = 0;
function changeAutoScrollSpeed(speed) {
  speed = parseFloat(speed);
  g_AutoScrollSpeed = speed;
  let text = speed == 0 ? "停止" : `x${speed.toFixed(1)}`;
  $("#auto_scroll_text").text(text);
  if (speed > 0) {
    clearTimeout(g_ScrollTimer);
    startAutoScroll();
  }
}

function startAutoScroll() {
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
}

let g_UkulelePlayer = new WebPlayer("Ukulele", "Ukulele");
let g_OscillatorPlayer = new WebPlayer("Ukulele", "Oscillator");
let g_CurrentInstrument = "Oscillator";

function changeInstrument(value) {
  g_CurrentInstrument = value;
}

function playChord(chord) {
  let volume = 0.5;
  let duration = (1 / g_Metronome.bpm) * 60 * 4;
  let player = null;
  switch (g_CurrentInstrument) {
    case "Oscillator":
      player = g_OscillatorPlayer;
      break;
    case "Ukulele":
      player = g_UkulelePlayer;
      break;
    default:
      throw "未知错误";
  }
  player.playChord(chord, volume, duration);
}

function getTextNodeRect(textNode, $sheetBody) {
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

.tools_block {
  position: fixed;
  padding: 10px;
  display: flex;
  justify-content: space-between;

  z-index: 10;
}

.tools_text {
  margin: 10px 0;
  color: white;
}

body[env="pc"] .tools_text {
  width: 100%;
  height: 20px;
  text-align: center;
  line-height: 20px;
  font-size: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

body[env="mobile"] .tools_text {
  width: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 4vw;
}

body[env="pc"] #tools_block_1 {
  top: 25%;
  height: 50%;
  left: 10px;
  width: 160px;
}

body[env="mobile"] #tools_block_1 {
  bottom: 0;
  height: 10%;
  left: 0;
  width: 100%;
  background-color: #000000aa;
  flex-direction: column;
}

body[env="mobile"] #tools_block_1 input {
  flex-shrink: 0;
  width: 60%;
}

#tools_block_2 {
  right: 10px;
  width: 160px;
  top: 40%;
  flex-direction: column;
}

body[env="mobile"] #tools_block_2 {
  display: none;
}

#scale_block {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

body[env="mobile"] #scale_block {
  flex-direction: row;
}

#scale_slider {
  flex-grow: 1;
  margin: 10px 0;
}

body[env="pc"] #scale_slider {
  -webkit-appearance: slider-vertical;
}

#auto_scroll_block {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

body[env="mobile"] #auto_scroll_block {
  flex-direction: row;
}

#auto_scroll_slider {
  flex-grow: 1;
  margin: 10px 0;
}

body[env="pc"] #auto_scroll_slider {
  -webkit-appearance: slider-vertical;
}

#metronome_block {
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
  border: 2px white solid;
  font-size: 20px;

  z-index: 10;
}

#metronome_control {
  height: 30px;
  width: 30px;
  margin: 5px 0;
  border-radius: 50%;
  border: 4px white solid;

  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

#metronome_bpm_block {
  display: flex;
  justify-content: space-around;
}
#metronome_bpm_decrease,
#metronome_bpm_increase {
  height: 20px;
  width: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
#metronome_bpm_input {
  outline-style: none;
  border: 0px;
  border-bottom: 1px white solid;
  background-color: transparent;
  color: white;
  width: 50px;
  text-align: center;
}

#page_type_block {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

#paper_size_slider {
  display: none;
}
</style>