import { NodeUtils, EditAction } from "@/utils/sheetEdit.js";
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
  lastPosX: 0,
  curNode: null,
  shiftThreshold: 50, // px
  curShiftDistance: 0,

  setCurShiftNode(n) {
    if (this.curNode)
      EditAction.unhighlightNode(this.curNode)
  
    if (n)
      EditAction.highlightNode(n)
  
      this.curNode = n;
  },
  clear() {
    this.is = false
    this.chordName = null,
    this.lastPosX = 0
    this.shiftThreshold = 50
    this.curShiftDistance = 0
    this.setCurShiftNode(null)
  }
}

let gUI = {
  showDragMark(chordName) {
    gThis.dragChord.isDragging = true
    gThis.dragChord.text = chordName ?? '错误'
  },
  hideDragMark() {
    gThis.dragChord.isDragging = false
  },
  willUpdateNextFrame: false,
  willUpdatePos: {
    left: 0,
    top: 0
  },
  setDragMarkPosNextFrame(left, top) {
    this.willUpdatePos = { left, top }
    if (!this.willUpdateNextFrame) {
      this.willUpdateNextFrame = true
      window.requestAnimationFrame(() => {
        setPos(gThis.$refs.dragMark, this.willUpdatePos.left, this.willUpdatePos.top) // 触发时是最新数据
        this.willUpdateNextFrame = false
      })
    }
  }
}

function _doesPreferPureChord() {
  if (!gDragChord.toUpdateNode) return false;
  else if (gDragChord.toUpdateNode.type == ENodeType.ChordPure) return true; // 纯和弦，则也插入纯和弦
  else {
    // 同一行内，如果有ChordPure则插入纯和弦
    // 否则，如果有非空的Text和Chord节点则插入普通和弦
    let lineStartNode = NodeUtils.findPrev(gDragChord.toUpdateNode, (n) => n.type == ENodeType.NewLine || NodeUtils.isFirstNode(n))
    let lineEndNode = NodeUtils.findNext(gDragChord.toUpdateNode, (n) => n.type == ENodeType.NewLine || NodeUtils.isLastNode(n))
    
    let hasChordPure = false;
    let hasTextOrChord = false; // TODO：怎么考虑？
    NodeUtils.findNext(lineStartNode, (n) => {
      if (n == lineEndNode) return true;
      if (n.type == ENodeType.ChordPure) hasChordPure = true;
      else if ((n.type == ENodeType.Chord) ||
      (n.type == ENodeType.Text && !NodeUtils.isPlaceholder(n.content))) hasTextOrChord = true;
      return false;
    })

    if (hasChordPure) return true;
  }
  return false;
}

function _onCursorMove(e) {
  let [x, y] = getCursorClientPos(e);

  if (gDragChord.is) { // 普通拖放和弦模式
    gUI.setDragMarkPosNextFrame(x, y)
  } else if (gShiftChord.is) { // 偏移和弦模式
    let dx = x - gShiftChord.lastPosX
    gShiftChord.lastPosX = x

    if (dx * gShiftChord.curShiftDistance >= 0) {
      gShiftChord.curShiftDistance += dx

      let offset = Math.trunc(gShiftChord.curShiftDistance / gShiftChord.shiftThreshold);
      if (Math.abs(offset) >= 1) {
        _shiftChord(offset)
        gShiftChord.curShiftDistance -= offset * gShiftChord.shiftThreshold
      }
    } else {
      gShiftChord.curShiftDistance = dx
    }
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
      EditAction.unhighlightNode(gDragChord.toUpdateNode)
      gThis.editor.replaceNode(gDragChord.toUpdateNode, gDragChord.toInsertNode)
    }
    gDragChord.clear()
    gUI.hideDragMark()
  } else if (gShiftChord.is) {
    if (gShiftChord.curNode.temp) delete gShiftChord.curNode.temp; // 移除临时状态
    gShiftChord.clear()
  }
}

function _setToRemoveNode(node) {
  if (node == gDragChord.toInsertNode) return

  if (!gShiftChord.is) {
    if (gDragChord.toUpdateNode)
      EditAction.unhighlightNode(gDragChord.toUpdateNode)
    EditAction.highlightNode(node)
    gDragChord.toUpdateNode = node
  }
}

