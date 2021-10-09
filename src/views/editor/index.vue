<template>
  <div id="container" :env="getEnv()">
    <input
      type="range"
      id="layout_slider"
      min="0"
      max="100"
      value="20"
      step="0.1"
    />
    <div id="tools_block">
      <div id="tools_block_fix">
        <div id="tools_title" class="title flex_center">工具栏</div>
        <ToolChord v-model:chords="attachedChords" />
        <div id="chord_tool_edit_button" class="button" @click="openPanelChord">
          编辑和弦
        </div>
        <div id="edit_mode_block">
          <div class="edit_mode">
            <div>光标模式</div>
            <input id="toggle_cursor_mode" type="checkbox" class="toggle" />
          </div>
        </div>
      </div>
    </div>
    <div id="sheet_block">
      <input
        type="text"
        id="song_title_input"
        class="input"
        placeholder="在此处输入歌名"
        v-model="sheetInfo.title"
      />
      <input
        type="text"
        id="song_singer_input"
        class="input"
        placeholder="在此处输入歌手"
        v-model="sheetInfo.singer"
      />
      <div id="sheet_key_block">
        <div id="sheet_key" class="title">原调</div>
        <select
          id="sheet_original_key_select"
          class="select"
          v-model="sheetInfo.originalKey"
        >
          <option value="C" selected>C</option>
          <option value="#C">♯C</option>
          <option value="bD">♭D</option>
          <option value="D">D</option>
          <option value="#D">♯D</option>
          <option value="bE">♭E</option>
          <option value="E">E</option>
          <option value="F">F</option>
          <option value="#F">♯F</option>
          <option value="bG">♭G</option>
          <option value="G">G</option>
          <option value="#G">♯G</option>
          <option value="bA">♭A</option>
          <option value="A">A</option>
          <option value="#A">♯A</option>
          <option value="bB">♭B</option>
          <option value="B">B</option>
        </select>
        <div id="sheet_key" class="title">选调</div>
        <select
          id="sheet_current_key_select"
          class="select"
          :value="sheetInfo.sheetKey"
          @change="sheetKeyChange"
        >
          <option value="C" selected>C</option>
          <option value="#C">♯C</option>
          <option value="bD">♭D</option>
          <option value="D">D</option>
          <option value="#D">♯D</option>
          <option value="bE">♭E</option>
          <option value="E">E</option>
          <option value="F">F</option>
          <option value="#F">♯F</option>
          <option value="bG">♭G</option>
          <option value="G">G</option>
          <option value="#G">♯G</option>
          <option value="bA">♭A</option>
          <option value="A">A</option>
          <option value="#A">♯A</option>
          <option value="bB">♭B</option>
          <option value="B">B</option>
        </select>
      </div>
      <div type="text" id="sheet_by" class="title">制谱 锦瑟</div>
      <div class="flex_center">
        <div id="edit_raw_lyric_button" class="button">编辑歌词</div>
        <div class="button" @click="saveSheetToFile">保存</div>
        <div class="button" @click="loadSheetFromFile">载入</div>
      </div>
      <div id="sheet" class="sheet_box"></div>
    </div>
  </div>

  <div id="editor_context" class="context">
    <div id="editor_context_menu"></div>
  </div>

  <div id="editor_context_insert_pos" class="context">
    <div id="editor_context_menu_insert_pos">
      <div value="before" class="editor_context_menu_item">前方</div>
      <div value="after" class="editor_context_menu_item">后方</div>
    </div>
  </div>

  <div id="editor_context_insert_type" class="context">
    <div id="editor_context_menu_insert_type">
      <div value="info" class="editor_context_menu_item">标记</div>
      <div value="char" class="editor_context_menu_item">文本</div>
      <div value="newline" class="editor_context_menu_item">换行</div>
    </div>
  </div>

  <div id="drag_mark"></div>
  <div id="temp_tip">
    按住Ctrl可以复制和弦<br />
    按住Shift可以移动和弦<br />
    拖入保存的文件可以直接加载
  </div>
  <div id="raw_lyric_panel" class="panel" style="display: none">
    <div id="raw_lyric_container">
      <div id="raw_lyric_title">在下方输入歌词</div>
      <textarea id="raw_lyric_textarea"></textarea>
      <div style="display: flex">
        <div id="raw_lyric_button_confirm" class="button">确认歌词</div>
        <div id="raw_lyric_button_cancel" class="button">取消</div>
      </div>
    </div>
  </div>
  <PanelChordSelector
    id="chord_panel"
    class="panel"
    v-model:attachedChords="attachedChords"
    v-model:show="showChordPanel"
    :key="sheetInfo.sheetKey"
  />
  <div id="drop_hint_panel">
    <div id="drop_hint_text">拖拽文件加载</div>
  </div>

  <div id="help_button">?</div>
</template>

<script>
import { getQueryVariable, getEnv } from "@/utils/webCommon.js";
import { WebPlayer } from "@/utils/webPlayer.js";
import WebChordManager from "@/utils/webChordManager.js";
import { SheetNode, ENodeType, traverseNode } from "@/utils/sheetNode.js";

import WebSheetParser from "@/utils/webSheetParser";
import WebSheet from "@/components/webSheet";
import Chord from "@/components/chord";
import { get } from "@/utils/request.js";
import ToolChord from "./toolChord";
import PanelChordSelector from "./panelChordSelector";

let g_ChordManager = new WebChordManager();
let g_UkulelePlayer = new WebPlayer("Ukulele", "Ukulele");
let g_OscillatorPlayer = new WebPlayer("Ukulele", "Oscillator");

