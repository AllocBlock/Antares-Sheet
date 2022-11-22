import { NodeUtils, EditAction } from "./editor.js";
import HotKey from "@/utils/hotKey.js";
import ChordManager from "@/utils/chordManager.js";

let gThis = null
let gCurNode = null // 目前的编辑目标节点
let gHookIds = []

function _setCurNode(node) {
  gCurNode = node
}

export default {
  tip: `【和弦级数模式】\n鼠标移动到文字上，按下1-7键修改和弦\n重复按同一个键可切换大小调\n按下~键可移除和弦\ntab键可在前方快速添加一个空格\nshift+tab在后方添加空格`,
  componentEvents: {
    text: {
      mouseenter: (e, node) => {
        _setCurNode(node)
      },
      mouseleave: (e, node) => {
        if (gCurNode == node)
          _setCurNode(null)
      }
    },
    chord: {
      contextmenu: (e, node) => gThis.openContext(e, node),
      mouseenter: (e, node) => {
        _setCurNode(node)
      },
      mouseleave: (e, node) => {
        if (gCurNode == node)
          _setCurNode(null)
      }
    },
  },
  documentEvents: {
  },
  init: function(instance) {
    gThis = instance
    const progressionList = [
      [0, true], // distance to tonic, is major
      [2, false],
      [4, false],
      [5, true],
      [7, true],
      [9, false],
      [11, false],
    ]

    // 按下1-7应用对应级数的和弦
    progressionList.forEach(function([shift, isMajor], i) {
      const keyName = (i + 1).toString()
      gHookIds.push(HotKey.addListener(keyName, false, false, false, (e, [shift, isMajor]) => {
        if (!gCurNode) return
        let chordName = ChordManager.shiftKey(gThis.sheetInfo.sheetKey, shift)
        if (NodeUtils.isChord(gCurNode)) {
          if (ChordManager.getDistance(gCurNode.chord, chordName) == 0) { // 同级的和弦，再次按下则切换大小和弦
            let isCurMajor = ChordManager.isMajor(gCurNode.chord)
            isMajor = !isCurMajor
          }
        }

        if (!isMajor) chordName += "m"
        gCurNode = EditAction.convertToChord(gCurNode, chordName)
      }, [shift, isMajor]))
    })
  },
  release: function() {
    for (let id of gHookIds) {
      HotKey.removeListener(id)
    }
  }
}