<template>
  <div class="editor" :env="getEnv()" :style="globalCssVar">
    <div
      id="sheet_block"
      :style="`width: ${100 - layout.toolWidthPercentage}%`"
    >
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
        <div class="title">原调</div>
        <WebKeySelector class="select" v-model:value="sheetInfo.originalKey" />
        <div class="title">选调</div>
        <WebKeySelector class="select" :value="sheetInfo.sheetKey" @change="onChangeSheetKey" />
      </div>
      <div id="sheet_by" class="title">制谱 锦瑟</div>
      <div class="flex_center">
        <div id="edit_raw_lyric_button" class="button">编辑歌词</div>
        <div class="button" @click="saveSheetToFile">保存</div>
        <div class="button" @click="loadSheetFromFile">载入</div>
      </div>
      <WebSheet
        id="sheet"
        class="sheet_box"
        :sheet-tree="sheetInfo.sheetTree"
        :events="sheetEvents"
      />
    </div>
  </div>

  <div id="tools_block" :style="`width: ${layout.toolWidthPercentage}%;`">
    <div id="tools_title" class="title flex_center">工具栏</div>
    <ToolChord id="chord_tool" v-model:chords="attachedChords" @dragStart="onChordDragStart" />
    <div id="chord_tool_edit_button" class="button" @click="openPanelChord">
      编辑和弦
    </div>
  </div>

  <div
    id="editor_context"
    class="context"
    v-if="contentMenu.show"
    :style="contentMenu.style"
  >
    <div id="editor_context_menu">
      <div class="editor_context_menu_item">插入</div>
      <div class="editor_context_menu_item" @click="editContent()">编辑</div>
      <div class="editor_context_menu_item" @click="editRemove()">删除</div>
      <div class="editor_context_menu_item" @click="editAddUnderline()">
        添加下划线
      </div>
      <div class="editor_context_menu_item" @click="editRemoveUnderline()">
        删除下划线
      </div>
      <div class="editor_context_menu_item" @click="editRecoverChord()">
        恢复和弦为文字
      </div>
    </div>
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

  <div id="drag_mark" v-show="dragChord.is">{{dragChord.chord ? dragChord.chord.name : '错误'}}</div>
  <div id="temp_tip">
    双击可以编辑文字/添加下划线<br />
    按住Ctrl可以复制和弦<br />
    按住Shift可以移动和弦<br />
    拖入保存的文件可以直接加载<br />
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
import $ from "jquery";
import { reactive } from "vue";
import { getQueryVariable, getMouseOrTouchClient, getEnv } from "@/utils/webCommon.js";
import { WebInstrument } from "@/utils/webInstrument.js";
import WebChordManager from "@/utils/webChordManager.js";
import { SheetNode, ENodeType, traverseNode } from "@/utils/sheetNode.js";

import WebSheetParser from "@/utils/webSheetParser";
import WebSheet from "@/components/webSheet/index.vue";
import WebKeySelector from "@/components/keySelector.vue";
import Chord from "@/components/chord/index.vue";
import { get } from "@/utils/request.js";
import ToolChord from "./toolChord.vue";
import PanelChordSelector from "./panelChordSelector.vue";
import AudioPlayer from "./audioPlayer.vue";

let g_ChordManager = new WebChordManager();
let g_UkulelePlayer = new WebInstrument("Ukulele", "Ukulele");
let g_OscillatorPlayer = new WebInstrument("Ukulele", "Oscillator");

function getInputText(tips, defaultText = "") {
  return prompt(tips, defaultText);
}

