import { ENodeType, SheetNode } from "@/utils/sheetNode"
import { assert } from "@/utils/assert"
import { NodeUtils } from "@/utils/sheetEdit"
import History from "@/utils/history"
import SheetMeta from "@/utils/sheetMeta"
import { reactive } from "vue"
import { Chord, Key } from "@/utils/chord"

const MAX_UNDO_TIMES = 100

export default class SheetEditor {
    history: History<SheetNode>
    meta: SheetMeta
    root: SheetNode
    historyPauseCount: number

    constructor() {
        this.meta = new SheetMeta()
        this.root = reactive(NodeUtils.createRootNode())
        this.history = new History<SheetNode>(MAX_UNDO_TIMES, this.root.clone())
        this.historyPauseCount = 0
    }

    private __replaceSheet(root: SheetNode) {
        this.root.children = []
        NodeUtils.append(this.root, root.children)
    }

    canUndo(): boolean { return this.history.hasPrev() }
    canRedo(): boolean { return this.history.hasNext() }
    undo(): void {
        assert(this.canUndo(), "no more histroy for undo")
        let historyRoot = this.history.goPrev()
        this.__replaceSheet(historyRoot)
        console.log("undo", this.root)
    }
    redo(): void {
        assert(this.canRedo(), "no more histroy for redo")
        let historyRoot = this.history.goNext()
        this.__replaceSheet(historyRoot)
        console.log("redo", this.root)
    }

    pauseHistory() {
        this.historyPauseCount++
    }

    resumeHistory(addCurrentToHistory = false) {
        this.historyPauseCount--
        if (this.historyPauseCount == 0 && addCurrentToHistory) {
            this.addHistory()
        }
    }

    addHistory() {
        if (this.historyPauseCount > 0) return;
        console.log("Add history")
        let clonedRoot = this.root.clone()
        this.history.add(clonedRoot)
    }

    clearHistory() {
        this.history.clear(this.root.clone())
    }

    setMeta(meta: SheetMeta) {
        this.meta = meta
    }

    replaceSheet(root: SheetNode, clearHistory: boolean = false) {
        this.__replaceSheet(root)
        if (clearHistory)
            this.clearHistory()
        else
            this.addHistory()
    }

    clearSheet() {
        this.root.children = []
        this.addHistory()
    }

    /** 在目标后方插入节点，可以是数组 */
    insertAfter(node: SheetNode, data) {
        // constrain: underline node should have chord node at both begin and end
        // to void this, these inserted node will be inserted after the underline
        let targetNode = node
        while (targetNode.nextSibling() == null && NodeUtils.isUnderline(targetNode.parent)) {
            targetNode = targetNode.parent
        }

        let toInsertNodes = Array.isArray(data) ? data : [data];

        for (let n of toInsertNodes)
            n.parent = targetNode.parent;
        let index = targetNode.getSelfIndex() + 1
        targetNode.parent.children.splice(index, 0, ...toInsertNodes);

        this.addHistory()
    }

    /** 在目标前方插入节点，可以是数组 */
    insertBefore(node: SheetNode, data) {
        // constrain: underline node should have chord node at both begin and end
        // to void this, these inserted node will be inserted before the underline
        let targetNode = node
        while (targetNode.prevSibling() == null && NodeUtils.isUnderline(targetNode.parent)) {
            targetNode = targetNode.parent
        }

        let toInsertNodes = Array.isArray(data) ? data : [data];

        for (let n of toInsertNodes)
            n.parent = targetNode.parent;
        let index = targetNode.getSelfIndex()
        targetNode.parent.children.splice(index, 0, ...toInsertNodes);
        this.addHistory()
    }

