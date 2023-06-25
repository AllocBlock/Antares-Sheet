import HotKey from "@/utils/hotKey.js";
import { EditorMode } from "./editorMode";
import { SheetNode, NodeUtils } from "@/utils/sheetNode";
import SheetEditor from "./editor";

export default class EditorModeBasic extends EditorMode {
    editor : SheetEditor
    curNode: SheetNode
    hookIds: number[]

    constructor(editor : SheetEditor) {
        super()
        this.editor = editor
        this.curNode = null
        this.hookIds = []
        const that = this

        const onMouseEnterNode = (e, node) => this._cbMouseEnter(e, node)
        const onMouseLeaveNode = (e, node) => this._cbMouseLeave(e, node)

        this.nodeEventList.text.doubleClicks.push( (e, node) => that.editor.editTextWithNeighbor(node) )
        this.nodeEventList.text.mouseEnters.push(onMouseEnterNode)
        this.nodeEventList.text.mouseLeaves.push(onMouseLeaveNode)

        this.nodeEventList.chord.doubleClicks.push( (e, node) => {
            if (!e.shiftKey) {
                that.editor.addUnderlineForChord(node);
            }
            else if (NodeUtils.hasUnderlineToNextChord(node)) {
                that.editor.removeUnderlineOnChord(node);
            }
        })
        this.nodeEventList.chord.mouseEnters.push(onMouseEnterNode)
        this.nodeEventList.chord.mouseLeaves.push(onMouseLeaveNode)

        this.nodeEventList.mark.doubleClicks.push( (e, node) => {
            that.editor.editContent(node);
        } )
        this.nodeEventList.mark.mouseEnters.push(onMouseEnterNode)
        this.nodeEventList.mark.mouseLeaves.push(onMouseLeaveNode)

        this.nodeEventList.newline.mouseEnters.push(onMouseEnterNode)
        this.nodeEventList.newline.mouseLeaves.push(onMouseLeaveNode)
    }

    getTip(): string {
        return `【基础编辑】\n右键可以打开菜单来添加/修改内容\n双击可以编辑文字/添加下划线\nTab/Shift+Tab键可在前方/后方添加空格\n按下~键可移除和弦`
    }

    _cbMouseEnter(e, node) {
        this.curNode = node
    }

    _cbMouseLeave(e, node) {
        if (this.curNode == node)
            this.curNode = node
    }

    _hotkeySwitcher(func) {
        return (e) => {
            if (!this.curNode) return
            if (!this.isHotkeyEnable) return
            func(e)
        }
    }

    _insertSpaceBefore(e) {
        e.preventDefault()
        if (!this.curNode) return

        let emptyNode = NodeUtils.createTextNode(" ")
        this.editor.insertBefore(this.curNode, emptyNode)
    }

    _insertSpaceAfter(e) {
        e.preventDefault()
        if (!this.curNode) return

        let emptyNode = NodeUtils.createTextNode(" ")
        this.editor.insertAfter(this.curNode, emptyNode)
    }

    _delete(e) {
        e.preventDefault()
        if (!this.curNode) return

        this.editor.remove(this.curNode)
        this.curNode = null
    }

    _recoverChordToText(e) {
        e.preventDefault()
        if (this.curNode.isChord()) {
            this.curNode = this.editor.convertChordToText(this.curNode)[0]
        }
    }

    _insertNewLineBefore(e) {
        e.preventDefault()
        if (!this.curNode) return

        
        this.editor.insertBefore(this.curNode, NodeUtils.createNewLineNode())
    }

    _insertNewLineAfter(e) {
        e.preventDefault()
        if (!this.curNode) return
        
        this.editor.insertAfter(this.curNode, NodeUtils.createNewLineNode())
    }

    _addUnderline(e) {
        e.preventDefault()
        if (!this.curNode) return
        if (!this.curNode.isChord()) return

        this.editor.addUnderlineForChord(this.curNode)
    }

    _removeUnderline(e) {
        e.preventDefault()
        if (!this.curNode) return
        if (!this.curNode.isChord()) return
        if (!NodeUtils.hasUnderlineToNextChord(this.curNode)) return

        this.editor.removeUnderlineOnChord(this.curNode)
    }

    _switchChordType(e) {
        e.preventDefault()
        if (!this.curNode) return
        if (!this.curNode.isChord()) return

        this.editor.switchChordType(this.curNode)
    }

    hook() {
        // 按下~移除和弦
        this.hookIds.push(HotKey.addListener("Backquote", this._hotkeySwitcher(this._recoverChordToText.bind(this))))

        // 按下tab键快速在前方添加空格，+Shift则在后方
        this.hookIds.push(HotKey.addListener("Tab", this._hotkeySwitcher(this._insertSpaceBefore.bind(this)), null, false, null))
        this.hookIds.push(HotKey.addListener("Tab", this._hotkeySwitcher(this._insertSpaceAfter.bind(this)), null, true, null))

        // 按下delete/R键快速删除
        this.hookIds.push(HotKey.addListener("Delete", this._hotkeySwitcher(this._delete.bind(this))))
        this.hookIds.push(HotKey.addListener("KeyR", this._hotkeySwitcher(this._delete.bind(this))))

        // 按下enter键快速在后方添加换行，同时按下shift则在前方添加
        this.hookIds.push(HotKey.addListener("Enter", this._hotkeySwitcher(this._insertNewLineBefore.bind(this)), null, false, null))
        this.hookIds.push(HotKey.addListener("Enter", this._hotkeySwitcher(this._insertNewLineAfter.bind(this)), null, true, null))

        // 按下U键快速添加下划线，J删除下划线
        this.hookIds.push(HotKey.addListener("KeyU", this._hotkeySwitcher(this._addUnderline.bind(this))))
        this.hookIds.push(HotKey.addListener("KeyJ", this._hotkeySwitcher(this._removeUnderline.bind(this))))

        // 按下Z键快速切换和弦类型
        this.hookIds.push(HotKey.addListener("KeyZ", this._hotkeySwitcher(this._switchChordType.bind(this))))

        // Ctrl+Z 撤销， Ctrl+Y 重做
        this.hookIds.push(HotKey.addListener("KeyZ", () => {
            if (this.editor.canUndo())
                this.editor.undo()
        }, true))
        this.hookIds.push(HotKey.addListener("KeyY", () => {
            if (this.editor.canRedo())
                this.editor.redo()
        }, true))
    }

    release() {
        for (let id of this.hookIds) {
            HotKey.removeListener(id)
        }
    }
}