const Editor = {
  isChord(node) {
    return node
      ? node.type == ENodeType.Chord || node.type == ENodeType.ChordPure
      : false;
  },
  isUnderline(node) {
    return node
      ? node.type == ENodeType.Underline || node.type == ENodeType.UnderlinePure
      : false;
  },
  indexOf(node) {
    if (!node.parent) throw "该节点是根节点";
    return node.parent.children.findIndex((e) => e === node);
  },
  commonAncestor(node1, node2) {
    let node1Ancestors = [];
    let tempNode = node1;
    while (tempNode.parent) {
      node1Ancestors.push(tempNode.parent);
      tempNode = tempNode.parent;
    }
    tempNode = node2;
    while (tempNode.parent) {
      if (node1Ancestors.includes(tempNode.parent)) return tempNode.parent;
      tempNode = tempNode.parent;
    }
    return null;
  },
  nextUntil(node1, node2, containStart = false, containEnd = false) {
    if (node1.parent != node2.parent) throw "元素不同级";
    return node1.parent.children.slice(
      this.indexOf(node1) + (containStart ? 0 : 1),
      this.indexOf(node2) + (containEnd ? 1 : 0)
    );
  },
  parentsOf(node) {
    let list = [];
    while (node.parent) {
      list.push(node.parent);
      node = node.parent;
    }
    return list;
  },
  parentUntil(node, target) {
    // 找到以target为父节点的祖先节点
    while (node.parent != target) {
      if (!node.parent) return null;
      node = node.parent;
    }
    return node;
  },
  traverseDFS(node, callback) {
    for (let i = 0; i < node.children.length; ++i) {
      this.traverseDFS(node.children[i], callback);
    }
    callback(node);
  },
  traverseNext(node, index, callback) {
    if (callback(node)) return node;
    // 继续向后遍历
    // 已知当前节点、起始索引
    // 递归调用索引>起始索引的子节点，传入索引=-1，表示该节点需要被完整遍历，不再遍历回父节点
    // 如果起始索引>-1，且有父节点，递归调用父节点，传入索引=自身索引
    for (let i = index + 1; i < node.children.length; ++i) {
      let res = this.traverseNext(node.children[i], -1, callback);
      if (res) return res;
    }
    if (index > -1 && node.parent)
      return this.traverseNext(node.parent, this.indexOf(node), callback);
    else return null;
  },
  traversePrev(node, index, callback) {
    if (callback(node)) return node;
    // 继续向前遍历
    // 已知当前节点、结束索引
    // 递归倒序调用索引<结束索引的子节点，传入索引=其孩子数量，表示该节点需要被完整遍历，不再遍历回父节点
    // 如果起始索引<其孩子数量，且有父节点，递归调用父节点，传入索引=自身索引
    for (let i = index - 1; i >= 0; --i) {
      let res = this.traversePrev(node.children[i], node.children[i].children.length, callback);
      if (res) return res;
    }
    if (index < node.children.length && node.parent)
      return this.traversePrev(node.parent, this.indexOf(node), callback);
    else return null;
  },
  findNextNodeByType(node, type) {
    return this.traverseNext(node, node.children.length, (n) => n != node && n.type == type);
  },
  findPrevNodeByType(node, type) {
    return this.traversePrev(node, -1, (n) => n != node && n.type == type);
  },
  insert(parent, index, data, replace = 0) {
    if (index < 0) throw "索引错误";

    if (Array.isArray(data)) {
      for (let newNode of data) newNode.parent = parent;
      parent.children.splice(index, replace, ...data);
    } else {
      data.parent = parent;
      parent.children.splice(index, replace, data);
    }
  },
  replace(node, data) {
    this.insert(node.parent, this.indexOf(node), data, 1);
  },
  insertAfter(node, data) {
    this.insert(node.parent, this.indexOf(node) + 1, data, 0);
  },
  insertBefore(node, data) {
    this.insert(node.parent, this.indexOf(node), data, 0);
  },
  remove(data) {
    if (Array.isArray(data)) {
      for (let node of data) {
        this.replace(node, []);
        node.parent = null;
      }
    } else {
      this.replace(data, []);
      data.parent = null;
    }
  },
  append(parent, data) {
    this.insert(parent, parent.children.length, data, 0);
  },
  prepend(parent, data) {
    this.insert(parent, 0, data, 0);
  },
  createChordNode(content, chordName) {
    let node = reactive(new SheetNode(ENodeType.Chord));
    node.content = content;
    node.chord = chordName;
    return node;
  },

  createTextNodes(content) {
    let nodes = [];
    for (let char of content) {
      let node = reactive(new SheetNode(ENodeType.Text));
      node.content = char;
      nodes.push(node);
    }
    return nodes;
  },

  hasUnderlineToNextChord(chordNode) {
    if (!Editor.isChord(chordNode)) throw "类型错误";
    let chordType = chordNode.type;
    let underlineType;
    switch (chordType) {
      case ENodeType.Chord:
        underlineType = ENodeType.Underline;
        break;
      case ENodeType.ChordPure:
        underlineType = ENodeType.UnderlinePure;
        break;
      default:
        throw "类型错误";
    }

    let nextChordNode = Editor.findNextNodeByType(chordNode, chordType);
    if (!nextChordNode) return false

    let commonAncestorNode = Editor.commonAncestor(chordNode, nextChordNode);
    return commonAncestorNode.type == underlineType;
  },

  // insert($base, $inserted, pos) {
  //     switch (pos) {
  //         case "before":
  //             while(true) {
  //                 if ($base.is("char")) break; // 文字前面必定可以插入
  //                 else if ($base.parent().is("underline") && $base.index() == 0) {
  //                     // 如果非文字，且是下划线的第一个元素，那么移到上一级检测
  //                     $base = $base.parent();
  //                     continue;
  //                 }
  //                 break;
  //             }
  //             $base.before($inserted)
  //             break;
  //         case "after":
  //             while(true) {
  //                 if ($base.is("char")) break; // 文字后面必定可以插入
  //                 else if ($base.parent().is("underline") && $base.index() == $base.parent().children().length - 1) {
  //                     // 如果非文字，且是下划线的最后一个元素，那么移到上一级检测
  //                     $base = $base.parent();
  //                     continue;
  //                 }
  //                 break;
  //             }
  //             $base.after($inserted)
  //             break;
  //         default:
  //             throw "插入位置类型错误"
  //             break;
  //     }
  // },

  insertChar($e, pos) {
    let newChars = getInputText("插入文字");
    if (newChars) {
      let chars = newChars.split("");
      for (let char of chars) {
        this.insert($e, `<char>${char}</char>`, pos);
      }
    }
  },

  insertInfo($e, pos) {
    let text = getInputText("插入标记");
    if (text) {
      this.insert($e, `<info>${text}</info>`, pos);
    }
  },

  insertLine($e, pos) {
    this.insert($e, `<newline>⇲</newline>`, pos);
  },

  

  elementToFileStr($e) {
    var that = this;
    let tagName = $e[0].tagName;
    switch (tagName) {
      case "CHAR":
        return $e.text();
      case "NEWLINE":
        return "\n";
      case "CHORD": {
        let char = _getChordTextNode($e).text();
        if (char == "") char = "_";
        let chordName = $e.find("chord_name").text();
        return `[${chordName}]${char}`;
      }
      case "UNDERLINE": {
        let $children = $e.children();
        let str = "{";
        $children.each(function () {
          str += that.elementToFileStr($(this));
        });
        str += "}";
        return str;
      }
      default:
        return `[不支持的元素${tagName}]`;
    }
  },
};

