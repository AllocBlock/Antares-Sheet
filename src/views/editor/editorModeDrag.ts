import { getCursorClientPos } from "@/utils/common";
import { setPos } from "@/utils/common";
import { ENodeType, SheetNode, NodeUtils } from "@/utils/sheetNode";
import { EditorMode } from "./editorMode";
import { SheetEditor } from "./editor";
import { MouseDelta } from '@/utils/mouse';
import { assert } from "@/utils/assert";
import { Chord } from "@/utils/chord";
import { highlightNode, unhighlightNode } from "./editorModeCommon";
import { AsyncAtomEditOperation } from "./editorCore";

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
    atomOpAsync : AsyncAtomEditOperation | null = null
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

    finish() {
        this.atomOpAsync?.end();
        this.reset();
    }

    reset() {
        this.atomOpAsync = null;
        this.info.reset()
        this.toUpdateNode = null
        this.toInsertNode = null
    }

    startDrag(e, chord : Chord) {
        this.info.isDragging = true
        this.atomOpAsync = this.editor.core.runAtomOperationAsync();
        this.atomOpAsync.run(() => {
            this.info.text = chord.toString()
            console.log(chord, chord.toString())
            this.toInsertNode = NodeUtils.createChordNode('', chord)
            this.toUpdateNode = null
            this.onCursorMove(e)
        })
    }

    onCursorDownNode(e, node) {
        if (this.info.isDragging) return;
        let startDrag = e.shiftKey || e.ctrlKey

        if (!startDrag) return;
        this.startDrag(e, node.chord)
        this.atomOpAsync?.run(() => {
            if (e.shiftKey) { // move chord
                this.editor.core.convertToText(node, false)
            }
        })
    }
    onCursorEnterNode(e, node : SheetNode) {
        this.atomOpAsync?.run(() => {
            assert(node.isText() || node.isChord(), "node must be text or chord")
            if (node == this.toInsertNode) return;

            // mark this node
            if (this.toUpdateNode) // unhighlight prev node
            unhighlightNode(this.toUpdateNode);
            highlightNode(node)
            this.toUpdateNode = node
        })
    }
    onCursorLeaveNode(e, node) {
        this.atomOpAsync?.run(() => {
            // unmark this node
            if (this.info.isDragging && node == this.toUpdateNode) { // unhighlight node
                unhighlightNode(this.toUpdateNode)
                this.toUpdateNode = null
            }
        })
    }
    onCursorMove(e) {
        this.atomOpAsync?.run(() => {
            let [x, y] = getCursorClientPos(e);
            this.ui.setDragMarkPosNextFrame(x, y)
        })
    }

    onCursorUp(e) {
        this.atomOpAsync?.run(() => {
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
            this.finish()
        })
        this.atomOpAsync?.end();
        this.atomOpAsync = null;
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
    atomOpAsync : AsyncAtomEditOperation | null = null // 
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

    finish() {
        this.atomOpAsync?.end();
        this.reset();
    }

    reset() {
        this.atomOpAsync = null
        this.setCurShiftNode(null, false)
        this.chord = null,
        this.shiftThreshold = 50
        this.curShiftDistance = 0
    }

    onCursorDownNode(e, node) {
        if (this.atomOpAsync != null) return;

        if (e.altKey) {
            this.atomOpAsync = this.editor.core.runAtomOperationAsync()
            this.atomOpAsync.run(() => {
                this.mouseDelta.start(e)
                this.chord = node.chord
                this.setCurShiftNode(node, false)
            })
        }
    }
    onCursorMove(e) {
        this.atomOpAsync?.run(() => {
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
        })
    }
    onCursorUp(e) {
        this.atomOpAsync?.run(() => {
            this.finish()
        })
        this.atomOpAsync?.end();
    }

    _shiftChordByStep(toLeft = true) {
        // TODO: 这会破坏下划线，如何保留？
        this.editor.core.removeAllUnderlineOfChord(this.curNode);
        let isPlaceholder = NodeUtils.isPlaceholder(this.curNode.content)
        let nearbyNode = toLeft ? this.curNode.prevSibling() : this.curNode.nextSibling()
        // let nearbyNode = toLeft ? this.curNode.prevNode() : this.curNode.nextNode()
        // 插入还是替换？
        // 如果当前是占位和弦，则替换
        // 否则，如果临近是文本，且是空文本，则替换
        // 否则，插入
        // TODO: 如果是和弦怎么处理？

        // 仅前方为文本节点，或前方为其他节点，但当前不是占位符的时候，才能进行偏移如果已经是占位和弦，且没有临近、临近也是和弦或其他标记时，则不允许移动
        if (!(nearbyNode && (nearbyNode.type == ENodeType.Text || !isPlaceholder)))
            return;

        let replace = nearbyNode && nearbyNode.type == ENodeType.Text && (isPlaceholder || NodeUtils.isPlaceholder(nearbyNode.content))
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

        this.nodeEventList.text.mouseEnters.push((e, node) => {
            this.dragChordState.onCursorEnterNode(e, node)
        })
        this.nodeEventList.text.mouseLeaves.push((e, node) => {
            this.dragChordState.onCursorLeaveNode(e, node)
        })

        this.nodeEventList.chord.mouseEnters.push((e, node) => {
            this.dragChordState.onCursorEnterNode(e, node)
        })
        this.nodeEventList.chord.mouseLeaves.push((e, node) => {
            this.dragChordState.onCursorLeaveNode(e, node)
        })
        this.nodeEventList.chord.mouseDowns.push((e, node) => {
            this.dragChordState.onCursorDownNode(e, node)
            this.shiftChordState.onCursorDownNode(e, node)
        })

        this.toolChordEvents.dragStarts.push( (e, chord : Chord) => {
            this.dragChordState.startDrag(e, chord);
            // e.preventDefault()
        })
    }

    getTip(): string {
        return `【拖拽和弦】\n从左侧和弦工具栏拖拽来添加和弦\nShift+鼠标左键：移动和弦\nCtrl+鼠标左键：复制和弦\n按住Shift可以移动和弦\nAlt+鼠标左键（左右拖拽）：微调偏移和弦`
    }  

    hook() {
        document.addEventListener("mousemove", (e) => this._onCursorMove(e));
        document.addEventListener("mouseup", (e) => this._onCursorUp(e));
    }

    release() {
        document.removeEventListener("mousemove", (e) => this._onCursorMove(e));
        document.removeEventListener("mouseup", (e) => this._onCursorUp(e));
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