    /** 更新节点的内容 */
    updateContent(node: SheetNode, content: string) {
        assert([ENodeType.Text, ENodeType.Chord, ENodeType.Mark].includes(node.type), `不能编辑${node.type}节点的内容`)

        assert(content.length > 0, "新内容不能为空")
        if (node.type == ENodeType.Text || node.type == ENodeType.Chord)
            assert(node.content.length == 1, "文本/和弦节点的原始内容应该为单个字符")

        switch (node.type) {
            case ENodeType.Text:
            case ENodeType.Chord: { // text node and chord node's content can only be one char
                node.content = content[0]
                let remaining = content.slice(1)
                if (remaining.length > 0) {
                    let textNodes = NodeUtils.createTextNodes(remaining)
                    this.pauseHistory()
                    this.insertAfter(node, textNodes)
                    this.resumeHistory(false)
                }
                break;
            }
            case ENodeType.Mark: {
                node.content = content
                break;
            }
            default: {
                console.warn("无法编辑该节点的内容", node);
                break;
            }
        }

        this.addHistory()
    }

    replace(node: SheetNode, newNode: SheetNode) {
        // TODO: make this safe
        NodeUtils.replace(node, newNode)
        this.addHistory()
    }

    remove(node: SheetNode) {
        this.pauseHistory()
        try {
            if (NodeUtils.isChord(node)) {
                this.removeAllUnderlineOfChord(node)
            }
            NodeUtils.removeFromParent(node)
        }
        finally {
            this.resumeHistory(true)
        }
    }

    /** 给和弦添加一层下划线
     * 具体来说，输入是和弦节点，功能是在输入节点到下一个和弦节点之间，增加一条下划线
     */
    addUnderlineForChord(chordNode: SheetNode) {
        /** 算法分为两个步骤：
         * 首先找到下一个和弦节点
         * 然后是连接的方法，共有四种情况，三种处理方法：添加、扩展和合并
         */
        // constrain: underline must not have nearby underline sibling, as they can be merged to one unique underline
        assert(chordNode.isChord(), "添加下划线的必须是和弦节点")
        let chordType = chordNode.type;

        let nextChordNode = NodeUtils.findNextNodeByType(chordNode, chordType);
        assert(nextChordNode, "无法添加下划线：未找到下一个和弦")

        const startChordNode = chordNode
        const endChordNode = nextChordNode

        if (startChordNode.parent == endChordNode.parent) {
            // 同一层，那么将起始到结束之间的所有元素都放入一个下划线
            // console.log("s e");
            assert(startChordNode.parent === endChordNode.parent, "要添加下划线的节点需要位于同一层级")
            let betweenNodes = NodeUtils.getSiblingBetween(startChordNode, endChordNode, true, true);
            assert(betweenNodes.length >= 2, `未知错误：中间节点的数量有误，应大于2，但现在是${betweenNodes.length}`)

            this.__assertBeginAndEnd(betweenNodes);

            // constrain: chord and pure chord should not be in same underline
            let hasChord = false;
            let hasPureChord = false;
            NodeUtils.traverseForward(startChordNode, false, function (n) {
                hasChord = hasChord || (n.type == ENodeType.Chord)
                hasPureChord = hasPureChord || (n.type == ENodeType.ChordPure)

                if (n === endChordNode) return true;
            })

            assert(!(hasChord && hasPureChord), "下划线内不能同时包含标注和弦和纯和弦")
            let underlineNode = NodeUtils.createUnderlineNode(hasPureChord)

            NodeUtils.insertBefore(betweenNodes[0], underlineNode)
            NodeUtils.removeFromParent(betweenNodes)
            NodeUtils.append(underlineNode, betweenNodes)

        } else if (NodeUtils.parentsOf(startChordNode).includes(endChordNode.parent)) {
            // 起始在内层，结束在外层，则把起始元素的同级下划线（和结束同层）向后扩展到包围结束和弦
            // console.log("[s] e");
            let startUnderlineNode = NodeUtils.parentUntil(startChordNode, endChordNode.parent);

            assert(startUnderlineNode !== endChordNode, "边界节点不能是下划线自己")
            assert(startUnderlineNode.parent === endChordNode.parent, "要扩展到下划线的节点需要位于同一层级")
            // constrain: underline must has chord at both begin and end
            assert(endChordNode.isChord(), "扩展下划线时，首/尾部的元素必须是和弦")

            let isAfterUnderline = startUnderlineNode.getSelfIndex() < endChordNode.getSelfIndex()

            let betweenNodes = NodeUtils.getSiblingBetween(startUnderlineNode, endChordNode, false, true);

            NodeUtils.removeFromParent(betweenNodes)
            NodeUtils.append(startUnderlineNode, betweenNodes)

        } else if (NodeUtils.parentsOf(endChordNode).includes(startChordNode.parent)) {
            // 起始在外层，结束在内层，则把结束元素的同级下划线（和起始同层）向前扩展到包围起始和弦
            // console.log("s [e]");
            let endUnderlineNode = NodeUtils.parentUntil(endChordNode, startChordNode.parent);

            assert(endUnderlineNode !== startChordNode, "边界节点不能是下划线自己")
            assert(endUnderlineNode.parent === startChordNode.parent, "要扩展到下划线的节点需要位于同一层级")
            // constrain: underline must has chord at both begin and end
            assert(startChordNode.isChord(), "扩展下划线时，首/尾部的元素必须是和弦")

            let betweenNodes = NodeUtils.getSiblingBetween(startChordNode, endUnderlineNode, true, false);

            NodeUtils.removeFromParent(betweenNodes)
            NodeUtils.prepend(endUnderlineNode, betweenNodes)
        } else {
            // 起始结束都在内层（且不是同一个下划线），则把他们的同级下划线以及中间的元素合并到一个下划线
            // console.log("[s] [e]");
            let commonAncestorNode = NodeUtils.commonAncestor(startChordNode, endChordNode);
            let startUnderlineNode = NodeUtils.parentUntil(startChordNode, commonAncestorNode);
            let endUnderlineNode = NodeUtils.parentUntil(endChordNode, commonAncestorNode);

            assert(startUnderlineNode.isUnderline() && endUnderlineNode.isUnderline(), "要合并的节点必须是下划线")
            assert(startUnderlineNode !== endUnderlineNode, "不能与自己合并")
            assert(startUnderlineNode.parent === endUnderlineNode.parent, "要合并的两个下划线需要位于同一层级")
            assert(startUnderlineNode.type == endUnderlineNode.type, "要合并的下划线的类型应相同")

            if (startUnderlineNode.getSelfIndex() > endUnderlineNode.getSelfIndex()) {
                let temp = startUnderlineNode
                startUnderlineNode = endUnderlineNode
                endUnderlineNode = temp
            }

            let betweenNodes = NodeUtils.getSiblingBetween(startUnderlineNode, endUnderlineNode, false, false);
            let mergedNode = NodeUtils.createUnderlineNode(startUnderlineNode.type == ENodeType.UnderlinePure)

            NodeUtils.removeFromParent(betweenNodes)

            NodeUtils.append(mergedNode, startUnderlineNode.children)
            NodeUtils.append(mergedNode, betweenNodes)
            NodeUtils.append(mergedNode, endUnderlineNode.children)

            NodeUtils.removeFromParent(endUnderlineNode)
            NodeUtils.replace(startUnderlineNode, mergedNode)
        }

        this.addHistory()
    }

