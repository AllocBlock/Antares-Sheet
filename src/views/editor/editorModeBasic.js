import { NodeUtils, EditAction } from "@/utils/sheetEdit.js";
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
  
  let emptyNode = NodeUtils.createTextNode(" ")
  NodeUtils.insertBefore(gCurNode, emptyNode)
}

function _insertSpaceAfter(e) {
  e.preventDefault()
  if (!gCurNode) return
  
  let emptyNode = NodeUtils.createTextNode(" ")
  NodeUtils.insertAfter(gCurNode, emptyNode)
}

function _delete(e) {
  e.preventDefault()
  if (!gCurNode) return
  
  EditAction.removeSafely(gCurNode)
  gCurNode = null
}

function _recoverChordToText(e) {
  e.preventDefault()
  if (NodeUtils.isChord(gCurNode)) {
    gCurNode = EditAction.convertToText(gCurNode)
  }
}

function _insertNewLineBefore(e) {
  e.preventDefault()
  if (!gCurNode) return
  
  NodeUtils.insertBefore(gCurNode, NodeUtils.createNewLineNode())
}

function _insertNewLineAfter(e) {
  e.preventDefault()
  if (!gCurNode) return
  
  NodeUtils.insertAfter(gCurNode, NodeUtils.createNewLineNode())
}

function _addUnderline(e) {
  e.preventDefault()
  if (!gCurNode) return
  if (!NodeUtils.isChord(gCurNode)) return

  EditAction.addUnderlineForChord(gCurNode)
}

function _removeUnderline(e) {
  e.preventDefault()
  if (!gCurNode) return
  if (!NodeUtils.isChord(gCurNode)) return
  if (!NodeUtils.hasUnderlineToNextChord(gCurNode)) return

  EditAction.removeUnderlineOfChord(gCurNode)
}

function _switchChordType(e) {
  e.preventDefault()
  if (!gCurNode) return
  if (!NodeUtils.isChord(gCurNode)) return

  gThis.editSwitchChordType(gCurNode)
}

export default {
  tip: `【基础编辑模式】双击可以编辑文字/添加下划线\n右键可以打开菜单`,
  componentEvents: {
    text: {
      dblclick: (e, node) => EditAction.editTextWithNeighbor(node),
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
          EditAction.addUnderlineForChord(node);
        }
        else if (NodeUtils.hasUnderlineToNextChord(node)){
          EditAction.removeUnderlineOfChord(node);
        }
      },
      contextmenu: (e, node) => gThis.openContext(e, node),
      mouseenter: _cbMouseEnter,
      mouseleave: _cbMouseLeave
    },
    mark: {
      dblclick: (e, node) => {
        EditAction.editContent(node);
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

    // 按下tab键快速在前方添加空格，+Shift则在后方
    gHookIds.push(HotKey.addListener("Tab", false, false, false, _hotkeySwitcher(_insertSpaceBefore)))
    gHookIds.push(HotKey.addListener("Tab", false, true, false, _hotkeySwitcher(_insertSpaceAfter)))

    // 按下delete/R键快速删除
    gHookIds.push(HotKey.addListener("Delete", false, false, false, _hotkeySwitcher(_delete)))
    gHookIds.push(HotKey.addListener("r", false, false, false, _hotkeySwitcher(_delete)))

    // 按下enter键快速在后方添加换行，同时按下shift则在前方添加
    gHookIds.push(HotKey.addListener("Enter", false, false, false, _hotkeySwitcher(_insertNewLineBefore)))
    gHookIds.push(HotKey.addListener("Enter", false, true, false, _hotkeySwitcher(_insertNewLineAfter)))

    // 按下U键快速添加下划线，J删除下划线
    gHookIds.push(HotKey.addListener("u", false, false, false, _hotkeySwitcher(_addUnderline)))
    gHookIds.push(HotKey.addListener("j", false, false, false, _hotkeySwitcher(_removeUnderline)))

    // 按下Z键快速切换和弦类型
    gHookIds.push(HotKey.addListener("z", false, false, false, _hotkeySwitcher(_switchChordType)))
  },
  release: function() {
    for (let id of gHookIds) {
      HotKey.removeListener(id)
    }
  }
}