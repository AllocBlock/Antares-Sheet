import { Editor, EditorAction } from "./editor.js";
import HotKey from "@/utils/hotKey.js";
import ChordManager from "@/utils/chordManager.js";
import { getCursorClientPos } from "@/utils/common.js";
import { setPos } from "@/utils/common.js";
import { ENodeType } from "@/utils/sheetNode.js";

let gThis = null

let gIsDragging = false
let gDraggingChord = null
let gToUpdateNode = null
let gToInsertChordNode = null

let gIsShiftDrag = false
let gShiftCenterNode = null
let gShiftStartPos = [0, 0] // [x, y]
const gShiftCentralRange = 50 // px
let gShiftCurPos = 1 // 0: left, 1: center, 2: right
let gShiftCurNode = null

const gSpecialNode = [ENodeType.Chord, ENodeType.ChordPure, ENodeType.Mark, ENodeType.NewLine]
function _doesPreferPureChord() {
  if (!gToUpdateNode) return false;
  else if (gToUpdateNode.type == ENodeType.ChordPure) return true; // 纯和弦，则也插入纯和弦
  else {
    // 前后相邻的特殊元素不包含普通和弦
    let prevType = null, nextType = null
    Editor.findPrev(gToUpdateNode, (n) => {
      if (gSpecialNode.includes(n.type)) {
        prevType = n.type
        return true
      }
      return false
    })
    Editor.findNext(gToUpdateNode, (n) => {
      if (gSpecialNode.includes(n.type)) {
        nextType = n.type
        return true
      }
      return false
    })

    if (prevType != ENodeType.Chord && nextType != ENodeType.Chord) {
      return true
    }
  }
  return false;
}

function _onCursorMove(e) {
  if (!gIsDragging) return

  let [x, y] = getCursorClientPos(e);
  if (!gIsShiftDrag) { // 普通拖放和弦模式
    setPos(gThis.$refs.dragMark, x, y)
  } else { // 偏移和弦模式
    let NewPos = Math.abs(x - gShiftStartPos[0]) < gShiftCentralRange ? 1 : (x > gShiftStartPos[0] ? 2 : 0)
    if (NewPos == gShiftCurPos) return;

    console.log("shift: ", NewPos)

    // TODO: 这会破坏下划线，如何保留？
    if (gShiftCurNode) {
      if (gShiftCurNode == gShiftCenterNode) {
        gShiftCenterNode = EditorAction.convertToText(gShiftCurNode, false)[0];
      } else {
        EditorAction.convertToText(gShiftCurNode, true);
      }
    }
    gShiftCurPos = NewPos
    if (NewPos == 1) {
      gShiftCenterNode = EditorAction.convertToChord(gShiftCenterNode, gDraggingChord)
      gShiftCurNode = gShiftCenterNode
    } else {
      gShiftCurNode = Editor.createChordNode("_", gDraggingChord)
      if (NewPos == 0) Editor.insertBefore(gShiftCenterNode, gShiftCurNode);
      else Editor.insertAfter(gShiftCenterNode, gShiftCurNode);
    }
  }
}

function _onCursorUp(e) {
  if (gIsDragging) {
    if (!gIsShiftDrag && gToUpdateNode) {
      if (_doesPreferPureChord()) {
        gToInsertChordNode.type = ENodeType.ChordPure
        gToInsertChordNode.content = ''
      } else { // 否则插入普通和弦，并标记该文本
        gToInsertChordNode.type = ENodeType.Chord
        gToInsertChordNode.content = gToUpdateNode.content
      }
      // TODO: 检查是否能够替换，有没有不能直接替换的情况？
      Editor.replace(gToUpdateNode, gToInsertChordNode)
    }
    gIsDragging = false
    gToInsertChordNode = null
    gToUpdateNode = null
    gIsShiftDrag = false
    gShiftCurNode = null

    gThis.dragChord.isDragging = false
  }
}