    /** 删除和弦的一层下划线
     * 具体来说，输入是和弦节点，功能是在输入节点到下一个和弦节点之间，删除已有的一条下划线
     */
    removeUnderlineOnChord(chordNode: SheetNode) {
        assert(chordNode.isChord(), "要移除下划线的必须是和弦节点")
        assert(chordNode.parent.isUnderline(), "和弦不在下划线下，无需删除")

        let chordType = chordNode.type;
        let nextChordNode = NodeUtils.findNextNodeByType(chordNode, chordType);
        if (!nextChordNode) throw "未找到下一个和弦";

        let commonUnderlineNode = NodeUtils.commonAncestor(chordNode, nextChordNode);
        assert(commonUnderlineNode && commonUnderlineNode.isUnderline(), "当前和弦和下一个和弦之间没有下划线连接，无需删除")

        // 起始节点是起始和弦，或包含起始和弦的下划线，终止节点同理
        // 且起始节点和终止节点一定是相邻的兄弟节点
        let startNode = NodeUtils.parentUntil(chordNode, commonUnderlineNode);
        let endNode = NodeUtils.parentUntil(nextChordNode, commonUnderlineNode);

        assert(commonUnderlineNode.isUnderline(), "common ancestor is suppose to be underline")

        // constrain: underline must has chord at both begin and end
        // so if chord node is the first child, it must be beginning of underline
        let isBegin = chordNode.prevSibling() == null;
        let isEnd = nextChordNode.nextSibling() == null;

        if (isBegin && isEnd) {
            // 下划线只有这两个节点，则删除整个下划线，内容放到外面
            // console.log("[s e] -> s e");
            NodeUtils.replace(commonUnderlineNode, commonUnderlineNode.children)
        } else if (!isBegin && isEnd) {
            // 起始节点前面还有元素，但结束节点后面没有，需要把起始节点之后的所有元素移出
            // console.log("[xxx s e] -> [xxx s] e");
            assert(startNode.parent === commonUnderlineNode, "缩小的基准节点必须在下划线内")
            // constrain: underline must has chord at both begin and end
            assert(startNode.isChord() || commonUnderlineNode.isUnderline(), "缩小的基准节点应该是和弦或下划线（以保证下划线首尾都是和弦）")

            let anchorNodes = commonUnderlineNode.children.filter(n => n.isChord() || n.isUnderline())
            let baseNodeIndex = anchorNodes.indexOf(startNode)

            assert(startNode.isUnderline() || baseNodeIndex < anchorNodes.length - 1, "尾部缩小时，基准节点不应该是最后一个和弦节点")
            let slicedNodes = commonUnderlineNode.children.slice(startNode.getSelfIndex() + 1)

            NodeUtils.removeFromParent(slicedNodes)
            NodeUtils.insertAfter(commonUnderlineNode, slicedNodes)

        } else if (isBegin && !isEnd) {
            // 起始节点前面没有，但结束节点后面有元素，需要把结束节点之前的所有元素移出
            // console.log("[s e xxx] -> s [e xxx]");
            assert(endNode.parent === commonUnderlineNode, "缩小的基准节点必须在下划线内")
            // constrain: underline must has chord at both begin and end
            assert(endNode.isChord() || endNode.isUnderline(), "缩小的基准节点应该是和弦或下划线（以保证下划线首尾都是和弦）")

            let anchorNodes = commonUnderlineNode.children.filter(n => n.isChord() || n.isUnderline())
            let baseNodeIndex = anchorNodes.indexOf(endNode)

            assert(endNode.isUnderline() || baseNodeIndex > 0, "头部缩小时，基准节点不应该是第一个和弦节点")
            let slicedNodes = commonUnderlineNode.children.slice(0, endNode.getSelfIndex())

            NodeUtils.removeFromParent(slicedNodes)
            NodeUtils.insertBefore(commonUnderlineNode, slicedNodes)
        } else {
            // 前后都有元素，需要从中间断开
            // console.log("[xxx s e yyy] -> [xxx s] [e yyy]");
            assert(commonUnderlineNode.isUnderline(), "要分裂的节点必须是下划线")
            assert(startNode.parent == commonUnderlineNode && endNode.parent == commonUnderlineNode, "起止节点都应该是下划线节点的子节点")

            if (startNode.getSelfIndex() > endNode.getSelfIndex()) {
                let temp = startNode
                startNode = endNode
                endNode = temp
            }

            let anchorNodes = commonUnderlineNode.children.filter(n => n.isChord() || n.isUnderline())
            let startNodeIndex = anchorNodes.indexOf(startNode)
            let endNodeIndex = anchorNodes.indexOf(endNode)
            assert(startNode.isUnderline() || startNodeIndex > 0, "分裂下划线时，起始节点不应该是第一个和弦节点，否则应该使用收缩下划线命令")
            assert(endNode.isUnderline() || endNodeIndex < anchorNodes.length - 1, "分裂下划线时，终止节点不应该是最后一个和弦节点，否则应该使用收缩下划线命令")

            let betweenNodes = NodeUtils.getSiblingBetween(startNode, endNode, false, false);

            let isPure = commonUnderlineNode.type == ENodeType.UnderlinePure
            let leftUnderline = NodeUtils.createUnderlineNode(isPure)
            let rightUnderline = NodeUtils.createUnderlineNode(isPure)

            NodeUtils.insertBefore(commonUnderlineNode, leftUnderline)
            NodeUtils.insertBefore(commonUnderlineNode, betweenNodes)
            NodeUtils.insertBefore(commonUnderlineNode, rightUnderline)
            NodeUtils.removeFromParent(commonUnderlineNode)

            NodeUtils.append(leftUnderline, commonUnderlineNode.children.slice(0, startNode.getSelfIndex() + 1))
            NodeUtils.append(rightUnderline, commonUnderlineNode.children.slice(endNode.getSelfIndex()))
        }

        this.addHistory()
    }