const EditorAction = {
  remove(node) {
    // 非和弦，直接删除即可
    if (Editor.isChord(node)) { 
      this.removeAllUnderlineOnChord(node)
    }
    Editor.remove(node) 
  },
  editTextContent(node, newContent) {
    if (node.type != ENodeType.Text) throw "类型错误，要求文本节点";
    Editor.replace(node, Editor.createTextNodes(newContent));
  },
  editMarkContent(node, newContent) {
    if (node.type != ENodeType.Mark) throw "类型错误，要求标记节点";
    node.content = newContent;
  },
  editChordContent(node, newContent) {
    if (!Editor.isChord(node)) throw "类型错误，要求和弦节点";
    node.content = newContent[0];
    let textNodes = Editor.createTextNodes(newContent.substr(1));
    // 找到最近的父节点下划线，要求和弦不在该下划线的末尾
    let targetNode = node;
    while (
      targetNode.parent &&
      Editor.indexOf(targetNode) == targetNode.parent.children.length - 1
    ) {
      targetNode = targetNode.parent;
    }
    // TODO: 可能要验证一下目标节点是否正确
    Editor.insertAfter(targetNode, textNodes);
  },
  addUnderlineForChord(chordNode) {
    if (!Editor.isChord(chordNode)) throw "类型错误";
    let chordType = chordNode.type;
    let underlineType;
    switch (chordType) {
      case ENodeType.Chord:
        underlineType = ENodeType.Underline;
        break;
      case ENodeType.ChordPure:
        underlineType = ENodeType.UnderlinePure;
        break;
      default:
        console.error("非和弦不能添加下划线");
        return;
    }

    let nextChordNode = Editor.findNextNodeByType(chordNode, chordType);
    if (!nextChordNode) throw "未找到下一个和弦";

    if (chordNode.parent == nextChordNode.parent) {
      // 同一层，那么将起始到结束之间的所有元素都放入一个下划线
      console.log("s e");
      let coveredNodes = Editor.nextUntil(chordNode, nextChordNode, true, true);
      let newUnderlineNode = reactive(new SheetNode(underlineType));
      Editor.insertBefore(chordNode, newUnderlineNode);
      Editor.remove(coveredNodes);
      Editor.append(newUnderlineNode, coveredNodes);
    } else if (Editor.parentsOf(chordNode).includes(nextChordNode.parent)) {
      // 起始在内层，结束在外层，则把起始元素的同级下划线（和结束同层）向后扩展到包围结束和弦
      console.log("[s] e");
      let startUnderlineNode = Editor.parentUntil(
        chordNode,
        nextChordNode.parent
      );
      let coveredNodes = Editor.nextUntil(
        startUnderlineNode,
        nextChordNode,
        false,
        true
      );
      Editor.remove(coveredNodes);
      Editor.append(startUnderlineNode, coveredNodes);
    } else if (Editor.parentsOf(nextChordNode).includes(chordNode.parent)) {
      // 起始在外层，结束在内层，则把结束元素的同级下划线（和起始同层）向前扩展到包围起始和弦
      console.log("s [e]");
      let endUnderlineNode = Editor.parentUntil(nextChordNode, chordNode.parent);
      let coveredNodes = Editor.nextUntil(
        chordNode,
        endUnderlineNode,
        true,
        false
      );
      Editor.remove(coveredNodes);
      Editor.prepend(endUnderlineNode, coveredNodes);
    } else {
      // 起始结束都在内层（且不是同一个下划线），则把他们的同级下划线以及中间的元素合并到一个下划线
      console.log("[s] [e]");
      let commonAncestorNode = Editor.commonAncestor(chordNode, nextChordNode);
      let startUnderlineNode = Editor.parentUntil(chordNode, commonAncestorNode);
      let endUnderlineNode = Editor.parentUntil(
        nextChordNode,
        commonAncestorNode
      );
      let coveredNodes = Editor.nextUntil(
        startUnderlineNode,
        endUnderlineNode,
        false,
        false
      );
      Editor.remove(coveredNodes);
      Editor.append(startUnderlineNode, coveredNodes);
      let endUnderlineChildrenNodes = endUnderlineNode.children.map((n) => n); // map创建新数组
      Editor.remove(endUnderlineChildrenNodes);
      Editor.append(startUnderlineNode, endUnderlineChildrenNodes);
      Editor.remove(endUnderlineNode);
    }
  },
  removeUnderlineOfChord(chordNode) {
    if (!Editor.isChord(chordNode)) throw "类型错误";
    if (!Editor.isUnderline(chordNode.parent)) throw "和弦不在下划线下，无需删除";

    let chordType = chordNode.type;
    let underlineType;
    switch (chordType) {
      case ENodeType.Chord:
        underlineType = ENodeType.Underline;
        break;
      case ENodeType.ChordPure:
        underlineType = ENodeType.UnderlinePure;
        break;
      default:
        console.error("非和弦不能添加下划线");
        return;
    }

    let nextChordNode = Editor.findNextNodeByType(chordNode, chordType);
    if (!nextChordNode) throw "未找到下一个和弦";

    let commonAncestorNode = Editor.commonAncestor(chordNode, nextChordNode);
    if (!commonAncestorNode || !Editor.isUnderline(commonAncestorNode))
      throw "不在下划线下";
    // 起始节点是一个包含（或等于）起始和弦的元素，终止节点同理
    // 起始节点和终止节点一定是兄弟节点
    let startNode = Editor.parentUntil(chordNode, commonAncestorNode);
    let endNode = Editor.parentUntil(nextChordNode, commonAncestorNode);

    // 如果和弦在下划线内，起始和弦其前定有和弦，终止和弦则其后定有和弦
    // 否则就要看兄弟节点其前其后是否有和弦节点
    let beforeStartNodes = startNode.parent.children.slice(
      0,
      Editor.indexOf(startNode)
    );
    let afterStartNodes = startNode.parent.children.slice(
      Editor.indexOf(startNode) + 1
    );
    let beforeEndNodes = endNode.parent.children.slice(
      0,
      Editor.indexOf(endNode)
    );
    let afterEndNodes = endNode.parent.children.slice(
      Editor.indexOf(endNode) + 1
    );
    let hasPrev =
      Editor.isUnderline(startNode) ||
      beforeStartNodes.filter((n) => n.type == chordType).length > 0;
    let hasNextNext =
      Editor.isUnderline(endNode) ||
      afterEndNodes.filter((n) => n.type == chordType).length > 0;

    if (!hasPrev && !hasNextNext) {
      // 下划线只有这两个和弦，则删除整个下划线，内容放到外面
      console.log("_s e_");
      Editor.replace(commonAncestorNode, commonAncestorNode.children);
    } else if (hasPrev && !hasNextNext) {
      // 起始和弦前面还有元素，但结束和弦后面没有，需要把起始和弦之后的所有元素移出
      console.log("_xxx s e_");
      Editor.remove(afterStartNodes);
      Editor.insertAfter(commonAncestorNode, afterStartNodes);
    } else if (!hasPrev && hasNextNext) {
      // 起始和弦前面没有，但结束和弦后面有元素，需要把结束和弦之前的所有元素移出
      console.log("_s e xxx_");
      Editor.remove(beforeEndNodes);
      Editor.insertBefore(commonAncestorNode, beforeEndNodes);
    } else {
      // 前后都有元素，需要从中间断开
      console.log("_xxx s e yyy_");
      let newUnderlineNode = reactive(new SheetNode(underlineType));
      Editor.insertAfter(commonAncestorNode, newUnderlineNode);
      Editor.remove(afterStartNodes);
      Editor.append(newUnderlineNode, afterStartNodes);
      beforeEndNodes = endNode.parent.children.slice(0, Editor.indexOf(endNode)); // 这一堆被放到新位置的，需要更新，这里实际获取到的是之前after和before的交集
      Editor.remove(beforeEndNodes);
      Editor.insertBefore(newUnderlineNode, beforeEndNodes);
    }
  },

  removeAllUnderlineOnChord(chordNode) {
    // 首先对自己进行下划线删除操作，移除自己到后面和弦的下划线
    while(Editor.hasUnderlineToNextChord(chordNode)) {
      EditorAction.removeUnderlineOfChord(chordNode)
    }
    // 如果还在下划线下，则要删除前面和弦的所有下划线
    let prevChordNode = Editor.findPrevNodeByType(chordNode, chordNode.type)
    if (prevChordNode) {
      while(Editor.hasUnderlineToNextChord(prevChordNode)) {
        EditorAction.removeUnderlineOfChord(prevChordNode)
      }
    }
  },

  convertChordToText(node) {
    if (!Editor.isChord(node)) throw "类型错误";
    Editor.replace(node, Editor.createTextNodes(node.content ?? " ")); // 为空，说明原来为占位符，还原为空格?
  },

  recoverChordToChar(chordNode) {
    this.removeAllUnderlineOnChord(chordNode)
    this.convertChordToText(chordNode);
  },
};

