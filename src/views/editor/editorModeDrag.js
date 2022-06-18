import { Editor, EditorAction } from "./editor.js";
import HotKey from "@/utils/hotKey.js";
import ChordManager from "@/utils/chordManager.js";
import { getCursorClientPos } from "@/utils/common.js";
import { setPos } from "@/utils/common.js";
import { ENodeType } from "@/utils/sheetNode.js";

let gThis = null

let gDragChord = {
  is: false,
  chordName: null,
  toUpdateNode: null,
  toInsertNode: null,
  clear() {
    this.is = false
    this.chordName = null
    this.toUpdateNode = null
    this.toInsertNode = null
  }
}

let gShiftChord = {
  is: false,
  chordName: null,
  startPos: [0, 0],
  curNode: null,
  centralRange: 50, // px
  curShiftDirection: 1,
  clear() {
    this.is = false
    this.chordName = null,
    this.startPos = [0, 0]
    this.curNode = null
    this.centralRange = 50
    this.curShiftDirection = 1
  }
}

let gUI = {
  showDragMark(chordName) {
    gThis.dragChord.isDragging = true
    gThis.dragChord.text = chordName ?? '错误'
  },
  hideDragMark() {
    gThis.dragChord.isDragging = false
  }
}

const gSpecialNode = [ENodeType.Chord, ENodeType.ChordPure, ENodeType.Mark, ENodeType.NewLine, ENodeType.Text]
function _doesPreferPureChord() {
  if (!gDragChord.toUpdateNode) return false;
  else if (gDragChord.toUpdateNode.type == ENodeType.ChordPure) return true; // 纯和弦，则也插入纯和弦
  else {
    // 同一行内，如果有ChordPure则插入纯和弦
    // 否则，如果有非空的Text和Chord节点则插入普通和弦
    let lineStartNode = Editor.findPrev(gDragChord.toUpdateNode, (n) => n.type == ENodeType.NewLine || Editor.isFirstNode(n))
    let lineEndNode = Editor.findNext(gDragChord.toUpdateNode, (n) => n.type == ENodeType.NewLine || Editor.isLastNode(n))
    
    let hasChordPure = false;
    let hasTextOrChord = false; // TODO：怎么考虑？
    Editor.findNext(lineStartNode, (n) => {
      console.log(lineStartNode, lineEndNode, n)
      if (n == lineEndNode) return true;
      if (n.type == ENodeType.ChordPure) hasChordPure = true;
      else if ((n.type == ENodeType.Chord) ||
      (n.type == ENodeType.Text && !Editor.isPlaceholder(n.content))) hasTextOrChord = true;
      return false;
    })

    if (hasChordPure) return true;
  }
  return false;
}

function _onCursorMove(e) {
  let [x, y] = getCursorClientPos(e);

  if (gDragChord.is) { // 普通拖放和弦模式
    setPos(gThis.$refs.dragMark, x, y)
  } else if (gShiftChord.is) { // 偏移和弦模式
    let NewPos = Math.abs(x - gShiftChord.startPos[0]) < gShiftChord.centralRange ? 1 : (x > gShiftChord.startPos[0] ? 2 : 0)
    if (NewPos == gShiftChord.curShiftDirection) return;
    console.log("shift by: ", NewPos - gShiftChord.curShiftDirection)
    _shiftChord(NewPos - gShiftChord.curShiftDirection)
    gShiftChord.curShiftDirection = NewPos
  }
}

function _onCursorUp(e) {
  if (gDragChord.is) {
    if (gDragChord.toUpdateNode) {
      if (_doesPreferPureChord()) {
        gDragChord.toInsertNode.type = ENodeType.ChordPure
        gDragChord.toInsertNode.content = ''
      } else { // 否则插入普通和弦，并标记该文本
        gDragChord.toInsertNode.type = ENodeType.Chord
        gDragChord.toInsertNode.content = gDragChord.toUpdateNode.content
      }
      // TODO: 检查是否能够替换，有没有不能直接替换的情况？
      Editor.replace(gDragChord.toUpdateNode, gDragChord.toInsertNode)
    }
    gDragChord.clear()
    gUI.hideDragMark()
  } else if (gShiftChord.is) {
    gShiftChord.clear()
  }
}

function _setToRemoveNode(node) {
  if (node == gDragChord.toInsertNode) return

  if (!gShiftChord.is) {
    if (gDragChord.toUpdateNode)
      EditorAction.unhighlightNode(gDragChord.toUpdateNode)
    EditorAction.highlightNode(node)
    gDragChord.toUpdateNode = node
  }
}

function _startDragChord(e, chordName) {
  gDragChord.is = true
  gDragChord.chordName = chordName
  gDragChord.toInsertNode = Editor.createChordNode('', chordName)
  gDragChord.toUpdateNode = null
  _onCursorMove(e)
  gUI.showDragMark(chordName)
}

function _startShiftChord(e, chordName, centerNode) {
  gShiftChord.is = e.altKey ? true : false
  if (gShiftChord.is) {
    gShiftChord.startPos = getCursorClientPos(e);
    gShiftChord.chordName = chordName
    gShiftChord.curNode = gShiftChord.centerNode = centerNode
    _onCursorMove(e)
  }
}

function _shiftChordByStep(toLeft = true) {
  // TODO: 这会破坏下划线，如何保留？
  let isPlaceholder = Editor.isPlaceholder(gShiftChord.curNode.content)
  let oldNode = gShiftChord.curNode

  if (isPlaceholder) { // 占位和弦，则把和弦移动到前一个文本上
    let nearbyNode = toLeft ? Editor.prevSibling(gShiftChord.curNode) : Editor.nextSibling(gShiftChord.curNode)
    if (nearbyNode.type != ENodeType.Text) return null // TODO: 如果是和弦怎么处理？

    gShiftChord.curNode = EditorAction.convertToChord(nearbyNode, gShiftChord.chordName)
  } else { // 否则在前方插入一个和弦
    gShiftChord.curNode = Editor.createChordNode("_", gShiftChord.chordName)
    if (toLeft) Editor.insertBefore(oldNode, gShiftChord.curNode);
    else Editor.insertAfter(oldNode, gShiftChord.curNode);
  }
  EditorAction.convertToText(oldNode, isPlaceholder)
}

function _shiftChord(offset) {
  if (offset > 0) {
    while(offset--) {
      _shiftChordByStep(false)
    }
  } else {
    while(offset++) {
      _shiftChordByStep(true)
    }
  }
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
        if (gDragChord.is) {
          _setToRemoveNode(node)
        }
      },
      mouseleave: (e, node) => {
        if (gDragChord.is && node == gDragChord.toUpdateNode) {
          EditorAction.unhighlightNode(gDragChord.toUpdateNode)
          gDragChord.toUpdateNode = null
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
        if (gDragChord.is) {
          _setToRemoveNode(node)
        }
      },
      mouseleave: (e, node) => {
        if (gDragChord.is && node == gDragChord.toUpdateNode) {
          EditorAction.unhighlightNode(gDragChord.toUpdateNode)
          gDragChord.toUpdateNode = null
        }
      },
      mousedown: (e, node) => {
        console.log("mousedown ", node.chord)
        if (gDragChord.is || gShiftChord.is) return;

        if (e.shiftKey) {
          console.log("shift ", node.chord)
          _startDragChord(e, node.chord)
          EditorAction.convertToText(node, false)
        } else if (e.ctrlKey){
          console.log("ctrl ", node.chord)
          _startDragChord(e, node.chord)
        } else if (e.altKey && node.type == ENodeType.Chord){
          console.log("alt ", node.chord)
          _startShiftChord(e, node.chord, node)
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