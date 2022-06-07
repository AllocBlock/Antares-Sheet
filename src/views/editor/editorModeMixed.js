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

let gCurNode = null

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

  gCurNode = node
}

function _setCurNode(node) {
  gCurNode = node
}

export default {
  tip: `【组合编辑模式】详细操作见其他模式的介绍`,
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
        if (gIsDragging) _setToRemoveNode(node)
        _setCurNode(node)
      },
      mouseleave: (e, node) => {
        // TIPS: 如果启用，则移出元素后就不会替换该元素了，这样的交互体验不佳
        if (node == gToRemoveNode) {
          EditorAction.unhighlightNode(gToRemoveNode)
          gToRemoveNode = null
        }

        if (gCurNode == node)
          _setCurNode(null)
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
        if (gIsDragging) _setToRemoveNode(node)
        _setCurNode(node)
      },
      mouseleave: (e, node) => {
        if (node == gToRemoveNode) {
          EditorAction.unhighlightNode(gToRemoveNode)
          gToRemoveNode = null
        }

        if (gCurNode == node)
          _setCurNode(null)
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
      HotKey.addListener(keyName, false, false, false, (e, [shift, isMajor]) => {
        if (!gCurNode) return
        let chordName = ChordManager.shiftKey(gThis.sheetInfo.sheetKey, shift)
        if (Editor.isChord(gCurNode)) {
          if (ChordManager.getDistance(gCurNode.chord, chordName) == 0) { // 同级的和弦，再次按下则切换大小和弦
            let isCurMajor = ChordManager.isMajor(gCurNode.chord)
            isMajor = !isCurMajor
          }
        }

        if (!isMajor) chordName += "m"
        gCurNode = EditorAction.convertToChord(gCurNode, chordName)
      }, [shift, isMajor])
    })

    // 按下~移除和弦
    HotKey.addListener("`", false, false, false, (e) => {
      if (!gCurNode) return

      if (Editor.isChord(gCurNode)) {
        gCurNode = EditorAction.convertToText(gCurNode)
      }
    })

    // 按下tab快速在前方添加文本节点，而后可以快速添加和弦
    HotKey.addListener("Tab", false, false, false, (e) => {
      e.preventDefault()
      if (!gCurNode) return
      
      let emptyNode = Editor.createTextNode(" ")
      Editor.insertBefore(gCurNode, emptyNode)
      gCurNode = emptyNode
    })

    // 按下shift+tab快速在后方添加
    HotKey.addListener("Tab", false, true, false, (e) => {
      e.preventDefault()
      if (!gCurNode) return
      
      let emptyNode = Editor.createTextNode(" ")
      Editor.insertAfter(gCurNode, emptyNode)
      gCurNode = emptyNode
    })
  },
  release: function() {
    document.removeEventListener("mousemove", _onCursorMove);
    document.removeEventListener("mouseup", _onCursorUp);
  }
}