function _setToRemoveNode(node) {
  if (node == gToInsertChordNode) return

  if (!gIsShiftDrag) {
    if (gToUpdateNode)
      EditorAction.unhighlightNode(gToUpdateNode)
    EditorAction.highlightNode(node)
    gToUpdateNode = node
  }
}

// TODO: 在这里区分不同的方式
function _startDragChord(e, chordName, node = null) {
  gIsDragging = true
  gDraggingChord = chordName
  gToInsertChordNode = Editor.createChordNode('', chordName)
  gToUpdateNode = null
  gIsShiftDrag = e.altKey ? true : false
  console.log("alt start pos: ", e)
  if (gIsShiftDrag) {
    gShiftStartPos = getCursorClientPos(e);
    gShiftCenterNode = node
    gShiftCurNode = gShiftCenterNode
    console.log("alt start pos: ", gShiftStartPos)
  }
  _onCursorMove(e)
  
  gThis.dragChord.isDragging = true
  gThis.dragChord.text = chordName ?? '错误'
}

export default {
  tip: `【拖拽和弦模式】双击可以编辑文字/添加下划线\n按住Ctrl可以复制和弦\n按住Shift可以移动和弦\n按住Alt拖拽可微调偏移和弦\n拖入保存的文件可以直接加载`,
  componentEvents: {
    text: {
      click: (e, node) => {
        console.log("text", node);
      },
      dblclick: (e, node) => {
        EditorAction.editContent(node);
      },
      contextmenu: (e, node) => {
        if (gOpenContextFunc)
          gOpenContextFunc(e, node)
      },
      mouseenter: (e, node) => {
        if (!gIsDragging) return
        _setToRemoveNode(node)
      },
      mouseleave: (e, node) => {
        if (node == gToUpdateNode) {
          EditorAction.unhighlightNode(gToUpdateNode)
          gToUpdateNode = null
        }
      },
    },
    chord: {
      click: (e, node) => {
        gThis.playChord(ChordManager.getChord(node.chord));
      },
      dblclick: (e, node) => {
        if (!e.shiftKey) {
          EditorAction.addUnderlineForChord(node);
        }
        else if (Editor.hasUnderlineToNextChord(node)){
          EditorAction.removeUnderlineOfChord(node);
        }
      },
      contextmenu: (e, node) => gThis.openContext(e, node),
      mouseenter: (e, node) => {
        if (!gIsDragging) return
        _setToRemoveNode(node)
      },
      mouseleave: (e, node) => {
        if (node == gToUpdateNode) {
          EditorAction.unhighlightNode(gToUpdateNode)
          gToUpdateNode = null
        }
      },
      mousedown: (e, node) => {
        console.log("mousedown ", node.chord)
        if (gIsDragging) return;
        if (e.shiftKey) {
          console.log("shift ", node.chord)
          _startDragChord(e, node.chord)
          EditorAction.convertToText(node, false)
        } else if (e.ctrlKey){
          console.log("ctrl ", node.chord)
          _startDragChord(e, node.chord)
        } else if (e.altKey){
          console.log("alt ", node.chord)
          _startDragChord(e, node.chord, node)
        }
      }
    },
    mark: {
      click: (e, node) => {
        console.log("mark", node);
      },
      dblclick: (e, node) => {
        EditorAction.editContent(node);
      },
      contextmenu: (e, node) => gThis.openContext(e, node),
    },
    newline: {
      contextmenu: (e, node) => gThis.openContext(e, node),
    },
  },
  documentEvents: {
  },
  toolChordEvents: {
    dragStart: (e, chord) => {
      if (chord && chord.name)
        _startDragChord(e, chord.name)
      // e.preventDefault()
    }
  },
  init: function(instance) {
    gThis = instance
    document.addEventListener("mousemove", _onCursorMove);
    document.addEventListener("mouseup", _onCursorUp);
  },
  release: function() {
    document.removeEventListener("mousemove", _onCursorMove);
    document.removeEventListener("mouseup", _onCursorUp);
  }
}