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

  gThis.editor.addUnderlineForChord(gCurNode)
}

function _removeUnderline(e) {
  e.preventDefault()
  if (!gCurNode) return
  if (!NodeUtils.isChord(gCurNode)) return
  if (!NodeUtils.hasUnderlineToNextChord(gCurNode)) return

  gThis.editor.removeUnderlineOnChord(gCurNode)
}

function _switchChordType(e) {
  e.preventDefault()
  if (!gCurNode) return
  if (!NodeUtils.isChord(gCurNode)) return

  gThis.editSwitchChordType(gCurNode)
}

export default {
  tip: `【基础编辑】\n右键可以打开菜单来添加/修改内容\n双击可以编辑文字/添加下划线\nTab/Shift+Tab键可在前方/后方添加空格\n按下~键可移除和弦`,
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
          gThis.editor.addUnderlineForChord(node);
        }
        else if (NodeUtils.hasUnderlineToNextChord(node)){
          gThis.editor.removeUnderlineOnChord(node);
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
    gHookIds.push(HotKey.addListener("Backquote", _hotkeySwitcher(_recoverChordToText)))

    // 按下tab键快速在前方添加空格，+Shift则在后方
    gHookIds.push(HotKey.addListener("Tab", _hotkeySwitcher(_insertSpaceBefore), null, false, null))
    gHookIds.push(HotKey.addListener("Tab", _hotkeySwitcher(_insertSpaceAfter), null, true, null))

    // 按下delete/R键快速删除
    gHookIds.push(HotKey.addListener("Delete", _hotkeySwitcher(_delete)))
    gHookIds.push(HotKey.addListener("KeyR", _hotkeySwitcher(_delete)))

    // 按下enter键快速在后方添加换行，同时按下shift则在前方添加
    gHookIds.push(HotKey.addListener("Enter", _hotkeySwitcher(_insertNewLineBefore), null, false, null))
    gHookIds.push(HotKey.addListener("Enter", _hotkeySwitcher(_insertNewLineAfter), null, true, null))

    // 按下U键快速添加下划线，J删除下划线
    gHookIds.push(HotKey.addListener("KeyU", _hotkeySwitcher(_addUnderline)))
    gHookIds.push(HotKey.addListener("KeyJ", _hotkeySwitcher(_removeUnderline)))

    // 按下Z键快速切换和弦类型
    gHookIds.push(HotKey.addListener("KeyZ", _hotkeySwitcher(_switchChordType)))

    // Ctrl+Z 撤销， Ctrl+Y 重做
    gHookIds.push(HotKey.addListener("KeyZ", function (){
      if (gThis.editor.canUndo()) {
        gThis.editor.undo()
      }
    }, true))
    gHookIds.push(HotKey.addListener("KeyY", function (){
      if (gThis.editor.canRedo()) {
        gThis.editor.redo()
      }
    }, true))
  },
  release: function() {
    for (let id of gHookIds) {
      HotKey.removeListener(id)
    }
  }
}