function _startDragChord(e, chordName) {
  gDragChord.is = true
  gDragChord.chordName = chordName
  gDragChord.toInsertNode = NodeUtils.createChordNode('', chordName)
  gDragChord.toUpdateNode = null
  _onCursorMove(e)
  gUI.showDragMark(chordName)
}

function _startShiftChord(e, chordName, node) {
  gShiftChord.is = e.altKey ? true : false
  if (gShiftChord.is) {
    gShiftChord.lastPosX = getCursorClientPos(e)[0];
    gShiftChord.chordName = chordName
    gShiftChord.setCurShiftNode(node)
    _onCursorMove(e)
  }
}

function _shiftChordByStep(toLeft = true) {
  // TODO: 这会破坏下划线，如何保留？
  let isPlaceholder = NodeUtils.isPlaceholder(gShiftChord.curNode.content)
  let nearbyNode = toLeft ? NodeUtils.prevSibling(gShiftChord.curNode) : NodeUtils.nextSibling(gShiftChord.curNode)
  // 插入还是替换？
  // 如果当前是占位和弦，则替换
  // 否则，如果临近是文本，且是空文本，则替换
  // 否则，插入
  // /TODO: 如果是和弦怎么处理？

  if (nearbyNode.type != ENodeType.Text && isPlaceholder) return; // 如果已经是占位和弦，且临近也是和弦或其他标记，则不允许移动

  let replace = nearbyNode.type == ENodeType.Text && (isPlaceholder || NodeUtils.isPlaceholder(nearbyNode.content))
  let oldNode = gShiftChord.curNode

  if (replace) { // 替换，则把和弦移动到前一个文本上
    let curNode = EditAction.convertToChord(nearbyNode, gShiftChord.chordName)
    gShiftChord.setCurShiftNode(curNode)
  } else { // 否则在前方插入一个和弦
    let curNode = NodeUtils.createChordNode("_", gShiftChord.chordName)
    curNode.temp = true // 设置为临时节点，可以被删除
    gShiftChord.setCurShiftNode(curNode)
    if (toLeft) NodeUtils.insertBefore(oldNode, gShiftChord.curNode);
    else NodeUtils.insertAfter(oldNode, gShiftChord.curNode);
  }

  // 如果时新建的节点，则删除
  EditAction.convertToText(oldNode, oldNode.temp == true) // TIPS: 发现一点，如果传入undefined，似乎会使用默认参数
}

function _shiftChord(offset) {
  offset = Math.trunc(offset)
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
  tip: `【拖拽和弦】\n从左侧和弦工具栏拖拽来添加和弦\nShift+鼠标左键：移动和弦\nCtrl+鼠标左键：复制和弦\n按住Shift可以移动和弦\nAlt+鼠标左键（左右拖拽）：微调偏移和弦`,
  componentEvents: {
    text: {
      mouseenter: (e, node) => {
        if (gDragChord.is) {
          _setToRemoveNode(node)
        }
      },
      mouseleave: (e, node) => {
        if (gDragChord.is && node == gDragChord.toUpdateNode) {
          EditAction.unhighlightNode(gDragChord.toUpdateNode)
          gDragChord.toUpdateNode = null
        }
      },
    },
    chord: {
      mouseenter: (e, node) => {
        if (gDragChord.is) {
          _setToRemoveNode(node)
        }
      },
      mouseleave: (e, node) => {
        if (gDragChord.is && node == gDragChord.toUpdateNode) {
          EditAction.unhighlightNode(gDragChord.toUpdateNode)
          gDragChord.toUpdateNode = null
        }
      },
      mousedown: (e, node) => {
        if (gDragChord.is || gShiftChord.is) return;

        if (e.shiftKey) {
          _startDragChord(e, node.chord)
          
          gThis.editor.convertToText(node, false)
        } else if (e.ctrlKey){
          _startDragChord(e, node.chord)
        } else if (e.altKey && node.type == ENodeType.Chord){
          _startShiftChord(e, node.chord, node)
        }
      }
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