export default {
  name: "SheetEditor",
  components: {
    ToolChord,
    PanelChordSelector,
    Chord,
  },
  data() {
    return {
      globalCssVar: {
        "font-size": "var(--base-font-size)",
        "--base-font-size": "18px",
        "--sheet-font-size": "var(--base-font-size)",
        "--title-base-font-size": "30px",
        "--title-scale": "1",
        "--theme-color": "#e9266a",
        "--chord-renderer-theme-color": "white",
        "--chord-renderer-font-color": "black",
        "--sheet-theme-color": "var(--theme-color)",
        "--page-size": "100%",
      },
      env: "pc",
      showChordPanel: false,
      attachedChords: [],
      loaded: false,
      scale: 1,
      autoScroll: {
        started: false,
        speed: 0.0,
        timer: null,
      },
      sheetInfo: {
        title: "加载中",
        singer: "",
        by: "",
        originalKey: "",
        sheetKey: "",
        chords: [],
        rhythms: [],
        originalSheetKey: "",
        sheetTree: new SheetNode(ENodeType.Root),
      },
      sheetEvents: {
        text: {
          click: (node) => {
            console.log("text", node);
          },
        },
        chord: {
          click: (node) => {
            this.playChord(g_ChordManager.getChord(node.chord));
          },
          mouseenter: (node) => {
            this.tipChord.show = true;
            this.tipChord.chord = g_ChordManager.getChord(node.chord);
          },
          mouseleave: (node) => {
            this.tipChord.show = false;
          },
        },
        mark: {
          click: (node) => {
            console.log("mark", node);
          },
        },
      },
      tipChord: {
        show: false,
        chord: {},
      },
      player: {
        instrument: "Oscillator",
      },
    };
  },
  mounted() {
    this.changeScale();

    let sheetName = getQueryVariable("sheet");
    get(`sheets/${sheetName}.sheet`)
      .then((res) => {
        let rootNode = WebSheetParser.parse(res);
        console.log(rootNode);
        if (!rootNode) {
          throw "曲谱解析失败！";
        }
        this.sheetInfo.title = rootNode.title;
        this.sheetInfo.singer = rootNode.singer;
        this.sheetInfo.by = rootNode.by;
        this.sheetInfo.originalKey = rootNode.originalKey;
        this.sheetInfo.sheetKey = rootNode.sheetKey;
        this.sheetInfo.chords = rootNode.chords;
        this.sheetInfo.rhythms = rootNode.rhythms;
        this.sheetInfo.sheetTree = rootNode;
        this.sheetInfo.originalSheetKey = rootNode.sheetKey;
        this.loaded = true;

        this.attachedChords = this.sheetInfo.chords.map((chordName) =>
          g_ChordManager.getChord(chordName)
        );
        console.log(this.sheetInfo.chords, this.attachedChords);
      })
      .catch((e) => {
        console.error("加载失败", e);
      });
  },
  methods: {
    getEnv,
    openPanelChord() {
      this.showChordPanel = true;
    },
    changeScale() {
      const env = getEnv()
      let scale = parseFloat(this.scale);
      let defaultFontSize, defaultTitleFontSize, unit;
      if (env == "pc") {
        defaultFontSize = 18;
        defaultTitleFontSize = 30;
        unit = "px";
      } else {
        defaultFontSize = 4;
        defaultTitleFontSize = 8;
        unit = "vw";
      }
      document.documentElement.style.setProperty(
        "--base-font-size",
        `${defaultFontSize * scale}${unit}`
      );
      document.documentElement.style.setProperty(
        "--title-base-font-size",
        `${defaultTitleFontSize * scale}${unit}`
      );
    },
    changeAutoScrollSpeed() {
      if (!this.autoScroll.started) {
        this.startAutoScroll();
      }
    },
    startAutoScroll() {
      let that = this;
      function scroll(amount) {
        console.log("scroll");
        document.documentElement.scrollTop += amount;
        document.body.scrollTop += amount; // 兼容老版chrome，好像小程序也需要用body
      }

      let lastTimeStamp = new Date().getTime();
      function scrollLoop() {
        let speed = that.autoScroll.speed;
        if (speed == 0) {
          window.cancelAnimationFrame(that.autoScroll.timer);
          that.autoScroll.timer = null;
          that.autoScroll.started = false;
          return;
        }
        const delay = 100 / speed;
        let curTimeStamp = new Date().getTime();
        if (curTimeStamp - lastTimeStamp > delay) {
          let amount = (curTimeStamp - lastTimeStamp) / delay;
          scroll(amount);
          lastTimeStamp = curTimeStamp;
        }
        that.autoScroll.timer = window.requestAnimationFrame(scrollLoop);
      }
      this.autoScroll.started = true;
      scrollLoop();
    },
    playChord(chord) {
      const bpm = 120;
      let volume = 0.5;
      let duration = (1 / bpm) * 60 * 4;
      let player = null;
      switch (this.player.instrument) {
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
    },
    shiftKey(offset) {
      let curKey = this.sheetInfo.sheetKey;
      let newKey = g_ChordManager.shiftKey(curKey, offset);
      this.sheetInfo.sheetKey = newKey;

      traverseNode(this.sheetInfo.sheetTree, (node) => {
        if (node.type == ENodeType.Chord || node.type == ENodeType.ChordPure) {
          node.chord = g_ChordManager.shiftKey(node.chord, offset);
        }
      });
    },
  },
};

// import { getQueryVariable } from "./modules/webCommon.js"
// import { DigitalSheet } from "./modules/webSheetParser.js"
// import { ChordManager } from "./modules/webChordManager.js"
// import { drawChord, drawChordNotFound } from "./modules/webChordRender.js"
// import { WebPlayer } from "./modules/webPlayer.js"
// import { runPresetTip } from "./modules/webTip.js"
// import { convertXXX } from "./modules/xxxToSheet.js"

// // 将jq的touchstart默认改为passive模式
// $.event.special.touchstart = {
//     setup: function( _, ns, handle ) {
//         this.addEventListener("touchstart", handle, { passive: false });
//     }
// };

// // 给jq对象增加反转函数
// $.fn.reverse = [].reverse;

// let $g_Sheet = null
// let g_ChordManager = new ChordManager
// let g_UkulelePlayer = new WebPlayer("Ukulele", "Ukulele")

// class Editor {
//     createChord(char, chordName) {
//         return $(`<chord>${char}<chord_name>${chordName}</chord_name></chord>`)
//     }

//     createCharFromChord($e) {
//         let char = _getChordTextNode($e).text();
//         if (char == "") char = " "; // 为空，说明原来为占位符，还原为空格
//         return $(`<char>${char}</char>`)
//     }

//     recoverChordToChar($e) {
//         while($e.parent().is("underline")) {
//             // 如果是首位，删除本和弦下划线
//             // 如果是末位，删除倒数第二个和弦的下划线
//             // 否则在中间，不做处理即可，直接删除
//             if ($e.index() == 0) g_Editor.deleteUnderline($e)
//             else if ($e.index() == $e.parent().children().length - 1) g_Editor.deleteUnderline($e.prevAll("chord").last())
//             else break;
//         }

//         let $char = this.createCharFromChord($e)
//         $e.replaceWith($char)
//         return $char
//     }

//     removeElement($e) {
//         $e.remove()
//     }

//     insert($base, $inserted, pos) {
//         switch (pos) {
//             case "before":
//                 while(true) {
//                     if ($base.is("char")) break; // 文字前面必定可以插入
//                     else if ($base.parent().is("underline") && $base.index() == 0) {
//                         // 如果非文字，且是下划线的第一个元素，那么移到上一级检测
//                         $base = $base.parent();
//                         continue;
//                     }
//                     break;
//                 }
//                 $base.before($inserted)
//                 break;
//             case "after":
//                 while(true) {
//                     if ($base.is("char")) break; // 文字后面必定可以插入
//                     else if ($base.parent().is("underline") && $base.index() == $base.parent().children().length - 1) {
//                         // 如果非文字，且是下划线的最后一个元素，那么移到上一级检测
//                         $base = $base.parent();
//                         continue;
//                     }
//                     break;
//                 }
//                 $base.after($inserted)
//                 break;
//             default:
//                 throw "插入位置类型错误"
//                 break;
//         }
//     }

//     insertChar($e, pos) {
//         let newChars = _getInputText("插入文字")
//         if (newChars) {
//             let chars = newChars.split("")
//             for (let char of chars) {
//                 this.insert($e, `<char>${char}</char>`, pos)
//             }
//         }
//     }

//     insertInfo($e, pos) {
//         let text = _getInputText("插入标记")
//         if (text) {
//             this.insert($e, `<info>${text}</info>`, pos)
//         }
//     }

//     insertLine($e, pos) {
//         this.insert($e, `<newline>⇲</newline>`, pos)
//     }

//     editChar($e) {
//         let newChars = _getInputText("新文本", $e.text())
//         if (newChars) {
//             let chars = newChars.split("")
//             let firstChar = chars[0]
//             let restChars = chars.slice(1).reverse()
//             $e.text(firstChar)
//             for (let char of restChars) {
//                 $e.after(`<char>${char}</char>`)
//             }
//         }
//     }

//     editInfo($e) {
//         let text = _getInputText("新文本", $e.text())
//         if (text) {
//             $e.text(text)
//         }
//     }

//     editChord($e) {
//         let newChars = _getInputText("新文本", _getChordTextNode($e).text())
//         if (newChars) {
//             let chars = newChars.split("")
//             let firstChar = chars[0]
//             let restChars = chars.slice(1).reverse()
//             let $textNode = _getChordTextNode($e)
//             $textNode[0].textContent = firstChar
//             for (let char of restChars) {
//                 $e.after(`<char>${char}</char>`)
//             }
//         }
//     }

//     // 给和弦添加下划线
//     addUnderline($chord) {
//         // 注意，默认不存在纯文本节点，所以不能处理！
//         let chordTagName
//         let underlineTagName
//         switch ($chord[0].tagName) {
//             case "CHORD": chordTagName = "chord"; underlineTagName = "underline"; break;
//             case "CHORD_PURE": chordTagName = "chord_pure"; underlineTagName = "underline_pure"; break;
//             default: console.error("非和弦不能添加下划线"); return;
//         }

//         function findNextChord($start, chordTagName) {
//             let $chords = $g_Sheet.find(chordTagName)
//             let curIndex = $chords.index($start)
//             if (curIndex == -1) {console.error("未找到该元素"); return null;}
//             if (curIndex == $chords.length - 1) {console.error("未找到下一个和弦"); return null;}
//             return $chords.eq(curIndex + 1)
//         }

//         let $nextChord = findNextChord($chord, chordTagName)
//         if (!$nextChord) return;
//         if ($chord.parent().is($nextChord.parent())) { // 同一层，那么将起始到结束之间的所有元素都放入一个下划线
//             console.log("s e")
//             let $betweenElements = $chord.nextUntil($nextChord)
//             let $underline = $(`<${underlineTagName}>`)
//             $chord.before($underline)
//             $underline.append($chord)
//             $underline.append($betweenElements)
//             $underline.append($nextChord)
//         }
//         else if ($chord.parents().is($nextChord.parent())) { // 起始在内层，结束在外层，则把起始元素的同级下划线（和结束同层）向后扩展到包围结束和弦
//             console.log("[s] e")
//             let $startUnderline = $chord.parentsUntil($nextChord.parent()).last()
//             let $betweenElements = $startUnderline.nextUntil($nextChord)
//             $startUnderline.append($betweenElements)
//             $startUnderline.append($nextChord)
//         }
//         else if ($nextChord.parents().is($chord.parent())) { // 起始在外层，结束在内层，则把结束元素的同级下划线（和起始同层）向前扩展到包围起始和弦
//             console.log("s [e]")
//             let $endUnderline = $nextChord.parentsUntil($chord.parent()).last()
//             let $betweenElements = $chord.nextUntil($endUnderline)
//             $endUnderline.prepend($betweenElements)
//             $endUnderline.prepend($chord)
//         }
//         else { // 起始结束都在内层（且不是同一个下划线），则把他们的同级下划线以及中间的元素合并到一个下划线
//             console.log("[s] [e]")
//             let $commonAncestor = $chord.parents().has($nextChord).first()
//             let $startUnderline = $chord.parentsUntil($commonAncestor).last()
//             let $endUnderline = $nextChord.parentsUntil($commonAncestor).last()
//             let $betweenElements = $startUnderline.nextUntil($endUnderline)
//             $startUnderline.append($betweenElements)
//             $startUnderline.append($endUnderline.contents())
//             $endUnderline.remove()
//         }
//     }

//     deleteUnderline($chord) {
//         // 注意，默认不存在纯文本节点，所以不能处理！
//         let chordTagName
//         let underlineTagName
//         switch ($chord[0].tagName) {
//             case "CHORD": chordTagName = "chord"; underlineTagName = "underline"; break;
//             case "CHORD_PURE": chordTagName = "chord_pure"; underlineTagName = "underline_pure"; break;
//             default: console.error("非和弦不能添加下划线"); return;
//         }

//         function findNextChord($start, chordTagName) {
//             let $chords = $g_Sheet.find(chordTagName)
//             let curIndex = $chords.index($start)
//             if (curIndex == -1) {console.error("未找到该元素"); return null;}
//             if (curIndex == $chords.length - 1) {console.error("未找到下一个和弦"); return null;}
//             return $chords.eq(curIndex + 1)
//         }

//         let $nextChord = findNextChord($chord, chordTagName)
//         if (!$nextChord) return;

//         let $commonAncestor = $chord.parents().has($nextChord).first()
//         if (!$commonAncestor.is(underlineTagName)) {
//             console.error("不在下划线下")
//             return
//         }
//         let $start = $chord.parent().is($commonAncestor) ? $chord : $chord.parentsUntil($commonAncestor).last()
//         let $end = $nextChord.parent().is($commonAncestor) ? $nextChord : $nextChord.parentsUntil($commonAncestor).last()

//         let hasPrev = $start.is(underlineTagName) || $start.prev().length > 0
//         let hasNextNext = $end.is(underlineTagName) || $end.next().length > 0
//         let $underline = $commonAncestor

//         if (!hasPrev && !hasNextNext) { // 下划线只有这两个和弦，则删除整个下划线
//             console.log("_s e_")
//             $underline.after($underline.children())
//             $underline.remove()
//         }
//         else if (hasPrev && !hasNextNext) { // 起始和弦前面还有元素，但结束和弦后面没有，需要把起始和弦之后的所有元素移出
//             console.log("_xxx s e_")
//             $underline.after($start.nextAll())
//         }
//         else if (!hasPrev && hasNextNext) { // 起始和弦前面没有，但结束和弦后面有元素，需要把结束和弦之前的所有元素移出
//             console.log("_s e xxx_")
//             $underline.before($end.prevAll().reverse())
//         }
//         else { // 前后都有元素，需要从中间断开
//             console.log("_xxx s e yyy_")
//             let $newUnderline = $(`<${underlineTagName}>`)
//             $underline.after($newUnderline)
//             $newUnderline.append($start.nextAll())
//             $newUnderline.before($end.prevAll().reverse())
//         }
//     }

//     hasUnderlineToNextChord($chord) {
//         // 注意，默认不存在纯文本节点，所以不能处理！
//         let chordTagName
//         let underlineTagName
//         switch ($chord[0].tagName) {
//             case "CHORD": chordTagName = "chord"; underlineTagName = "underline"; break;
//             case "CHORD_PURE": chordTagName = "chord_pure"; underlineTagName = "underline_pure"; break;
//             default: console.error("非和弦不能添加下划线"); return;
//         }

//         function findNextChord($start, chordTagName) {
//             let $chords = $g_Sheet.find(chordTagName)
//             let curIndex = $chords.index($start)
//             if (curIndex == -1) {console.error("未找到该元素"); return null;}
//             if (curIndex == $chords.length - 1) {console.error("未找到下一个和弦"); return null;}
//             return $chords.eq(curIndex + 1)
//         }

//         let $nextChord = findNextChord($chord, chordTagName)
//         if (!$nextChord) return;

//         let $commonAncestor = $chord.parents().has($nextChord).first()
//         return $commonAncestor.is(underlineTagName)
//     }

//     generateSheetFileData() {
//         var that = this
//         let data = ""

//         data += "$title " + vmSheet.title + "\n"
//         data += "$singer " + vmSheet.singer + "\n"
//         data += "$by 锦瑟\n"
//         data += "$originalKey " + vmSheet.originalKey + "\n"
//         data += "$sheetKey " + vmSheet.sheetKey + "\n"
//         data += "$attachedChords "
//         for (let chordName of vmChordTool.attachedChords) {
//             data += chordName + " "
//         }
//         data += "\n\n"

//         let $elements = $g_Sheet.children()
//         $elements.each(function(){
//             data += that.elementToFileStr($(this))
//         })

//         // 测试能否解析
//         let sheet = new DigitalSheet(data)
//         console.log("解析通过", sheet)

//         return data
//     }

//     elementToFileStr($e) {
//         var that = this
//         let tagName = $e[0].tagName
//         switch (tagName) {
//             case "CHAR": return $e.text();
//             case "NEWLINE": return "\n";
//             case "CHORD": {
//                 let char = _getChordTextNode($e).text()
//                 if (char == "") char = "_"
//                 let chordName = $e.find("chord_name").text()
//                 return `[${chordName}]${char}`
//             }
//             case "UNDERLINE": {
//                 let $children = $e.children()
//                 let str = "{"
//                 $children.each(function(){
//                     str += that.elementToFileStr($(this))
//                 })
//                 str += "}"
//                 return str
//             }
//             default: return `[不支持的元素${tagName}]`;
//         }
//     }
// }

// let g_Editor = new Editor

// /* TODO:
//  * 方向键移动光标，上键添加和弦
//  * 按住方向键：
//  * 上键，组合字母可以快速输入和弦，并且默认的和弦会智能参考之前做好的曲谱！
//  * 左键、右键，在左侧或右侧操作
//  * 操作可以有：空格键加空格，回车键加换行
//  * 退格，删除当前字符并移动到前一个字符
// */
// class CursorInputControl {
//     constructor() {
//         this.$currentElement = null
//         this.keydownFunc = null
//         this.arrowKey = null
//         this.usedArrowKey = false
//     }

//     start() {
//         $(document).bind("keydown", (e)=>this._onKeyDown(e))
//         $(document).bind("keyup", (e)=>this._onKeyUp(e))
//         $(document).on("click", "char, chord", (e)=>this._onClick(e))
//         this.$currentElement = $g_Sheet.find("char, chord").first()
//         this._markHighlight(this.$currentElement)
//     }

//     stop() {
//         $(document).unbind("keydown", this.keydownFunc)
//         $(document).unbind("keyup", this.keyupFunc)
//         this._unmarkHighlight(this.$currentElement)
//         this.$currentElement = null
//     }

//     _onKeyDown(e) {
//         let key = e.key.toLowerCase()
//         switch (key) {
//             case " ": {
//                 this.usedArrowKey = true
//                 let predictedChords = this._predictChord(this.$currentElement)
//                 console.log(predictedChords)
//                 if (this.arrowKey == "arrowleft" || this.arrowKey == "arrowright") {
//                     let $chord = g_Editor.createChord("<placeholder></placeholder>", predictedChords[0])
//                     if (this.arrowKey == "arrowleft") {
//                         this.$currentElement.before($chord)
//                     }
//                     else if (this.arrowKey == "arrowright") {
//                         this.$currentElement.after($chord)
//                     }
//                 }
//                 else {
//                     if (this.$currentElement.is("char")) {
//                         let $chord = g_Editor.createChord(this.$currentElement.text(), predictedChord)
//                         this.$currentElement.replaceWith($chord);
//                         this.$currentElement = $chord
//                         this._markHighlight(this.$currentElement)
//                     }
//                 }
//                 this._adjustScrool()
//                 e.preventDefault()
//                 break;
//             }
//             case "backspace": {
//                 if (this.$currentElement.is("chord")) {
//                     this.$currentElement = g_Editor.recoverChordToChar(this.$currentElement)
//                 }
//                 else {
//                     let $e = this._findEditElement("prev")
//                     if (!$e) $e = this._findEditElement("next")
//                     g_Editor.removeElement(this.$currentElement)
//                     this.$currentElement = $e
//                 }
//                 this._markHighlight(this.$currentElement)
//                 this._adjustScrool()
//                 break;
//             }
//             case "arrowleft":
//             case "arrowright":
//             case "arrowdown":{
//                 this.arrowKey = key
//                 this.usedArrowKey = false
//                 e.preventDefault()
//                 break;
//             }
//             default:
//                 break;
//         }
//     }

//     _onKeyUp(e) {
//         let key = e.key.toLowerCase()
//         switch (key) {
//             case "arrowdown": {
//                 if (this.arrowKey != "arrowdown") return;
//                 if (this.$currentElement.is("char")) {
//                     let predictedChords = this._predictChord(this.$currentElement)
//                     console.log(predictedChords)
//                     let $chord = g_Editor.createChord(this.$currentElement.text(), predictedChords[0])
//                     this.$currentElement.replaceWith($chord);
//                     this.$currentElement = $chord
//                 }
//                 this._goNext()
//                 this.arrowKey = null
//                 this._adjustScrool()
//                 e.preventDefault()
//                 break;
//             }
//             case "arrowleft": {
//                 if (this.arrowKey != "arrowleft") return;
//                 if (!this.usedArrowKey) this._goPrev();
//                 this.arrowKey = null
//                 this._adjustScrool()
//                 e.preventDefault()
//                 break;
//             }
//             case "arrowright": {
//                 if (this.arrowKey != "arrowright") return;
//                 if (!this.usedArrowKey) this._goNext();
//                 this.arrowKey = null
//                 this._adjustScrool()
//                 e.preventDefault()
//                 break;
//             }
//             default:
//                 break;
//         }
//     }

//     _onClick(e) {
//         this._unmarkHighlight(this.$currentElement)
//         this.$currentElement = $(e.currentTarget);
//         this._markHighlight(this.$currentElement)
//     }

//     _markHighlight($e) {
//         $e.addClass("highlight")
//     }

//     _unmarkHighlight($e) {
//         $e.removeClass("highlight")
//     }

//     _findElement($start, targetFunc, direction = "next") {
//         if (direction != "next" && direction != "prev") throw "error";

//         function traverseIn($e) {
//             if (!$e) return null;
//             if (targetFunc($e)) return $e;

//             let $children = $e.children()
//             for(let i = 0; i < $children.length; ++i) {
//                 let $res = traverseIn($children.eq(i))
//                 if ($res) return $res;
//             }
//             return null
//         }

//         function traverseStep($e) {
//             if ($e.is($g_Sheet)) return null;
//             if (direction == "next" && $e.next().length > 0) return $e.next();
//             else if (direction == "prev" && $e.prev().length > 0) return $e.prev();
//             else return traverseStep($e.parent());
//         }

//         function traverseOut($e) {
//             if (!$e) return null;
//             let inRes = traverseIn($e)
//             if (inRes) return inRes;
//             return traverseOut(traverseStep($e));
//         }

//         return traverseOut(traverseStep($start))
//     }

//     _findEditElement(direction = "next") {
//         function isTarget($e) {
//             if (!$e.is("char, chord")) return false;
//             if ($e.is("char") && $e.text() == " ") return false;
//             if ($e.is("chord") && _getChordTextNode($e).text() == "") return false;
//             return true;
//         }

//         return this._findElement(this.$currentElement, isTarget, direction)
//     }

//     _adjustScrool() {
//         let offset = this.$currentElement.offset()
//         if (offset.top < document.body.scrollTop) {
//             document.body.scrollTop = offset.top
//         }
//         else if (offset.top + this.$currentElement.height() > document.body.scrollTop + document.body.clientHeight) {
//             document.body.scrollTop = offset.top + this.$currentElement.height() - document.body.clientHeight
//         }

//     }

//     _goNext() {
//         this._unmarkHighlight(this.$currentElement)
//         let $next = this._findEditElement("next")
//         if ($next) this.$currentElement = $next;
//         this._markHighlight(this.$currentElement)
//     }

//     _goPrev() {
//         this._unmarkHighlight(this.$currentElement)
//         let $prev = this._findEditElement("prev")
//         if ($prev) this.$currentElement = $prev;
//         this._markHighlight(this.$currentElement)
//     }

//     _predictChord($e) {
//         // 拆分成行
//         let targetLineIndex = null
//         let targetElementIndex = null
//         let lines = []
//         let curLine = ""
//         let curLineChords = []
//         let $curElement = $g_Sheet.find("char, chord").first()
//         while(true) {
//             if ($curElement.is($e)) {
//                 targetLineIndex = lines.length
//                 targetElementIndex = curLine.length
//             }

//             let $next = this._findElement($curElement, ($e)=>{
//                 return $e.is("char, chord, newline")
//             }, "next")
//             switch ($curElement[0].tagName) {
//                 case "CHAR": {
//                     curLine += $curElement.text()
//                     break;
//                 }
//                 case "CHORD": {
//                     curLine += _getChordTextNode($curElement).text()
//                     curLineChords.push({
//                         name: $curElement.find("chord_name").text(),
//                         index: curLine.length - 1
//                     })
//                     break;
//                 }
//                 case "NEWLINE": {
//                     lines.push({
//                         text: curLine,
//                         chords: curLineChords
//                     })
//                     curLine = ""
//                     curLineChords = []
//                     break;
//                 }
//                 default:
//                     continue;
//             }
//             if (!$next) {
//                 if (!$curElement.is("newline")) {
//                     lines.push({
//                         text: curLine,
//                         chords: curLineChords
//                     })
//                 }
//                 break;
//             }
//             $curElement = $next
//         }

//         function getStringSameRatio(str1, str2) {
//             if (str1.length == 0 && str2.length == 0) return 1;

//             let strMap = {}
//             let intersection = {}
//             str1.split("").forEach(e => strMap[e] = 1);
//             str2.split("").forEach(e => {
//                 if (strMap[e]) intersection[e] = 1;
//                 else strMap[e] = 1
//             });
//             let union = Object.keys(strMap).length
//             return Object.keys(intersection).length / union;
//         }

//         let predictedChords = []
//         // 遍历每一行
//         let targetLine = lines[targetLineIndex]
//         for(let i = 0; i < lines.length; ++i) {
//             if (i == targetLineIndex) continue;
//             let line = lines[i]
//             if (line.chords.length == 0) continue;

//             let stringSameRatio = getStringSameRatio(targetLine.text, line.text)
//             if (stringSameRatio <= 0.8) continue;

//             const Range = 0.1
//             let closestChordIndex = null
//             let closestPercentage = 1.0
//             for(let k = 0; k < line.chords.length; ++k) {
//                 let chordInfo = line.chords[k]
//                 let percentage = Math.abs(chordInfo.index / line.text.length - targetElementIndex / targetLine.text.length)
//                 if (percentage <= Range && percentage < closestPercentage) {
//                     closestChordIndex = k
//                     closestPercentage = percentage
//                 }
//             }
//             if (closestChordIndex != null) {
//                 predictedChords.push({
//                     name: line.chords[closestChordIndex].name,
//                     possibility: stringSameRatio * 0.5 + (1 - closestPercentage) * 0.5
//                 })
//             }
//         }

//         predictedChords.push({
//             name: vmSheet.sheetKey,
//             possibility: 0.0
//         })

//         predictedChords.sort((a, b) => a.possibility > b.possibility)

//         return predictedChords.map((e) => e.name)
//     }
// }

// var g_CursorInputControl = new CursorInputControl

// class EditorControl{
//     constructor($sheet) {
//         this.isDraggingChord = false
//         this.$fakeChord = null
//         this.$editedChord = null
//         this.originChordName = null
//         this.editedType = null
//         this.draggingChordName = ""

//         this.setupEvents($sheet)
//     }

//     setupEvents($sheet) {
//         $(document).on("mousedown touchstart", ".attached_chord", (e)=>this.onChordPrefabDragStart(e))
//         $sheet.on("mouseenter", "char, chord:not([type=fake])", (e)=>this.onElementMouseEnter(e)) // touch没有enter事件，只能在touchmove里通过坐标获取元素了
//         $sheet.on("contextmenu", "char, info, chord:not([type=fake]), newline", (e)=>this.onElementContext(e))
//         $(document).bind("mouseup touchend", (e)=>this.onCursorUp(e))
//         $(document).bind("mousemove touchmove", (e)=>this.onCursorMove(e))

//         $("#editor_context").bind("mouseleave", ()=>$("#editor_context").fadeOut(300))
//         $(document).bind("click", (e)=>this.closeElementContext(e))

//         // 和弦复制所需时间
//         $(document).on("mousedown touchstart", "chord", (e)=>this.onChordDragStart(e))

//         // 节奏模式开关
//         $("#toggle_cursor_mode").bind("change", (e)=>{
//             if ($(e.currentTarget).prop("checked") == true) {
//                 g_CursorInputControl.start()
//             }
//             else {
//                 g_CursorInputControl.stop()
//             }
//         })

//         // 播放
//         $sheet.on("click", "chord, chord_pure", (e)=>{
//             let $element = $(e.currentTarget)
//             let chordName = ($element.prop("nodeName") == "CHORD" ? $element.find("chord_name").text() : $element.text())
//             g_UkulelePlayer.playChord(g_ChordManager.getChord(chordName), 0.5, 0.2)
//         })

//         // 插入的右键菜单
//         $("#editor_context_menu_insert_pos").children().bind("click", (e)=>this.onInsertPosClick(e))
//         $("#editor_context_menu_insert_type").children().bind("click", (e)=>this.onInsertTypeClick(e))
//     }

//     onChordDragStart(e) {
//         let isChordCopyOn = e.ctrlKey
//         let isChordMoveOn = e.shiftKey
//         if (isChordCopyOn) {
//             this.isDraggingChord = true
//             let chordName = $(e.currentTarget).find("chord_name").text()
//             this.draggingChordName = chordName
//             $("#drag_mark").text(chordName)
//             $("#drag_mark").show()
//             console.log("复制和弦：", chordName)
//         }
//         else if (isChordMoveOn) {
//             this.isDraggingChord = true
//             let chordName = $(e.currentTarget).find("chord_name").text()
//             this.draggingChordName = chordName
//             $("#drag_mark").text(chordName)
//             $("#drag_mark").show()
//             $(e.currentTarget).replaceWith(g_Editor.createCharFromChord($(e.currentTarget)))
//             console.log("移动和弦：", chordName)
//         }
//     }

//     onChordPrefabDragStart(e) {
//         e.preventDefault()

//         this.isDraggingChord = true
//         let chordName = e.currentTarget.dataset.name
//         this.draggingChordName = chordName
//         $("#drag_mark").text(chordName)
//         $("#drag_mark").show()
//         console.log("拖拽和弦：", chordName)
//         this.onCursorMove(e)
//     }

//     onElementMouseEnter(e) {
//         this.onElementCursorEnter($(e.currentTarget))
//     }

//     onElementCursorEnter($e) {
//         if (!this.isDraggingChord) return;
//         switch($e[0].tagName) {
//             case "CHAR" : {
//                 this.recoverEditedElement()
//                 this.editedType = "char"
//                 let char = $e.text()
//                 if (char == " ") char = "<placeholder></placeholder>"; // 空格则转为换位符
//                 this.$fakeChord = g_Editor.createChord(char, this.draggingChordName)
//                 this.$fakeChord.attr("type", "fake")
//                 this.$fakeChord.css("opacity", 0.5)
//                 $e.replaceWith(this.$fakeChord)
//                 break;
//             }
//             case "CHORD" : {
//                 this.recoverEditedElement()

//                 this.editedType = "chord"
//                 let $chord = $e
//                 $chord.css("opacity", 0.5)

//                 let $chordName = $chord.find("chord_name")
//                 this.originChordName = $chordName.text()
//                 $chordName.text(this.draggingChordName)

//                 this.$editedChord = $chord
//                 break;
//             }
//         }
//     }

//     onCursorMove(e) {
//         if (!this.isDraggingChord) return;

//         let $mark = $("#drag_mark")
//         let [x, y] = _getMouseOrTouchClient(e)
//         if (e.type.match(/^touch/)) {
//             const markOffsetY = -200
//             const touchPosShiftY = 40
//             $mark.css({ // 手机上显示在上方
//                 left: x - $mark.innerWidth() / 2,
//                 top: y - $mark.innerHeight() + markOffsetY,
//             })

//             let $touchOverElement = _getTouchOverElement(x, y + markOffsetY + touchPosShiftY)
//             if ($touchOverElement && $touchOverElement.length > 0) {
//                 this.onElementCursorEnter($touchOverElement)
//             }
//         }
//         else {
//             $mark.css({ // PC上显示在下方
//                 left: x - $mark.innerWidth() / 2,
//                 top: y + 20
//             })
//         }
//     }

//     onCursorUp(e) {
//         if (!this.isDraggingChord) return;
//         e.preventDefault()

//         if (this.editedType == "char") {
//             this.$fakeChord.css("opacity", 1.0)
//             this.$fakeChord.removeAttr("type")
//             this.$fakeChord = null
//         }
//         else if (this.editedType == "chord"){
//             this.$editedChord.css("opacity", 1.0)
//             let $chordName = this.$editedChord.find("chord_name")
//             $chordName.text(this.draggingChordName)
//         }

//         this.$fakeChord = null
//         this.$editedChord = null
//         this.originChordName = null
//         this.editedType = null
//         this.draggingChordName = ""

//         this.isDraggingChord = false
//         this.$curContextElement = null

//         $("#drag_mark").hide()
//     }

//     onElementContext(e) {
//         e.preventDefault()
//         let $e = $(e.currentTarget)
//         this.$curContextElement = $e

//         let items = []
//         items.push({
//             name: "插入...",
//             func: (e)=>this.onInsertClick(e)
//         })
//         let tagName = e.currentTarget.tagName

//         switch(tagName) {
//             case "CHAR": {
//                 items.push({
//                     name: "编辑文字",
//                     func: ()=>g_Editor.editChar($e)
//                 })
//                 break
//             }
//             case "INFO": {
//                 items.push({
//                     name: "编辑文字",
//                     func: ()=>g_Editor.editInfo($e)
//                 })
//                 break
//             }
//             case "CHORD": {
//                 items.push({
//                     name: "编辑文字",
//                     func: ()=>g_Editor.editChord($e)
//                 })
//                 items.push({
//                     name: "删除和弦",
//                     func: ()=>g_Editor.recoverChordToChar($e)
//                 })
//                 items.push({
//                     name: "添加下划线",
//                     func: ()=>g_Editor.addUnderline($e)
//                 })

//                 if (g_Editor.hasUnderlineToNextChord($e)) {
//                     items.push({
//                         name: "删除下划线",
//                         func: ()=>g_Editor.deleteUnderline($e)
//                     })
//                 }

//                 break
//             }
//             case "NEWLINE": {
//                 break
//             }
//             default: return;
//         }

//         items.push({
//             name: "删除",
//             func: ()=>g_Editor.removeElement($e)
//         })

//         let $context = $("#editor_context")
//         let $contextMenu = $("#editor_context_menu")
//         $contextMenu.empty()
//         for(let item of items) {
//             let $item = $(`<div class="editor_context_menu_item">${item.name}</div>`)
//             $item.bind("click", (e)=> {item.func(e); $context.fadeOut(300);})
//             $contextMenu.append($item)
//         }

//         $context.css({
//             left: e.clientX,
//             top: e.clientY
//         })
//         $context.fadeIn(200)
//     }

//     onInsertClick(e) {
//         if (!this.$curContextElement) return;
//         $("#editor_context").hide()
//         let $contextInsertPos = $("#editor_context_insert_pos")
//         $contextInsertPos.css({
//             left: e.clientX - $contextInsertPos.width() / 2,
//             top: e.clientY - $contextInsertPos.height() / 2,
//         })
//         $contextInsertPos.show()
//     }

//     onInsertPosClick(e) {
//         if (!this.$curContextElement) return;
//         let pos = $(e.currentTarget).attr("value")
//         if (pos != "before" && pos != "after") throw "插入位置类型错误";
//         this.insertPos = pos
//         $("#editor_context_insert_pos").hide()
//         let $contextInsertType = $("#editor_context_insert_type")
//         $contextInsertType.css({
//             left: e.clientX - $contextInsertType.width() / 2,
//             top: e.clientY - $contextInsertType.height() / 2,
//         })
//         $contextInsertType.show()
//     }

//     onInsertTypeClick(e) {
//         if (!this.$curContextElement) return;
//         let type = $(e.currentTarget).attr("value")
//         $("#editor_context_insert_type").hide()
//         switch (type) {
//             case "info":
//                 g_Editor.insertInfo(this.$curContextElement, this.insertPos);
//                 break;
//             case "char":
//                 g_Editor.insertChar(this.$curContextElement, this.insertPos);
//                 break;
//             case "newline":
//                 g_Editor.insertLine(this.$curContextElement, this.insertPos);
//                 break;
//             default:
//                 throw "插入元素类型错误";
//                 break;
//         }
//     }

//     closeElementContext(e) {
//         let $e = $(e.target)
//         if ($("#editor_context").has($e).length > 0) return;
//         if ($("#editor_context_insert_pos").has($e).length > 0) return;
//         if ($("#editor_context_insert_type").has($e).length > 0) return;

//         $("#editor_context").fadeOut(300)
//         $("#editor_context_insert_pos").fadeOut(300)
//         $("#editor_context_insert_type").fadeOut(300)
//     }

//     recoverEditedElement() {
//         if (this.editedType == "char") {
//             this.$fakeChord.replaceWith(g_Editor.createCharFromChord(this.$fakeChord))
//             this.$fakeChord = null
//         }
//         else if (this.editedType == "chord"){
//             this.$editedChord.css("opacity", 1.0)
//             let $chordName = this.$editedChord.find("chord_name")
//             $chordName.text(this.originChordName)
//         }
//     }
// }

// var g_EditorControl = null

// window.onload = function () {
//     $g_Sheet = $("#sheet")
//     g_EditorControl = new EditorControl($g_Sheet)

//     // 检查环境
//     if (document.body.clientWidth / document.body.clientHeight < 0.8) { // 竖屏
//         document.documentElement.style.setProperty('--base-font-size', "4vw")
//         $(document.body).attr("env", "mobile")
//     }
//     else {
//         $(document.body).attr("env", "pc")
//     }

//     setupLayoutEvent()
//     setupRawLyricEvent()
//     setupToolsEvent()
//     setupDragLoadEvent()

//     let fileName = getQueryVariable("sheet")
//     if (!fileName) console.error("未加载曲谱")
//     else loadSheetFromUrl(`./sheets/${fileName}.sheetEdit`)
// }

// function loadSheetFromUrl(url) {
//     return $.get({
//         url: encodeURI(url),
//         success: function (data, status) {
//             loadSheet(data)
//         },
//         error: function(){
//             $("#song_title").text("未找到曲谱")
//     　　},
//     })
// }

// function loadSheet(str) {
//     let parsedSheet = new DigitalSheet(str)
//     vmSheet.title = parsedSheet.getUniqueValue("title")
//     vmSheet.singer = parsedSheet.getUniqueValue("singer")
//     vmSheet.originalKey = parsedSheet.getUniqueValue("originalKey")
//     vmSheet.sheetKey = parsedSheet.getUniqueValue("sheetKey")
//     vmChordTool.attachedChords = parsedSheet.getArrayValue("attachedChords")

//     let $sheet = parsedSheet.getSheetElement()
//     $sheet = createSheetFromParseSheet($sheet)
//     $g_Sheet.children().trigger("fit")
// }

// function createSheetFromParseSheet($sheet) {
//     $g_Sheet.empty()

//     function createFromElement(element) {
//         let list = []
//         let $e = $(element)
//         if (element.nodeType === 3) {
//             for(let char of element.nodeValue) {
//                 if (char == "\n")
//                     list.push($(`<newline>⇲</newline>`))
//                 else
//                     list.push($(`<char>${char}</char>`))
//             }
//         }
//         else if ($e.is("newline")) {
//             list.push($(`<newline>⇲</newline>`))
//         }
//         else if ($e.is("underline, underline_pure")) {
//             let $underline = $e.clone()
//             $underline.empty()
//             $e.contents().each(function(){
//                 for(let $eChild of createFromElement(this)) {
//                     $underline.append($eChild)
//                 }
//             })
//             list.push($underline)
//         }
//         else list.push($e)

//         return list
//     }

//     $sheet.each(function(){
//         for(let $e of createFromElement(this)) {
//             $g_Sheet.append($e)
//         }
//     })
// }

// var vmSheet = new Vue({
//     el: '#sheet_block',
//     data: {
//         title: "加载中...",
//         singer: "————",
//         originalKey: "C",
//         sheetKey: "C",
//     },
//     methods: {
//         loadSheetFromFile() {
//             let input = document.createElement('input');
//             input.type = 'file';
//             input.accept = ".sheet,.sheetEdit"
//             input.onchange = e => {
//                 let file = e.target.files[0];
//                 let fileReader = new FileReader()
//                 fileReader.onload = ()=> loadSheet(fileReader.result)
//                 fileReader.readAsText(file)
//             }
//             input.click();
//             input.remove()
//         },

//         saveSheetToFile() {
//             let fileData = g_Editor.generateSheetFileData()
//             let time = new Date().toLocaleDateString().replace(/\//g, "_")

//             let blob = new Blob([fileData], {type: 'text/plain'})
//             let download = document.createElement("a");
//             download.href = window.URL.createObjectURL(blob)
//             download.setAttribute('download', `${this.title}-${this.singer}-${time}.sheetEdit`)
//             download.click()
//             download.remove()
//         },

//         sheetKeyChange: function(e){
//             let newKey = $(e.currentTarget).val()
//             let oldKey = this.sheetKey
//             if (newKey == oldKey) return;
//             let confirmed = confirm("你修改了曲谱调式，是否将和弦一起转调？")
//             if (confirmed) {
//                 _shiftKey(oldKey, newKey)
//             }
//             this.sheetKey = newKey
//         }
//     },
// })

// // 配置布局事件
// function setupLayoutEvent() {
//     let $layoutSlider = $("#layout_slider")
//     $layoutSlider.bind("input", ()=>{
//         let value = $layoutSlider.val()
//         value = Math.max(5, Math.min(50, value))
//         $layoutSlider.val(value)
//         $("#tools_block").css("width", `${value}%`)
//         $("#tools_block_fix").css("width", `${value}%`)
//         $("#sheet_block").css("width", `${100 - value}%`)
//     })

//     let $helpButton = $("#help_button")
//     $helpButton.bind("click", ()=>runPresetTip("test"))
// }

// function setupRawLyricEvent() {
//     // 开启歌词编辑面板按钮
//     $("#edit_raw_lyric_button").bind("click", ()=>{
//         let lyric = getRawTextFromSheet()
//         $("#raw_lyric_textarea").val(lyric)
//         $("#raw_lyric_panel").show()
//     })

//     // 生成曲谱确认按钮
//     $("#raw_lyric_button_confirm").bind("click", ()=>{
//         let newLyric = $("#raw_lyric_textarea").val()
//         if ($g_Sheet.children("chord, info, chord_pure").length > 0) {
//             let confirmed = confirm("已经制作的曲谱将被覆盖！\n是否确认？")
//             if (!confirmed) return
//         }
//         createSheetFromLyric(newLyric)

//         $("#raw_lyric_panel").hide()
//     })

//     // 取消按钮
//     $("#raw_lyric_button_cancel").bind("click", ()=>{
//         $("#raw_lyric_panel").hide()
//     })

// }

// function setupToolsEvent() {
//     $("#chord_tool_edit_button").bind("click", ()=>vmChordPanel.open())
// }

// function setupDragLoadEvent() {
//     let isDraggingFile = false
//     $(document).bind("dragenter", (e)=>{
//         let items = e.originalEvent.dataTransfer.items
//         if (items.length > 0 && items[0].kind == "file") {
//             isDraggingFile = true
//             $("#drop_hint_panel").fadeIn(200)
//         }
//     })
//     let fadeOutTimer = null
//     $(document).bind("dragover", (e)=>{
//         if (isDraggingFile) {
//             e.preventDefault();
//             clearTimeout(fadeOutTimer)
//             fadeOutTimer = setTimeout(()=>{
//                 isDraggingFile = false
//                 $("#drop_hint_panel").fadeOut(200)
//             }, 100)
//         }
//     })
//     $(document).bind("drop", (e)=>{
//         e.preventDefault()
//         if (e.originalEvent.dataTransfer.files) {
//             let file = e.originalEvent.dataTransfer.files[0]
//             let extension = file.name.split(".").pop()
//             let fileReader = new FileReader()
//             fileReader.onload = ()=> {
//                 let fileData = null
//                 switch (extension) {
//                     case "sheet":
//                     case "sheetEdit":
//                         fileData = fileReader.result
//                         break;
//                     case "xxx":
//                         fileData = convertXXX(fileReader.result)
//                         break;
//                     default:
//                         throw "不支持的格式"
//                         break;
//                 }
//                 loadSheet(fileData)
//             }
//             fileReader.readAsText(file, "UTF8")
//         }
//     })
// }

// // 从纯文本歌词创建曲谱
// function createSheetFromLyric(lyrics) {
//     $g_Sheet.empty()
//     let lyricBlocks = lyrics.split("")
//     for(let char of lyricBlocks) {
//         if (char == "\n")
//             $g_Sheet.append($(`<newline>⇲</newline>`))
//         else
//             $g_Sheet.append($(`<char>${char}</char>`))
//     }
// }

// // 从曲谱提取纯文本歌词
// function getRawTextFromSheet() {
//     let lyric = ""
//     let $nodes = $g_Sheet.contents()
//     $nodes.each(function(){ // 一个坑，()=>是没有自己的this的
//         if (this.nodeType === 3) lyric += this.nodeValue
//         else{
//             switch(this.tagName) {
//                 case "CHAR": lyric += $(this).text(); break;
//                 case "CHORD": lyric += _getChordTextNode($(this)).text(); break;
//                 case "NEWLINE": lyric += "\n"; break;
//             }
//         }
//     })
//     return lyric
// }

// function drawChordsInElement($e) {
//     let $chords = $e.find(".prefab_chord")
//     $chords.each(function(){
//         let chordName = this.dataset.name
//         let chord = g_ChordManager.getChord(chordName)
//         if (chord)
//             drawChord($(this), chord, chordName)
//         else
//             drawChordNotFound($(this), chordName)
//     })
//     $chords.trigger("fit")
// }

// function drawChordsOnElement($e) {
//     let $chord = $e.filter(".prefab_chord")
//     if ($chord.length == 0) return;
//     let chordName = $chord[0].dataset.name
//     let chord = g_ChordManager.getChord(chordName)
//     if (chord)
//         drawChord($chord, chord, chordName)
//     else
//         drawChordNotFound($chord, chordName)
//     $chord.trigger("fit")
// }

// var vmChordTool = new Vue({
//     el: '#chord_tool',
//     data: {
//         stringNum: 4,
//         attachedChords: [],
//     },
//     methods: {
//     },
//     watch: {
//         attachedChords: function () {
//             this.$nextTick(()=>{
//                 drawChordsInElement($("#attached_chord_list"))
//             });
//         }
//     }
// })

// const g_RecommendChordInCMajor = {
//     "常用": [ "C", "Dm", "Em", "F", "G", "Am", "E"],
//     "修饰音": [ "C7", "G7", "E7", "Csus4", "Gsus4", "Gsus2"],
//     "其他": [ "D", "A", "Fm", "Gm"],
// }

// var vmChordPanel = new Vue({
//     el: '#chord_panel',
//     data: {
//         key: null,
//         attachedChords: [],
//         recommendChords: [],
//         searchChords: [],
//         searchText: "",

//         _isDraggingChord: false,
//         _startDraggingChordIndex: null,
//         _$draggingChord: null
//     },
//     mounted: function(){
//         $("#chord_panel_attached_chord_list").on("mousedown touchstart", ".prefab_chord", this.dragSortStart)
//         $("#chord_panel_attached_chord_list").on("mouseover", ".prefab_chord", this.dragSortOver)
//     },
//     methods: {
//         open() {
//             this.key = $("#sheet_current_key_select").val()
//             this.attachedChords = _clone(vmChordTool.attachedChords)
//             this.updateAttachedChords()
//             this.updateRecommendChords()
//             $("#chord_panel").show()
//         },
//         finish() {
//             vmChordTool.attachedChords = _clone(this.attachedChords)
//             this.close()
//         },
//         cancel() {
//             let confirmed = confirm("确认放弃修改的和弦？")
//             if (!confirmed) return;
//             this.close()
//         },
//         close() {
//             $("#chord_panel").hide()
//         },
//         updateRecommendChords() {
//             if (this.key) {
//                 let recommendChords = {}
//                 for(let type in g_RecommendChordInCMajor) {
//                     recommendChords[type] = []
//                     for(let chordName of g_RecommendChordInCMajor[type]) {
//                         let newChordName = g_ChordManager.shiftKey(chordName, "C", this.key)
//                         recommendChords[type].push(newChordName)
//                     }
//                 }
//                 this.recommendChords = recommendChords
//             }
//             else this.recommendChords = {};
//         },

//         updateSearchChords(text) {
//             let searchResult = []
//             text = text.replace(/\s/g, "")

//             if (text != "") {
//                 g_ChordManager.traverse((chordName) => {
//                     if (text == chordName) { // 完全匹配，优先级最大
//                         searchResult.push({name:chordName, priority: 1})
//                     }
//                     else if (g_ChordManager.isAlias(text, chordName)) { // 别名
//                         searchResult.push({name:chordName, priority: 2})
//                     }
//                     else if (chordName.toLowerCase().indexOf(text.toLowerCase()) != -1) { // 大小写不敏感，和弦包含文字
//                         searchResult.push({name:chordName, priority: 3})
//                     }
//                     else if (text.toLowerCase().indexOf(chordName.toLowerCase()) != -1) { // 大小写不敏感，文字包含和弦
//                         searchResult.push({name:chordName, priority: 4})
//                     }
//                 })
//             }

//             searchResult.sort((a, b) => {
//                 if (a.priority != b.priority) return a.priority - b.priority;
//                 else return a.name.localeCompare(b);
//             })

//             this.searchChords = searchResult.map(e=>e.name)
//         },

//         updateAttachedChords() {
//             let $list = $("#chord_panel_attached_chord_list")
//             $list.empty()
//             for(let chordName of this.attachedChords) {
//                 let $chord = $(`<div class="prefab_chord drag_sort" data-name="${chordName}"></div>`)
//                 $list.append($chord)
//             }
//             drawChordsInElement($list)
//         },

//         isAttached(chordName) {
//             return this.attachedChords.find(e => e == chordName) != undefined
//         },

//         addAttachedChord(chordName) {
//             if (this.isAttached(chordName)) {
//                 alert(`和弦${chordName}已存在`)
//                 return
//             }

//             let $list = $("#chord_panel_attached_chord_list")
//             let $chord = $(`<div class="prefab_chord" data-name="${chordName}"></div>`)
//             $list.append($chord)
//             drawChordsOnElement($chord)
//             this.attachedChords.push(chordName)
//         },

//         deleteAttachedChord(index) {
//             let $list = $("#chord_panel_attached_chord_list")
//             let $chord = $list.children(`.prefab_chord:eq(${index})`)
//             $chord.remove()
//             this.attachedChords.splice(index, 1)
//         },

//         dragSortStart(e) {
//             let $e = $(e.currentTarget)
//             this._isDraggingChord = true
//             this._$draggingChord = $e
//             this._startDraggingChordIndex = $e.index()

//             $e.css("opacity", 0.5)
//             $e.attr("type", "fake")
//             $("#chord_panel_drag_mark").empty()
//             $("#chord_panel_drag_mark").append($e.clone())
//             $("#chord_panel_drag_mark").show()
//             this.dragSortMove(e)

//             $(document).bind("mousemove touchmove", this.dragSortMove)
//             $(document).bind("mouseup touchend", this.dragSortEnd)
//         },

//         dragSortMove(e) {
//             let [x, y] = _getMouseOrTouchClient(e)
//             $("#chord_panel_drag_mark").css({
//                 left: x,
//                 top: y,
//             })
//             // TODO: 对触屏需要判断元素，手动触发over事件
//         },

//         dragSortOver(e) {
//             if (this._isDraggingChord) {
//                 // 更新元素
//                 let $e = $(e.currentTarget)
//                 let curIndex = $e.index()
//                 let draggingIndex = this._$draggingChord.index()
//                 if (curIndex == draggingIndex) return;

//                 if (curIndex > draggingIndex) $e.after(this._$draggingChord);
//                 else $e.before(this._$draggingChord);
//             }
//         },

//         dragSortEnd() {
//             if (this._$draggingChord) {
//                 this._$draggingChord.removeAttr("style")
//                 this._$draggingChord.removeAttr("type")

//                 let curIndex = this._$draggingChord.index()
//                 let updatedChords = this.attachedChords
//                 let chordName = updatedChords.splice(this._startDraggingChordIndex, 1)[0]
//                 updatedChords.splice(curIndex, 0, chordName)
//                 this.attachedChords = updatedChords
//             }
//             $("#chord_panel_drag_mark").hide()
//             this._isDraggingChordName = ""
//             this._isDraggingChord = false
//             this._startDraggingChordIndex = null
//             $(document).unbind("mousemove touchmove", this.dragSortMove)
//             $(document).unbind("mouseup touchend", this.dragSortEnd)
//             this.updateAttachedChords()
//         },

//         clickTrashcan() {
//             let confirmed = confirm("确认删除所有和弦？\n（可以把和弦拖到这里删除哦~）")
//             if (!confirmed) return;
//             let $list = $("#chord_panel_attached_chord_list")
//             $list.empty()
//             this.attachedChords = []
//         },

//         dropTrashcan() {
//             if (!this._isDraggingChord) return;
//             this._$draggingChord.remove()
//             this._$draggingChord = null
//             this.attachedChords.splice(this._startDraggingChordIndex, 1)
//         }
//     },
//     watch: {
//         recommendChords: function () {
//             this.$nextTick(()=>{
//                 drawChordsInElement($("#chord_panel_recommend_chord_list"))
//             });
//         },
//         searchChords: function () {
//             this.$nextTick(()=>{
//                 drawChordsInElement($("#chord_panel_search_chord_list"))
//             });
//         },
//         searchText: function() {
//             this.updateSearchChords(this.searchText)
//         }
//     }
// })

// function _clone(obj) {
//     return JSON.parse(JSON.stringify(obj))
// }

// function _getMouseOrTouchClient(e) {
//     if (e.clientX) {
//         return [e.clientX, e.clientY]
//     }
//     else {
//         return [e.originalEvent.changedTouches[0].clientX, e.originalEvent.changedTouches[0].clientY]
//     }
// }

// function _getTouchOverElement(x, y) {
//     let element = document.elementFromPoint(x, y);
//     let $e = $(element)
//     if ($e.is("char")) return $e;
//     else if ($e.is("chord:not([type=fake])")) return $e;
//     else return null;
// }

// function _getInputText(tips, defaultText = "") {
//     return prompt(tips, defaultText)
// }

// function _getChordTextNode($e) {
//     return $e.contents().filter(function() {
//         return this.nodeType === 3;
//     });
// }

// function _shiftKey(oldKey, newKey) {
//     let $chords = $("chord_name,chord_pure")
//     $chords.each((i, e)=>{
//         let $chord = $(e)
//         let originalChord = $chord.text()
//         let newChord = g_ChordManager.shiftKey(originalChord, oldKey, newKey)
//         $chord.text(newChord)
//     })

//     for(let i = 0; i < vmChordTool.attachedChords.length; ++i) {
//         let newChord = g_ChordManager.shiftKey(vmChordTool.attachedChords[i], oldKey, newKey)
//         Vue.set(vmChordTool.attachedChords, i, newChord)
//     }
// }
</script>

<style scoped src="./common.css"></style>

<style scoped>
:root {
  --base-font-size: 18px;
  --sheet-font-size: var(--base-font-size);
  --title-base-font-size: calc(var(--base-font-size) * 1.8);
  --title-scale: 1;
  --theme-color: #e9266a;
  --chord-renderer-theme-color: white;
  --chord-renderer-font-color: black;
  --sheet-theme-color: var(--theme-color);

  --tip-text-background-color: var(--theme-color);
  --tip-button-background-color: seagreen;
}

.flex_center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.title {
  overflow: hidden;
  white-space: nowrap;
  word-break: break-all;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.input {
  color: white;
  outline: none;
  border: none;
  background-color: transparent;
}
.input:focus {
  outline: 2% solid var(--theme-color);
}
.input::placeholder {
  color: rgb(192, 106, 106);
}

.select {
  height: 100%;
  margin: 0 10px;
  background-color: transparent;
  color: white;
  font-size: var(--base-font-size);
  border: none;
  outline: 2px solid grey;
}
.select option {
  background-color: black;
}
.select option:checked {
  background-color: grey;
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

.highlight {
  position: relative;
  color: yellow;
  outline: yellow 2px dashed;
}

body[env="pc"] char::after {
  content: "";
  position: absolute;
  left: -4px;
  right: -4px;
  top: -4px;
  bottom: -4px;
  border: 2px solid transparent;
  transition: 0.3s ease-out;
  border-radius: 5px;
  pointer-events: none;
}

body[env="pc"] char:hover::after {
  border: 2px solid white;
  box-shadow: 0 0 5px 2px black;
}

#container {
  width: 100%;
  display: flex;
}
#layout_slider {
  position: fixed;
  width: calc(100% + 14px);
  height: 14px;
  top: 0;
  left: -7px;

  appearance: none;
  background-color: transparent;

  z-index: 2;
}
body[env="mobile"] #layout_slider {
  display: none;
}
#layout_slider::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: none;
  background: var(--theme-color);
}
#tools_block {
  width: 20%;
  height: 100%;
}
#tools_block_fix {
  position: fixed;
  left: 0;
  width: 20%;
  height: 100%;

  box-sizing: border-box;
  outline: 2px black solid;

  display: flex;
  flex-direction: column;
  align-items: center;

  z-index: 1;
}
body[env="mobile"] #tools_block {
  width: 0;
  height: 0;
}
body[env="mobile"] #tools_block_fix {
  bottom: 0;
  width: 100%;
  height: 20%;
}