    removeAllUnderlineOfChord(node: SheetNode) {
        assert(node.isChord(), "输入应该是和弦节点")
        this.pauseHistory()
        try {
            while (node.parent.isUnderline()) {
                this.removeUnderlineOnChord(node)
            }
        }
        finally {
            this.resumeHistory(true)
        }
    }

    // 返回转换后的文本节点
    convertToText(node: SheetNode, removeEmptyNode: boolean): SheetNode {
        assert(node.isChord(), "仅和弦可以转换为文本")
        this.pauseHistory()

        try {
            this.removeAllUnderlineOfChord(node) // 删除和弦下划线

            let content = node.content
            if (NodeUtils.isPlaceholder(content)) { // 空和弦
                if (removeEmptyNode) { // 删除
                    this.remove(node)
                    return null
                }
                else { // 全部标记为空格
                    content = " "
                }
            }

            let textNode = NodeUtils.createTextNode(content)
            this.replace(node, textNode);
            return textNode
        }
        finally {
            this.resumeHistory(true)
        }
    }

    updateChord(node, chord : Chord) {
        node.chord = chord
        this.addHistory()
    }

    convertToChord(node, chord : Chord) {
        this.pauseHistory()
        try {
            if (NodeUtils.isChord(node)) {
                this.updateChord(node, chord);
                return node
            }
            else if (node.type == ENodeType.Text) {
                if (node.content.length > 1)
                    console.warn(`文本内容 ${node.content} 超出一个字符，不符合规范`);
                let chordNode = NodeUtils.createChordNode(node.content, chord)
                NodeUtils.replace(node, chordNode)
                return chordNode
            }
            else {
                throw "类型错误，无法转换该节点为和弦节点"
            }
        }
        finally {
            this.resumeHistory(true)
        }

    }