export default {
  name: "SheetEditor",
  components: {
    ToolChord,
    PanelChordSelector,
    Chord,
    WebSheet,
    WebKeySelector,
    AudioPlayer
  },
  data() {
    return {
      globalCssVar: {
        "--sheet-font-size": "var(--base-font-size)",
        "--title-base-font-size": "calc(var(--base-font-size) * 1.8)",
        "--title-scale": "1",
        "--sheet-theme-color": "var(--theme-color)",
        "--tip-text-background-color": "var(--theme-color)",
        "--tip-button-background-color": "seagreen",
      },
      env: "pc",
      showChordPanel: false,
      layout: {
        toolWidthPercentage: 20,
      },
      attachedChords: [],
      loaded: false,
      sheetInfo: {
        title: "加载中",
        singer: "",
        by: "",
        originalKey: "",
        sheetKey: "",
        chords: [],
        rhythms: [],
        originalSheetKey: "",
        sheetTree: reactive(new SheetNode(ENodeType.Root)),
      },
      sheetEvents: {
        text: {
          click: (e, node) => {
            console.log("text", node);
          },
          dblclick: (e, node) => {
            this.editContent(node);
          },
          contextmenu: (e, node) => this.openContext(e, node),
          // mouseenter: (e, node) => {
          //   if (!this.dragChord.is) return
          //   if (node == this.dragChord.chordNode) return
          //   this.replaceNodeWithDraggedChord(node)
          // },
        },
        chord: {
          click: (e, node) => {
            this.playChord(g_ChordManager.getChord(node.chord));
          },
          dblclick: (e, node) => {
            this.editAddUnderline(node);
          },
          contextmenu: (e, node) => this.openContext(e, node),
          // mouseenter: (e, node) => {
          //   if (!this.dragChord.is) return
          //   if (node == this.dragChord.chordNode) return
          //   this.replaceNodeWithDraggedChord(node)
          // },
        },
        mark: {
          click: (e, node) => {
            console.log("mark", node);
          },
          dblclick: (e, node) => {
            this.editContent(node);
          },
          contextmenu: (e, node) => this.openContext(e, node),
        },
      },
      player: {
        instrument: "Oscillator",
      },
      contentMenu: {
        show: false,
        node: null,
        style: {
          left: 0,
          top: 0,
        },
      },
      dragChord: {
        is: false,
        chord: {},
        chordNode: null,
        originalNode: null
      },
      layout: {
        vertRatio: 0.7,
        showAudioPlayer: true
      },
    };
  },
  mounted() {
    const env = getEnv()
    if (env == "mobile") {
      this.layout.showAudioPlayer = false
      this.layout.vertRatio = 1.0
    }

    this.$dragMark = $("#drag_mark")

    let sheetName = getQueryVariable("sheet");
    get(`sheets/${sheetName}.sheet`)
      .then((res) => {
        let rootNode = reactive(WebSheetParser.parse(res));
        this.formatSheetTree(rootNode);
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
        this.$nextTick(() => {
          this.loaded = true; // 下一帧才设为加载完成，避免触发watch
        })

        this.attachedChords = this.sheetInfo.chords.map((chordName) =>
          g_ChordManager.getChord(chordName)
        );
        console.log(this.sheetInfo.chords, this.attachedChords);
      })
      .catch((e) => {
        console.error("加载失败", e);
      });

    document.addEventListener("click", () => this.closeContext());
    document.addEventListener("mousemove", (e) => this.onCursorMove(e));
    document.addEventListener("touchmove", (e) => this.onCursorMove(e));
    document.addEventListener("mouseup", () => this.onCursorUp());
    document.addEventListener("touchend", () => this.onCursorUp());
  },
  methods: {
    getEnv,
    formatSheetTree(node) {
      Editor.traverseDFS(node, (n) => {
        // 文本拆分
        if (n.type == ENodeType.Text && n.content.length > 1) {
          Editor.replace(n, Editor.createTextNodes(n.content));
        }
        // 和弦内容拆分
        else if (n.type == ENodeType.Chord && n.content.length > 1) {
          EditorAction.editContent(n, n.content);
        }
      });
    },
    openPanelChord() {
      this.showChordPanel = true;
    },
    openContext(e, node) {
      e.preventDefault();
      this.contentMenu.show = true;
      this.contentMenu.node = node;
      this.contentMenu.style.left = `${e.clientX}px`;
      this.contentMenu.style.top = `${e.clientY}px`;
    },
    closeContext() {
      this.contentMenu.show = false;
      this.contentMenu.node = null;
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
    shiftKey(oldKey, newKey) {
      traverseNode(this.sheetInfo.sheetTree, (node) => {
        if (node.type == ENodeType.Chord || node.type == ENodeType.ChordPure) {
          node.chord = g_ChordManager.shiftKey(node.chord, oldKey, newKey);
        }
      });

      for (let i in this.attachedChords) {
        let chordName = this.attachedChords[i].name
        let newChordName = g_ChordManager.shiftKey(chordName, oldKey, newKey);
        this.attachedChords[i] = g_ChordManager.getChord(newChordName)
      }
    },
    editContent(node = null) {
      node = node ?? this.contentMenu.node;
      let newContent = getInputText("新文本", node.content);
      if (!newContent) return;
      switch (node.type) {
        case ENodeType.Text: {
          EditorAction.editTextContent(node, newContent);
          break;
        }
        case ENodeType.Mark: {
          EditorAction.editMarkContent(node, newContent);
          break;
        }
        case ENodeType.Chord: {
          EditorAction.editChordContent(node, newContent);
          break;
        }
        default: {
          throw "未知的节点，无法编辑内容";
          break;
        }
      }
    },
    editRemove(node = null) {
      node = node ?? this.contentMenu.node;
      EditorAction.remove(node);
    },
    editRemoveUnderline(node = null) {
      node = node ?? this.contentMenu.node;
      EditorAction.removeUnderlineOfChord(node);
    },
    editRecoverChord(node = null) {
      node = node ?? this.contentMenu.node;
      EditorAction.recoverChordToChar(node);
    },
    editAddUnderline(node = null) {
      node = node ?? this.contentMenu.node;
      EditorAction.addUnderlineForChord(node);
    },
    replaceNodeWithDraggedChord(node) {
      let chordNode = this.dragChord.chordNode
      if (node.type == ENodeType.ChordPure) {
        chordNode.type = node.type
        chordNode.content = ''
      } else {
        chordNode.type = ENodeType.Chord
        chordNode.content = node.content
      }
      this.recoverDrag()
      this.dragChord.originalNode = node
      Editor.replace(node, this.dragChord.chordNode)
    },
    recoverDrag() {
      if (this.dragChord.originalNode)
        Editor.replace(this.dragChord.chordNode, this.dragChord.originalNode)
    },
    onChordDragStart(e, chord) {
      this.dragChord.is = true
      this.dragChord.chord = chord
      this.dragChord.chordNode = reactive(new SheetNode(ENodeType.Chord))
      this.dragChord.chordNode.chord = chord.name
      this.dragChord.chordNode.style = {opacity: 0.5}
      this.dragChord.originalNode = null
        // e.preventDefault()
      this.onCursorMove(e)
    },
    onCursorMove(e) {
      if (!this.dragChord.is) return

      let [x, y] = getMouseOrTouchClient(e);
      this.$dragMark.css({
        left: x,
        top: y
      })
    },
    onCursorUp() {
      if (this.dragChord.is) {
        this.dragChord.is = false
        this.dragChord.chord = null
        this.dragChord.chordNode.style = {}
        this.dragChord.chordNode = null
      }
    },
    onChangeSheetKey(e) {
      let oldKey = this.sheetInfo.sheetKey
      let newKey = e.currentTarget.value
      if (newKey == oldKey) return;
      this.sheetInfo.sheetKey = newKey
      let confirmed = confirm("你修改了曲谱调式，是否将和弦一起转调？")
      if (!confirmed) return
      this.shiftKey(oldKey, newKey)
    },

  },
  watch: {
    "layout.toolWidthPercentage": function () {
      this.layout.toolWidthPercentage = Math.min(
        70,
        Math.max(10, this.layout.toolWidthPercentage)
      );
    },
    attachedChords: function() {
      this.sheetInfo.chords = this.attachedChords.map(chord => chord.name)
    }
  },
};

// import { getQueryVariable } from "./modules/webCommon.js"
// import { DigitalSheet } from "./modules/webSheetParser.js"
// import { ChordManager } from "./modules/webChordManager.js"
// import { drawChord, drawChordNotFound } from "./modules/webChordRender.js"
// import { WebInstrument } from "./modules/webInstrument.js"
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
// let g_UkulelePlayer = new WebInstrument("Ukulele", "Ukulele")

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
//                         func: ()=>g_Editor.removeUnderline($e)
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
</script>

<style scoped src="./common.css"></style>

<style scoped>
.title {
  overflow: hidden;
  white-space: nowrap;
  word-break: break-all;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.input {
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

.editor {
  width: 100%;
  height: 100%;
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
#sheet_block {
  box-sizing: border-box;
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
  display: flex;
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
  background: rgb(49, 100, 88);
  opacity: 0.9;
}

#editor_context {
}

#editor_context_menu {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  padding: 10px;

  width: 100%;
}

.editor_context_menu_item {
  padding: 5% calc(var(--base-font-size));
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
}
#raw_lyric_button_cancel {
  background: grey;
}
#edit_raw_lyric_button {
  background: var(--sheet-theme-color);
}

#drag_mark {
  position: fixed;
  pointer-events: none;

  padding: 5px 10px;
  border: 2px rgb(17, 83, 58) solid;
  border-radius: 5px;
  background-color: rgb(39, 124, 92);
  color: white;

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
  border-top: 40px solid black;

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

#tools_block {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 20%;
}
#layout_slider {
  display: none;
}
#chord_tool {
  position: relative;
  padding: 0 15% 0 15%;
  left: 0;
  width: 80%;
  height: 100%;
  transform: none;
  background-color: rgba(155, 117, 59, 0.87);
  overflow-y: scroll;
  z-index: 100;
}
#chord_tool::before {
  content: "";
  position: absolute;
  background: rgb(124, 74, 74);
  left: 0;
  bottom: 0;
  height: 20%;
  width: 10%;
}
#chord_tool::after {
  content: "";
  position: absolute;
  background: rgb(124, 74, 74);
  right: 0;
  bottom: 0;
  height: 20%;
  width: 10%;
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