#sheet_block {
  box-sizing: border-box;
  width: 60%;
  padding: 20px;
  padding-bottom: 50%;
  display: flex;
  flex-direction: column;
}
body[env="mobile"] #sheet_block {
  width: 100%;
  padding: 5vw 5vw 50vh 5vw;
}
#song_title_input {
  height: calc(var(--title-base-font-size) * 2);
  line-height: calc(var(--title-base-font-size) * 2);
  font-size: calc(var(--title-base-font-size) * 1.5);
  color: white;
}

#song_singer_input {
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

#sheet_by {
  margin-top: 5px;
  height: calc(var(--title-base-font-size) * 0.8);
  line-height: calc(var(--title-base-font-size) * 0.8);
  font-size: calc(var(--title-base-font-size) * 0.7);
  color: rgb(156, 156, 156);
}

#sheet {
  margin-top: 10px;
  font-size: var(--base-font-size);
}

.context {
  position: fixed;
  display: none;
  overflow: hidden;
  user-select: none;
  overflow: hidden;
  z-index: 20;

  border-radius: 10px;
}

.context::before {
  position: absolute;
  content: "";

  width: 100%;
  height: 100%;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: var(--theme-color);
  opacity: 0.9;
}

#editor_context {
}

#editor_context_menu {
  display: flex;
  flex-direction: column;

  width: 100%;
}

