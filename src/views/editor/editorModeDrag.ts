import { getCursorClientPos } from "@/utils/common";
import { setPos } from "@/utils/common";
import { ENodeType, SheetNode, NodeUtils } from "@/utils/sheetNode";
import { EditorMode } from "./editorMode";
import { SheetEditor } from "./editor";
import { MouseDelta } from '@/utils/mouse';
import { assert } from "@/utils/assert";
import { Chord } from "@/utils/chord";
import { highlightNode, unhighlightNode } from "./editorModeCommon";

export class DragChordInfo {
    isDragging: boolean
    text: string

    constructor() {
        this.reset()
    }

    reset() {
        this.isDragging = false
        this.text = ''
    }
}


class DragUIInfo {
    willUpdateNextFrame: boolean
    willUpdatePos: AbsolutePosition
    dragMarkElement: object

    constructor(dragMarkElement: object) {
        this.willUpdateNextFrame = false
        this.willUpdatePos = new AbsolutePosition()
        this.dragMarkElement = dragMarkElement
    }

    setDragMarkPosNextFrame(left, top) {
        this.willUpdatePos = { left, top }
        if (!this.willUpdateNextFrame) {
            this.willUpdateNextFrame = true
            window.requestAnimationFrame(() => {
                setPos(this.dragMarkElement, this.willUpdatePos.left, this.willUpdatePos.top) // 触发时是最新数据
                this.willUpdateNextFrame = false
            })
        }
    }
}

class DragChordState {
    info: DragChordInfo
    toUpdateNode: SheetNode
    toInsertNode: SheetNode
    ui: DragUIInfo
    editor: SheetEditor

    constructor(info: DragChordInfo, dragMarkElement: object, editor: SheetEditor) {
        this.info = info
        this.ui = new DragUIInfo(dragMarkElement)
        this.editor = editor
        this.reset()
    }

    reset() {
        this.info.reset()
        this.toUpdateNode = null
        this.toInsertNode = null
    }

    startDrag(e, chord : Chord) {
        this.info.isDragging = true
        this.info.text = chord.toString()
        console.log(chord, chord.toString())
        this.toInsertNode = NodeUtils.createChordNode('', chord)
        this.toUpdateNode = null
        this.onCursorMove(e)
    }

    onCursorDownNode(e, node) {
        if (this.info.isDragging) return;
        let startDrag = e.shiftKey || e.ctrlKey

        if (!startDrag) return;
        this.startDrag(e, node.chord)

        if (e.shiftKey) { // move chord
            this.editor.core.convertToText(node, false)
        }
    }
    onCursorEnterNode(e, node : SheetNode) {
        assert(node.isText() || node.isChord(), "node must be text or chord")
        if (!this.info.isDragging) return;
        if (node == this.toInsertNode) return;

        this.editor.core.pauseHistory()

        // mark this node
        if (this.toUpdateNode) // unhighlight prev node
            unhighlightNode(this.toUpdateNode);
        highlightNode(node)
        this.toUpdateNode = node
    }
    onCursorLeaveNode(e, node) {
        // unmark this node
        if (this.info.isDragging && node == this.toUpdateNode) { // unhighlight node
            unhighlightNode(this.toUpdateNode)
            this.toUpdateNode = null
        }
    }
    onCursorMove(e) {
        if (!this.info.isDragging) return;
        let [x, y] = getCursorClientPos(e);
        this.ui.setDragMarkPosNextFrame(x, y)
    }
    onCursorUp(e) {
        if (!this.info.isDragging) return;
        if (this.toUpdateNode) {
            // 判断插入纯和弦还是标注和弦
            if (this._doesPreferPureChord()) {
                this.toInsertNode.type = ENodeType.ChordPure
                this.toInsertNode.content = ''
            } else {
                this.toInsertNode.type = ENodeType.Chord
                this.toInsertNode.content = this.toUpdateNode.content
            }
            // TODO: 检查是否能够替换，有没有不能直接替换的情况？
            unhighlightNode(this.toUpdateNode)
            this.editor.core.replace(this.toUpdateNode, this.toInsertNode)
        }
        this.editor.core.resumeHistory(true)
        this.reset()
    }

