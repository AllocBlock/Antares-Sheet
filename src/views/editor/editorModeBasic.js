import { Editor, EditorAction } from "./editor.js";
import HotKey from "@/utils/hotKey.js";
import ChordManager from "@/utils/chordManager.js";

let gThis = null
let gCurNode = null
let gHookIds = []

function _cbMouseEnter(e, node) {
  gCurNode = node
}

function _cbMouseLeave(e, node) {
  if (gCurNode == node)
    gCurNode = node
}

function _insertSpaceBefore(e) {
  e.preventDefault()
  if (!gCurNode) return
  
  let emptyNode = Editor.createTextNode(" ")
  Editor.insertBefore(gCurNode, emptyNode)
}

function _insertSpaceAfter(e) {
  e.preventDefault()
  if (!gCurNode) return
  
  let emptyNode = Editor.createTextNode(" ")
  Editor.insertAfter(gCurNode, emptyNode)
}

function _delete(e) {
  e.preventDefault()
  if (!gCurNode) return
  
  EditorAction.remove(gCurNode)
  gCurNode = null
}

export default {
  tip: `【基础编辑模式】双击可以编辑文字/添加下划线\n右键可以打开菜单`,
  componentEvents: {
    text: {
      dblclick: (e, node) => EditorAction.editContent(node),
      contextmenu: (e, node) => gThis.openContext(e, node),
      mouseenter: _cbMouseEnter,
      mouseleave: _cbMouseLeave
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
      mouseenter: _cbMouseEnter,
      mouseleave: _cbMouseLeave
    },
    mark: {
      dblclick: (e, node) => {
        EditorAction.editContent(node);
      },
      contextmenu: (e, node) => gThis.openContext(e, node),
      mouseenter: _cbMouseEnter,
      mouseleave: _cbMouseLeave
    },
    newline: {
      contextmenu: (e, node) => gThis.openContext(e, node),
      mouseenter: _cbMouseEnter,
      mouseleave: _cbMouseLeave
    },
  },
  documentEvents: {
  },
  toolChordEvents: {},
  init: function(instance) {
    gThis = instance
    
    // 按下~移除和弦
    gHookIds.push(HotKey.addListener("`", false, false, false, (e) => {
      if (!gCurNode) return

      if (Editor.isChord(gCurNode)) {
        gCurNode = EditorAction.convertToText(gCurNode)
      }
    }))

    // 按下tab键快速在前方添加文本节点，而后可以快速添加和弦
    gHookIds.push(HotKey.addListener("Tab", false, false, false, _insertSpaceBefore))

    // 按下space键快速在后方添加
    gHookIds.push(HotKey.addListener(" ", false, false, false, _insertSpaceAfter))

    // 按下delete/r键快速删除
    gHookIds.push(HotKey.addListener("Delete", false, false, false, _delete))
    gHookIds.push(HotKey.addListener("r", false, false, false, _delete))
  },
  release: function() {
    for (let id of gHookIds) {
      HotKey.removeListener(id)
    }
  }
}