    private __assertBeginAndEnd(nodes) {
        // constrain: underline must has chord at both begin and end
        let beginNode = nodes[0]
        while (true) {
            if (beginNode.isChord()) break;
            else if (beginNode.isUnderline()) beginNode = beginNode.children[0]
            else throw "添加下划线时，首部的元素必须是和弦"
        }

        let endNode = nodes[nodes.length - 1]
        while (true) {
            if (endNode.isChord()) break;
            else if (endNode.isUnderline()) endNode = endNode.children[endNode.children.length - 1]
            else throw "添加下划线时，尾部的元素必须是和弦"
        }
    }

    switchChordType(node) {
        this.pauseHistory()
        try {
            if (node.type == ENodeType.Chord) { // 标注和弦转纯和弦
                // 如果没有下划线，直接转换
                if (!NodeUtils.isInUnderline(node)) node.type = ENodeType.ChordPure
                else {
                    // 获取最顶层的下划线
                    let cur = node
                    let topUnderline = null
                    while (cur) {
                        if (NodeUtils.isUnderline(cur)) topUnderline = cur;
                        cur = cur.parent
                    }

                    // 检查是否有非空文本存在
                    let hasNonEmptyTextNode = false
                    NodeUtils.traverseDFS(topUnderline, (n) => {
                        if (n.type == ENodeType.Text && n.content != " ")
                            hasNonEmptyTextNode = true;
                    })

                    // 如果有非空文本，则不能整体转为纯和弦，断开所有下划线并独立转为纯和弦
                    // TODO: 是否加一个选项让用户选择？
                    if (hasNonEmptyTextNode) {
                        this.removeAllUnderlineOfChord(node)
                        node.type = ENodeType.ChordPure
                    }
                    else { // 否则，underline转underlinepure，chord转chordpure
                        NodeUtils.traverseDFS(topUnderline, (n) => {
                            if (n.type == ENodeType.Chord)
                                n.type = ENodeType.ChordPure;
                            if (n.type == ENodeType.Underline)
                                n.type = ENodeType.UnderlinePure;
                        })
                    }
                }

            }
            else if (node.type == ENodeType.ChordPure) {
                // 如果没有下划线，直接转换
                if (!NodeUtils.isInUnderline(node)) node.type = ENodeType.Chord
                else { // 否则整体转换
                    // 获取最顶层的下划线
                    let cur = node
                    let topUnderline = null
                    while (cur) {
                        if (NodeUtils.isUnderline(cur)) topUnderline = cur;
                        cur = cur.parent
                    }

                    NodeUtils.traverseDFS(topUnderline, (n) => {
                        if (n.type == ENodeType.ChordPure)
                            n.type = ENodeType.Chord;
                        if (n.type == ENodeType.UnderlinePure)
                            n.type = ENodeType.Underline;
                    })
                }

            }
            else throw "节点类型错误"
        }
        finally {
            this.resumeHistory(true)
        }

    }