    _doesPreferPureChord() {
        let toUpdateNode = this.toUpdateNode
        if (!toUpdateNode) return false;
        else if (toUpdateNode.type == ENodeType.ChordPure) return true; // 纯和弦，则也插入纯和弦
        else {
            // 同一行内，如果有ChordPure则插入纯和弦
            // 否则，如果有非空的Text和Chord节点则插入普通和弦
            let lineStartNode = NodeUtils.findPrev(toUpdateNode, (n) => n.type == ENodeType.NewLine || NodeUtils.isFirstNode(n))
            let lineEndNode = NodeUtils.findNext(toUpdateNode, (n) => n.type == ENodeType.NewLine || NodeUtils.isLastNode(n))

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
}

class ShiftChordState {
    isShifting: boolean
    chord: Chord
    mouseDelta: MouseDelta
    curNode: SheetNode
    isCurNodeTemp: boolean
    shiftThreshold: number
    curShiftDistance: number
    editor: SheetEditor

    constructor(editor: SheetEditor) {
        this.editor = editor
        this.mouseDelta = new MouseDelta()
        this.reset()
    }

    setCurShiftNode(n : SheetNode, isTemp : boolean) {
        if (this.curNode)
            unhighlightNode(this.curNode)

        if (n) {
            highlightNode(n)
            this.isCurNodeTemp = isTemp
        }

        this.curNode = n;
    }
    reset() {
        this.isShifting = false
        this.setCurShiftNode(null, false)
        this.chord = null,
        this.shiftThreshold = 50
        this.curShiftDistance = 0
    }

    onCursorDownNode(e, node) {
        if (this.isShifting) return;

        this.isShifting = e.altKey ? true : false
        if (this.isShifting) {
            this.editor.core.pauseHistory()
            this.mouseDelta.start(e)
            this.chord = node.chord
            this.setCurShiftNode(node, false)
        }
    }
    onCursorMove(e) {
        if (!this.isShifting) return;
        let [dx, dy] = this.mouseDelta.tick(e)

        if (dx * this.curShiftDistance >= 0) { // move on same direction
            this.curShiftDistance += dx

            let shiftStep = Math.trunc(this.curShiftDistance / this.shiftThreshold);
            if (Math.abs(shiftStep) >= 1) {
                this._shiftChord(shiftStep)
                this.curShiftDistance -= shiftStep * this.shiftThreshold
            }
        } else { // if move on diffrent direction, restart counting
            this.curShiftDistance = dx
        }
    }
    onCursorUp(e) {
        if (!this.isShifting) return;

        this.reset()
        this.editor.core.resumeHistory(true)
    }

    _shiftChordByStep(toLeft = true) {
        // TODO: 这会破坏下划线，如何保留？
        let isPlaceholder = NodeUtils.isPlaceholder(this.curNode.content)
        // let nearbyNode = toLeft ? this.curNode.prevSibling() : this.curNode.nextSibling()
        let nearbyNode = toLeft ? this.curNode.prevNode() : this.curNode.nextNode()
        // 插入还是替换？
        // 如果当前是占位和弦，则替换
        // 否则，如果临近是文本，且是空文本，则替换
        // 否则，插入
        // /TODO: 如果是和弦怎么处理？

        if (nearbyNode.type != ENodeType.Text && isPlaceholder) return; // 如果已经是占位和弦，且临近也是和弦或其他标记，则不允许移动

        let replace = nearbyNode.type == ENodeType.Text && (isPlaceholder || NodeUtils.isPlaceholder(nearbyNode.content))
        let oldNode = this.curNode
        let isOldNodeTemp = this.isCurNodeTemp

        if (replace) { // 替换，则把和弦移动到前一个文本上
            let curNode = this.editor.core.convertToChord(nearbyNode, this.chord)
            this.setCurShiftNode(curNode, false)
        } else { // 否则在前方插入一个和弦
            let curNode = NodeUtils.createChordNode("_", this.chord)
            this.setCurShiftNode(curNode, true) 
            if (toLeft) NodeUtils.insertBefore(oldNode, this.curNode);
            else NodeUtils.insertAfter(oldNode, this.curNode);
        }

        // 如果此前的节点是拖拽中新建的节点，则删除
        this.editor.core.convertToText(oldNode, isOldNodeTemp)
    }

    _shiftChord(offset) {
        offset = Math.trunc(offset)
        if (offset > 0) {
            while (offset--) {
                this._shiftChordByStep(false)
            }
        } else {
            while (offset++) {
                this._shiftChordByStep(true)
            }
        }
    }

}

class AbsolutePosition {
    left: number
    top: number
    constructor(left = 0, top = 0) {
        this.left = left
        this.top = top
    }
}

export class EditorModeDrag extends EditorMode {
    editor : SheetEditor
    curNode: SheetNode
    hookIds: number[]
    dragChordState: DragChordState
    shiftChordState: ShiftChordState

    constructor(dragChordInfo: DragChordInfo, dragMarkElement: Element, editor : SheetEditor) {
        super()
        this.editor = editor
        this.curNode = null
        this.hookIds = []
        this.dragChordState = new DragChordState(dragChordInfo, dragMarkElement, this.editor)
        this.shiftChordState = new ShiftChordState(this.editor)

        const that = this

        this.nodeEventList.text.mouseEnters.push((e, node) => {
            that.dragChordState.onCursorEnterNode(e, node)
        })
        this.nodeEventList.text.mouseLeaves.push((e, node) => {
            that.dragChordState.onCursorLeaveNode(e, node)
        })

        this.nodeEventList.chord.mouseEnters.push((e, node) => {
            that.dragChordState.onCursorEnterNode(e, node)
        })
        this.nodeEventList.chord.mouseLeaves.push((e, node) => {
            that.dragChordState.onCursorLeaveNode(e, node)
        })
        this.nodeEventList.chord.mouseDowns.push((e, node) => {
            that.dragChordState.onCursorDownNode(e, node)
            that.shiftChordState.onCursorDownNode(e, node)
        })

        this.toolChordEvents.dragStarts.push( (e, chord : Chord) => {
            that.dragChordState.startDrag(e, chord);
            // e.preventDefault()
        })
    }

    getTip(): string {
        return `【拖拽和弦】\n从左侧和弦工具栏拖拽来添加和弦\nShift+鼠标左键：移动和弦\nCtrl+鼠标左键：复制和弦\n按住Shift可以移动和弦\nAlt+鼠标左键（左右拖拽）：微调偏移和弦`
    }  

    hook() {
        let that = this
        document.addEventListener("mousemove", (e) => this._onCursorMove.call(that, e));
        document.addEventListener("mouseup", (e) => this._onCursorUp.call(that, e));
    }

    release() {
        let that = this
        document.removeEventListener("mousemove", (e) => this._onCursorMove.call(that, e));
        document.removeEventListener("mouseup", (e) => this._onCursorUp.call(that, e));
    }

    _onCursorMove(e) {
        this.dragChordState.onCursorMove(e)
        this.shiftChordState.onCursorMove(e)
    }

    _onCursorUp(e) {
        this.dragChordState.onCursorUp(e)
        this.shiftChordState.onCursorUp(e)
    }
}