import { Editor, EditorAction } from "./editor.js";
import HotKey from "@/utils/hotKey.js";
import ChordManager from "@/utils/chordManager.js";
import { getMouseOrTouchClient } from "@/utils/common.js";
import { setPos } from "@/utils/common.js";
import { ENodeType } from "@/utils/sheetNode.js";

let gThis = null

let gIsDragging = false
let gToRemoveNode = null
let gToInsertChordNode = null

function _onCursorMove(e) {
  if (!gIsDragging) return

  let [x, y] = getMouseOrTouchClient(e);
  setPos(gThis.$refs.dragMark, x, y)
}

function _onCursorUp(e) {
  if (gIsDragging) {
    if (gToRemoveNode) {
      if (gToRemoveNode.type == ENodeType.ChordPure) { // 纯和弦，则也插入纯和弦
        gToInsertChordNode.type = gToRemoveNode.type
        gToInsertChordNode.content = ''
      } else { // 否则插入普通和弦，并标记该文本
        gToInsertChordNode.type = ENodeType.Chord
        gToInsertChordNode.content = gToRemoveNode.content
      }
      // TODO: 检查是否能够替换，有没有不能直接替换的情况？
      Editor.replace(gToRemoveNode, gToInsertChordNode)
    }
    gIsDragging = false
    gToInsertChordNode = null
    gToRemoveNode = null

    gThis.dragChord.isDragging = false
  }
}

function _setToRemoveNode(node) {
  if (node == gToInsertChordNode) return

  if (gToRemoveNode)
    EditorAction.unhighlightNode(gToRemoveNode)
  EditorAction.highlightNode(node)
  gToRemoveNode = node
}

export default {
  tip: `【拖拽和弦模式】双击可以编辑文字/添加下划线\n按住Ctrl可以复制和弦\n按住Shift可以移动和弦\n拖入保存的文件可以直接加载`,
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
        if (node == gToRemoveNode) {
          EditorAction.unhighlightNode(gToRemoveNode)
          gToRemoveNode = null
        }
      }
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
        if (node == gToRemoveNode) {
          EditorAction.unhighlightNode(gToRemoveNode)
          gToRemoveNode = null
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
      gIsDragging = true
      gToInsertChordNode = Editor.createChordNode('', chord.name)
      gToRemoveNode = null
        // e.preventDefault()
      _onCursorMove(e)
      
      gThis.dragChord.isDragging = true
      gThis.dragChord.text = chord ? chord.name : '错误'
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