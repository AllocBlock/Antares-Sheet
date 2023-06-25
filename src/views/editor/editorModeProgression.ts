import HotKey from "@/utils/hotKey.js";
import { EditorMode } from "./editorMode";
import { SheetNode } from "@/utils/sheetNode";
import SheetEditor from "./editor";
import { Chord, EChordQuality, Key } from "@/utils/chord";

const gProgressionList = [
    [0, true], // distance to tonic, is major
    [2, false],
    [4, false],
    [5, true],
    [7, true],
    [9, false],
    [11, false],
]

export default class EditorModeProgression extends EditorMode {
    editor : SheetEditor
    curNode: SheetNode
    hookIds: number[]

    constructor(editor : SheetEditor) {
        super()
        this.editor = editor
        this.curNode = null
        this.hookIds = []
        const that = this

        this.nodeEventList.text.mouseEnters.push((e, node) => {
            that.setCurNode(node)
        })
        this.nodeEventList.text.mouseLeaves.push((e, node) => {
            if (this.curNode == node)
                that.setCurNode(null);
        })

        this.nodeEventList.chord.mouseEnters.push((e, node) => {
            that.setCurNode(node)
        })
        this.nodeEventList.chord.mouseLeaves.push((e, node) => {
            if (this.curNode == node)
                that.setCurNode(null);
        })
    }

    getTip(): string {
        return `【和弦级数模式】\n鼠标移动到文字上，按下1-7键修改和弦\n重复按同一个键可切换大小调`
    }

    setCurNode(node) {
        this.curNode = node
    }

    hook() {
        // 按下1-7应用对应级数的和弦
        gProgressionList.forEach(([shift, isMajor], i) => {
            const keyName = "Digit" + (i + 1).toString()
            let listenerId = HotKey.addListener(keyName, (e, [shift, isMajor]) => {
                if (!this.curNode) return
                let rootNote = Key.createFromIndex(shift)
                let chord = new Chord(rootNote)
                if (this.curNode.isChord()) {
                    if (Key.getOffset(this.curNode.chord.root, chord.root) == 0) { // 同级的和弦，再次按下则切换大小和弦
                        if (this.curNode.chord.quality == EChordQuality.Major)
                            chord.quality = EChordQuality.Minor;
                        else if (this.curNode.chord.quality == EChordQuality.Minor)
                            chord.quality = EChordQuality.Major;
                    }
                }

                this.curNode = this.editor.convertToChord(this.curNode, chord)
            }, false, false, false, [shift, isMajor])
            this.hookIds.push(listenerId)
        })
    }

    release() {
        for (let id of this.hookIds) {
            HotKey.removeListener(id)
        }
    }
}