.editor_context_menu_item {
  padding: 5% calc(var(--base-font-size));
  color: white;
  transition: all 0.2s ease-out;
  cursor: pointer;
  border-radius: 10px;

  display: flex;
  justify-content: flex-start;
  align-items: center;

  z-index: 21;
}

.editor_context_menu_item:hover {
  text-decoration: underline;
}

#editor_context_insert_pos {
}
#editor_context_menu_insert_pos,
#editor_context_menu_insert_type {
  display: flex;
  height: 30px;
}

.panel {
  z-index: 30;

  position: fixed;
  height: 100%;
  width: 100%;
  left: 0;
  top: 0;
}

#raw_lyric_panel {
}
#raw_lyric_container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
}
#raw_lyric_title {
  padding: 20px 0;
}
#raw_lyric_textarea {
  font-family: inherit;
  color: black;
  font-size: var(--base-font-size);
  height: 60%;
  width: 60%;
}
#raw_lyric_button_confirm {
  background: var(--sheet-theme-color);
  color: white;
}
#raw_lyric_button_cancel {
  background: grey;
  color: white;
}
#edit_raw_lyric_button {
  background: var(--sheet-theme-color);
  color: white;
}

#edit_mode_block {
  /* display: none; */
  display: flex;
  flex-direction: column;
}
body[env="mobile"] #edit_mode_block {
  display: none;
}
.edit_mode {
  display: flex;
  align-items: center;
}

