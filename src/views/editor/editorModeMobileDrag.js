import { NodeUtils, EditAction } from "@/utils/sheetEdit.js";
import ChordManager from "@/utils/chordManager.js";
import { getCursorClientPos, getInnerSize } from "@/utils/common.js";
import { setPos } from "@/utils/common.js";
import { ENodeType } from "@/utils/sheetNode.js";

let gThis = null

let gIsDragging = false
let gToRemoveNode = null
let gToInsertChordNode = null
const gPointDistance = 80 // px

const gTargetElementNameSet = ['text', 'chord', 'chord-pure']
function _getCursorOverElement(x, y) {
  let e = document.elementFromPoint(x, y);
  if (!e || e === document) return null
  while(e && e.tagName && e !== document) {
    if (gTargetElementNameSet.includes(e.tagName.toLowerCase()))
      return e

    e = e.parentNode
  }
  return null
}

function _onTouchMove(e) {
  if (!gIsDragging) return

  let [x, y] = getCursorClientPos(e);
  let markElement = gThis.$refs.dragMark
  let size = getInnerSize(markElement)
  let pointerX = x - size.w * 0.5
  let pointerY = y - size.h - gPointDistance
  setPos(gThis.$refs.dragMark, pointerX, pointerY)

  // 获取标记下方的节点
  let pointerOverElement = _getCursorOverElement(x, y - gPointDistance)
  if (pointerOverElement) {
    pointerOverElement.dispatchEvent(new Event('custom-cursor-over'))
  }
  else
    _setToRemoveNode(null)
}

function _onTouchEnd(e) {
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
      NodeUtils.replace(gToRemoveNode, gToInsertChordNode)
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
    EditAction.unhighlightNode(gToRemoveNode)
  if (node)
    EditAction.highlightNode(node)
  gToRemoveNode = node
}

export default {
  tip: `【拖拽和弦模式】双击可以编辑文字/添加下划线\n按住Ctrl可以复制和弦\n按住Shift可以移动和弦\n拖入保存的文件可以直接加载`,
  componentEvents: {
    text: {
      click: (e, node) => {
      },
      dblclick: (e, node) => {
        EditAction.editContent(node);
      },
      contextmenu: (e, node) => {
        gThis.openContext(e, node)
      },
      customCursorOver: (e, node) => {
        _setToRemoveNode(node)
      }
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
      customCursorOver: (e, node) => {
        _setToRemoveNode(node)
      }
    },
    mark: {
      click: (e, node) => {
      },
      dblclick: (e, node) => {
        EditAction.editContent(node);
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
      gToInsertChordNode = NodeUtils.createChordNode('', chord.name)
      gToRemoveNode = null
      _onTouchMove(e)
      
      gThis.dragChord.isDragging = true
      gThis.dragChord.text = chord ? chord.name : '错误'

      e.preventDefault()
    }
  },
  init: function(instance) {
    gThis = instance
    document.addEventListener("touchmove", _onTouchMove);
    document.addEventListener("touchend", _onTouchEnd);
  },
  release: function() {
    document.removeEventListener("touchmove", _onTouchMove);
    document.removeEventListener("touchend", _onTouchEnd);
  }
}