    setKey(newKey : Key, shiftChord : boolean) {
        let oldKey = this.meta.sheetKey
        if (newKey == oldKey) return;

        this.meta.sheetKey = newKey
        if (shiftChord) {
            let offset = Key.getOffset(oldKey, newKey)
            NodeUtils.traverseDFS(this.root, (node : SheetNode) => {
                if (NodeUtils.isChord(node)) {
                    node.chord = node.chord.shiftKey(offset);
                }
            });
        }
    }

    insert(node, type, insertBefore) {
        let newNodes = null
        switch (type) {
            case "text": {
                let text = prompt("插入文本", "请输入文本")
                if (!text) return;
                newNodes = NodeUtils.createTextNodes(text)
                break
            }
            case "space": {
                newNodes = NodeUtils.createTextNodes(" ")
                break
            }
            case "mark": {
                let text = prompt("插入标记", "请输入标记内容")
                if (!text) return;
                newNodes = NodeUtils.createMarkNode(text)
                break
            }
            case "newline": {
                newNodes = NodeUtils.createNewLineNode()
                break
            }
            default: {
                throw "插入节点类型有误：" + type
            }
        }

        // insert
        if (insertBefore)
            this.insertBefore(node, newNodes)
        else
            this.insertAfter(node, newNodes)
    }

    convertChordToText(node, removeEmptyNode = true): SheetNode[] {
        assert(node.isChord(), "node should be chord to convert to text")
        this.pauseHistory()
        try {
            this.removeAllUnderlineOfChord(node) // 删除和弦下划线

            let content = node.content
            if (NodeUtils.isPlaceholder(content)) { // 空和弦
                if (removeEmptyNode) { // 删除
                    NodeUtils.removeFromParent(node)
                    return null
                }
                else { // 全部标记为空格
                    content = " "
                }
            }

            let textNodes = NodeUtils.createTextNodes(content)
            NodeUtils.replace(node, textNodes);
            return textNodes
        }
        finally {
            this.resumeHistory(true)
        }
    }

    editContent(node) {
        if (!node) throw "节点为空"

        let newContent = prompt("编辑内容", node.content);
        if (!newContent) return;
        this.updateContent(node, newContent)
    }

    /** 对连接的文本节点统一编辑输入 */
    editTextWithNeighbor(node) {
        if (!node) throw "节点为空"

        let text = node.content
        let textNodes = [node]
        // 向前
        let cur = NodeUtils.prevSibling(node)
        while (cur) {
            if (cur.type != ENodeType.Text) break;
            textNodes.splice(0, 0, cur)
            text = cur.content + text
            cur = NodeUtils.prevSibling(cur)
        }

        // 向后
        cur = NodeUtils.nextSibling(node)
        while (cur) {
            if (cur.type != ENodeType.Text) break;
            textNodes.push(cur)
            text += cur.content
            cur = NodeUtils.nextSibling(cur)
        }

        let newText = prompt("编辑文本", text);

        NodeUtils.insertAfter(node, NodeUtils.createTextNodes(newText))
        NodeUtils.removeFromParent(textNodes)
    }
}