#drag_mark {
  position: fixed;
  display: none;
  pointer-events: none;

  padding: 5px 10px;
  border: 2px white solid;
  border-radius: 5px;
  background-color: grey;

  z-index: 20;
}
body[env="mobile"] #drag_mark {
  padding: 10px 20px;
  border-radius: 10px;
  border-width: 8px;
  font-size: 60px;
  opacity: 0.8;
}
body[env="mobile"] #drag_mark::after {
  position: absolute;
  content: "";
  width: 0;
  height: 0;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-top: 40px solid white;

  left: calc(50% - 20px);
  top: 100%;
}

#temp_tip {
  position: fixed;
  max-width: 30%;
  min-height: 40px;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  opacity: 0.6;

  background-color: rgba(37, 160, 143, 0.5);
  border-radius: 20px;
  overflow: hidden;
}
body[env="mobile"] #temp_tip {
  display: none;
}

#drop_hint_panel {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 20;
  display: none;
}
#drop_hint_text {
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);

  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 100px;
  color: var(--theme-color);
  user-select: none;
}

#help_button {
  position: fixed;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
  right: 20px;
  bottom: 20px;
  border-radius: 50%;
  background-color: #ff000080;
  opacity: 0.5;
  user-select: none;
}

#help_button:hover {
  opacity: 1;
}
</style>

