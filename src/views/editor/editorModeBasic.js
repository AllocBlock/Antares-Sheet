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

function _hotkeySwitcher(func) {
  return (e) => {
    if (!gCurNode) return
    if (gThis.muteEditorModeHotkey) return
    func(e)
  }
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

function _recoverChordToText(e) {
  e.preventDefault()
  if (Editor.isChord(gCurNode)) {
    gCurNode = EditorAction.convertToText(gCurNode)
  }
}

function _insertNewLineBefore(e) {
  e.preventDefault()
  if (!gCurNode) return
  
  Editor.insertBefore(gCurNode, Editor.createNewLineNode())
}

function _insertNewLineAfter(e) {
  e.preventDefault()
  if (!gCurNode) return
  
  Editor.insertAfter(gCurNode, Editor.createNewLineNode())
}

function _addUnderline(e) {
  e.preventDefault()
  if (!gCurNode) return
  if (!Editor.isChord(gCurNode)) return

  EditorAction.addUnderlineForChord(gCurNode)
}

function _removeUnderline(e) {
  e.preventDefault()
  if (!gCurNode) return
  if (!Editor.isChord(gCurNode)) return
  if (!Editor.hasUnderlineToNextChord(gCurNode)) return

  EditorAction.removeUnderlineOfChord(gCurNode)
}

export default {
  tip: `【基础编辑模式】双击可以编辑文字/添加下划线\n右键可以打开菜单`,
  componentEvents: {
    text: {
      dblclick: (e, node) => EditorAction.editTextWithNeighbor(node),
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
    gHookIds.push(HotKey.addListener("`", false, false, false, _hotkeySwitcher(_recoverChordToText)))

    // 按下tab键快速在前方添加空格
    gHookIds.push(HotKey.addListener("Tab", false, false, false, _hotkeySwitcher(_insertSpaceBefore)))

    // 按下space键快速在后方添加空格
    gHookIds.push(HotKey.addListener(" ", false, false, false, _hotkeySwitcher(_insertSpaceAfter)))

    // 按下delete/r键快速删除
    gHookIds.push(HotKey.addListener("Delete", false, false, false, _hotkeySwitcher(_delete)))
    gHookIds.push(HotKey.addListener("r", false, false, false, _hotkeySwitcher(_delete)))

    // 按下enter键快速在后方添加换行，同时按下shift则在前方添加
    gHookIds.push(HotKey.addListener("Enter", false, false, false, _hotkeySwitcher(_insertNewLineBefore)))
    gHookIds.push(HotKey.addListener("Enter", false, true, false, _hotkeySwitcher(_insertNewLineAfter)))

    // 按下w键快速添加下划线，s删除下划线
    gHookIds.push(HotKey.addListener("w", false, false, false, _hotkeySwitcher(_addUnderline)))
    gHookIds.push(HotKey.addListener("s", false, false, false, _hotkeySwitcher(_removeUnderline)))
  },
  release: function() {
    for (let id of gHookIds) {
      HotKey.removeListener(id)
    }
  }
}