<style scoped>
/* 工具栏 */
#tools_title {
  width: 100%;
  background-color: rgb(146, 105, 194);
}
body[env="mobile"] #tools_title {
  display: none;
}
</style>

<style scoped>
:deep(chord::after) {
  content: "";
  position: absolute;
  left: -10px;
  top: calc(-8px - var(--sheet-font-size));
  right: -10px;
  bottom: -2px;
  border: 2px solid transparent;
  transition: 0.3s ease-out;
  border-radius: 5px;
  z-index: 1;
  pointer-events: none;
}

:deep(chord-pure::after) {
  content: "";
  position: absolute;
  left: -10px;
  top: -2px;
  right: -10px;
  bottom: -2px;
  border: 2px solid transparent;
  transition: 0.3s ease-out;
  border-radius: 5px;
  z-index: 1;
  pointer-events: none;
}

:deep(chord:hover::after),
:deep(chord-pure:hover::after) {
  border: 2px solid var(--sheet-theme-color);
  box-shadow: 0 0 5px 2px black;
}

:deep(chord-ruby::before),
:deep(chord-pure::before) {
  content: "▶";
  position: absolute;
  font-size: 20px;
  color: black;
  transform: translate(-50%, -50%);
  top: 50%;
  left: 50%;
  opacity: 0;
  transition: all 0.2s ease-out;
}

:deep(chord:hover chord-ruby::before),
:deep(chord-pure:hover::before) {
  opacity: 0.8;
}
</style>

<style scoped>
/* pc */
#container[env="pc"] #sheet {
  width: calc(100% - 400px);
}

#container[env="pc"] .tools_text {
  width: 100%;
  height: 20px;
  text-align: center;
  line-height: 20px;
  font-size: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

#container[env="pc"] #scale_slider {
  -webkit-appearance: slider-vertical;
}

#container[env="pc"] #auto_scroll_slider {
  -webkit-appearance: slider-vertical;
}
</style>

<style scoped>
/* mobile */
#container[env="mobile"] #sheet {
  width: 90%;
}

#container[env="mobile"] .tools_text {
  width: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 4vw;
}
#container[env="mobile"] #tools_block_2 {
  display: none;
}
#container[env="mobile"] #scale_block {
  flex-direction: row;
}

#container[env="mobile"] #auto_scroll_block {
  flex-direction: row;
}
</style>