import { assert } from "@/utils/assert.js";
import { SheetEditCommand } from "./editCommand";
import { ENodeType, SheetNode } from "@/utils/sheetNode";
import { NodeUtils } from "@/utils/sheetEdit";

/**
 * All commands are typically modification on a tree with some constrains 
 */

export class SheetEditCommandInsertAfter extends SheetEditCommand {
    node: SheetNode;
    toInsertNodes: SheetNode[];

    constructor(
        node: SheetNode,
        data: SheetNode | SheetNode[]
    ) {
        super();

        // constrain: underline node should have chord node at both begin and end
        // to void this, these inserted node will be inserted after the underline
        let targetNode = node
        while (targetNode.nextSibling() == null && NodeUtils.isUnderline(targetNode.parent)) { 
            targetNode = targetNode.parent
        }

        this.node = targetNode;
        this.toInsertNodes = Array.isArray(data) ? data : [data];
    }

    // FIXME: original parent info will lose
    _executeV(): void {
        for (let n of this.toInsertNodes)
            n.parent = this.node.parent;
        let index = this.node.getSelfIndex() + 1
        this.node.parent.children.splice(index, 0, ...this.toInsertNodes);
    }

    _withdrawV(): void {
        let index = this.node.getSelfIndex() + 1
        this.node.parent.children.splice(index, this.toInsertNodes.length);
    }
}

export class SheetEditCommandInsertBefore extends SheetEditCommand {
    node: SheetNode;
    toInsertNodes: SheetNode[];

    constructor(
        node: SheetNode,
        data: SheetNode | SheetNode[]
    ) {
        super();

        // constrain: underline node should have chord node at both begin and end
        // to void this, these inserted node will be inserted before the underline
        let targetNode = node
        while (targetNode.prevSibling() == null && NodeUtils.isUnderline(targetNode.parent)) { 
            targetNode = targetNode.parent
        }

        this.node = targetNode;
        this.toInsertNodes = Array.isArray(data) ? data : [data];
    }

    // FIXME: original parent info will lose
    _executeV(): void {
        for (let n of this.toInsertNodes)
            n.parent = this.node.parent;
        let index = this.node.getSelfIndex()
        this.node.parent.children.splice(index, 0, ...this.toInsertNodes);
    }

    _withdrawV(): void {
        let index = this.node.getSelfIndex()
        this.node.parent.children.splice(index - this.toInsertNodes.length, this.toInsertNodes.length);
    }
}

export class SheetEditCommandRemoveUnderline extends SheetEditCommand {
    node: SheetNode;
    children: SheetNode[];

    constructor(node: SheetNode) {
        super();
        assert(node.isUnderline(), `本命令只能用于下划线节点`)
        this.node = node;
        this.children = node.children;
    }

    _executeV(): void {
        NodeUtils.replace(this.node, this.children)
    }

    _withdrawV(): void {
        NodeUtils.insertBefore(this.children[0], this.node)
        NodeUtils.removeFromParent(this.children)
        NodeUtils.setParent(this.children, this.node)
    }
}

export class SheetEditCommandAddUnderline extends SheetEditCommand {
    nodes: SheetNode[];

    underlineNode: SheetNode;
    index: number;

    constructor(startNode: SheetNode, endNode: SheetNode) {
        super();
        assert(startNode.parent === endNode.parent, "要添加下划线的节点需要位于同一层级")
        this.nodes = NodeUtils.getSiblingBetween(startNode, endNode, true, true);
        assert(this.nodes.length >= 2, `未知错误：中间节点的数量有误，应大于2，但现在是${this.nodes.length}`)

        this.__assertBeginAndEnd();

        // constrain: chord and pure chord should not be in same underline
        let hasChord = false;
        let hasPureChord = false;
        NodeUtils.traverseForward(startNode, false, function(n) {
            hasChord = hasChord || (n.type == ENodeType.Chord)
            hasPureChord = hasPureChord ||(n.type == ENodeType.ChordPure)

            if (n === endNode) return true;
        })

        assert(!(hasChord && hasPureChord), "下划线内不能同时包含标注和弦和纯和弦")
        this.underlineNode = NodeUtils.createUnderlineNode(hasPureChord)
    }

    _executeV(): void {
        NodeUtils.insertBefore(this.nodes[0], this.underlineNode)
        NodeUtils.removeFromParent(this.nodes)
        NodeUtils.append(this.underlineNode, this.nodes)
    }

    _withdrawV(): void {
        NodeUtils.removeFromParent(this.nodes)
        NodeUtils.replace(this.underlineNode, this.nodes)
    }

    __assertBeginAndEnd() {
        // constrain: underline must has chord at both begin and end
        let beginNode = this.nodes[0]
        while(true) {
            if (beginNode.isChord()) break;
            else if (beginNode.isUnderline()) beginNode = beginNode.children[0]
            else throw "添加下划线时，首部的元素必须是和弦"
        }

        let endNode = this.nodes[this.nodes.length - 1]
        while(true) {
            if (endNode.isChord()) break;
            else if (endNode.isUnderline()) endNode = endNode.children[endNode.children.length - 1]
            else throw "添加下划线时，尾部的元素必须是和弦"
        }
    }
}

// extend underline to contain boundary node (includes node between them)
export class SheetEditCommandExtendUnderline extends SheetEditCommand {
    underlineNode: SheetNode;
    nodes: SheetNode[];

    isAfterUnderline: boolean;
    index: number;

    constructor(underlineNode: SheetNode, extendBoundaryNode: SheetNode) {
        super();
        assert(underlineNode !== extendBoundaryNode, "边界节点不能是下划线自己")
        assert(underlineNode.parent === extendBoundaryNode.parent, "要扩展到下划线的节点需要位于同一层级")
        // constrain: underline must has chord at both begin and end
        assert(extendBoundaryNode.isChord(), "扩展下划线时，首/尾部的元素必须是和弦")

        this.underlineNode = underlineNode
        this.isAfterUnderline = underlineNode.getSelfIndex() < extendBoundaryNode.getSelfIndex()
        
        let startNode = this.isAfterUnderline ? underlineNode : extendBoundaryNode
        let endNode = this.isAfterUnderline ? extendBoundaryNode : underlineNode

        this.nodes = NodeUtils.getSiblingBetween(startNode, endNode, !this.isAfterUnderline, this.isAfterUnderline);
    }

    _executeV(): void {
        NodeUtils.removeFromParent(this.nodes)
        if (this.isAfterUnderline)
            NodeUtils.append(this.underlineNode, this.nodes)
        else
            NodeUtils.prepend(this.underlineNode, this.nodes)
    }

    _withdrawV(): void {
        NodeUtils.removeFromParent(this.nodes)
        if (this.isAfterUnderline)
            NodeUtils.insertAfter(this.underlineNode, this.nodes)
        else
            NodeUtils.insertBefore(this.underlineNode, this.nodes)
    }
}

// merge two underline with the nodes between them
export class SheetEditCommandMergeUnderline extends SheetEditCommand {
    startNode: SheetNode;
    endNode: SheetNode;
    betweenNodes: SheetNode[];

    mergedNode: SheetNode;

    constructor(startNode: SheetNode, endNode: SheetNode) {
        super();
        assert(startNode.isUnderline() && endNode.isUnderline(), "要合并的节点必须是下划线")
        assert(startNode !== endNode, "不能与自己合并")
        assert(startNode.parent === endNode.parent, "要合并的两个下划线需要位于同一层级")
        assert(startNode.type == endNode.type, "要合并的下划线的类型应相同")

        if (startNode.getSelfIndex() > endNode.getSelfIndex()) {
            let temp = startNode
            startNode = endNode
            endNode = temp
        }

        this.startNode = startNode
        this.endNode = endNode
        this.betweenNodes = NodeUtils.getSiblingBetween(startNode, endNode, false, false);

        this.mergedNode = NodeUtils.createUnderlineNode(this.startNode.type == ENodeType.UnderlinePure)
    }

    _executeV(): void {
        NodeUtils.removeFromParent(this.betweenNodes)

        NodeUtils.append(this.mergedNode, this.startNode.children)
        NodeUtils.append(this.mergedNode, this.betweenNodes)
        NodeUtils.append(this.mergedNode, this.endNode.children)

        NodeUtils.removeFromParent(this.endNode)
        NodeUtils.replace(this.startNode, this.mergedNode)
    }

    _withdrawV(): void {
        NodeUtils.setParent(this.startNode.children, this.startNode)
        NodeUtils.setParent(this.endNode.children, this.endNode)

        let nodes = [this.startNode, ...this.betweenNodes, this.endNode]
        NodeUtils.replace(this.mergedNode, nodes)
    }
}


// shrink underline to exclude boundary node (includes node between them)
export class SheetEditCommandShrinkUnderline extends SheetEditCommand {
    underlineNode: SheetNode;
    shrinkBaseNode: SheetNode;

    excludeAfterNodes: boolean;
    nodes: SheetNode[];

    // shrinkBaseNode is the base of shrinking, all node after/before (self not includes) will be excluded from underline
    constructor(underlineNode: SheetNode, shrinkBaseNode: SheetNode, excludeAfterNodes : boolean) {
        super();
        assert(shrinkBaseNode.parent === underlineNode, "缩小的基准节点必须在下划线内")
        // constrain: underline must has chord at both begin and end
        assert(shrinkBaseNode.isChord() || shrinkBaseNode.isUnderline(), "缩小的基准节点应该是和弦或下划线（以保证下划线首尾都是和弦）")

        this.underlineNode = underlineNode
        this.shrinkBaseNode = shrinkBaseNode
        this.excludeAfterNodes = excludeAfterNodes

        let anchorNodes = underlineNode.children.filter(n => n.isChord() || n.isUnderline())
        let baseNodeIndex = anchorNodes.indexOf(shrinkBaseNode)
        if (excludeAfterNodes) {
            assert(shrinkBaseNode.isUnderline() || baseNodeIndex < anchorNodes.length - 1, "尾部缩小时，基准节点不应该是最后一个和弦节点")
            this.nodes = underlineNode.children.slice(shrinkBaseNode.getSelfIndex() + 1)
        }
        else {
            assert(shrinkBaseNode.isUnderline() ||baseNodeIndex > 0, "头部缩小时，基准节点不应该是第一个和弦节点")
            this.nodes = underlineNode.children.slice(0, shrinkBaseNode.getSelfIndex())
        }
    }

    _executeV(): void {
        NodeUtils.removeFromParent(this.nodes)
        if (this.excludeAfterNodes)
            NodeUtils.insertAfter(this.underlineNode, this.nodes)
        else
            NodeUtils.insertBefore(this.underlineNode, this.nodes)
    }

    _withdrawV(): void {
        NodeUtils.removeFromParent(this.nodes)
        if (this.excludeAfterNodes)
            NodeUtils.append(this.underlineNode, this.nodes)
        else
            NodeUtils.prepend(this.underlineNode, this.nodes)
    }
}

// split a sequence of children in underline, break two 3 parts: first underline, the split sequence of children, second underline
export class SheetEditCommandSplitUnderline extends SheetEditCommand {
    underlineNode: SheetNode;
    startNode: SheetNode;
    endNode: SheetNode;
    betweenNodes: SheetNode[];

    leftUnderline: SheetNode;
    rightUnderline: SheetNode;

    constructor(underlineNode: SheetNode, startNode: SheetNode, endNode: SheetNode) {
        super();
        assert(underlineNode.isUnderline(), "要分裂的节点必须是下划线")
        assert(startNode.parent == underlineNode && endNode.parent == underlineNode, "起止节点都应该是下划线节点的子节点")

        if (startNode.getSelfIndex() > endNode.getSelfIndex()) {
            let temp = startNode
            startNode = endNode
            endNode = temp
        }

        let anchorNodes = underlineNode.children.filter(n => n.isChord() || n.isUnderline())
        let startNodeIndex = anchorNodes.indexOf(startNode)
        let endNodeIndex = anchorNodes.indexOf(endNode)
        assert(startNode.isUnderline() || startNodeIndex > 0, "分裂下划线时，起始节点不应该是第一个和弦节点，否则应该使用收缩下划线命令")
        assert(endNode.isUnderline() || endNodeIndex < anchorNodes.length - 1, "分裂下划线时，终止节点不应该是最后一个和弦节点，否则应该使用收缩下划线命令")

        this.underlineNode = underlineNode
        this.startNode = startNode
        this.endNode = endNode
        this.betweenNodes = NodeUtils.getSiblingBetween(startNode, endNode, false, false);
    }

    _executeV(): void {
        let isPure = this.underlineNode.type == ENodeType.UnderlinePure
        this.leftUnderline = NodeUtils.createUnderlineNode(isPure)
        this.rightUnderline = NodeUtils.createUnderlineNode(isPure)

        NodeUtils.insertBefore(this.underlineNode, this.leftUnderline)
        NodeUtils.insertBefore(this.underlineNode, this.betweenNodes)
        NodeUtils.insertBefore(this.underlineNode, this.rightUnderline)
        NodeUtils.removeFromParent(this.underlineNode)

        NodeUtils.append(this.leftUnderline, this.underlineNode.children.slice(0, this.startNode.getSelfIndex() + 1))
        NodeUtils.append(this.rightUnderline, this.underlineNode.children.slice(this.endNode.getSelfIndex()))
    }

    _withdrawV(): void {
        NodeUtils.removeFromParent(this.betweenNodes)

        NodeUtils.setParent(this.underlineNode.children, this.underlineNode)

        NodeUtils.insertBefore(this.leftUnderline, this.underlineNode)
        NodeUtils.removeFromParent(this.leftUnderline)
        NodeUtils.removeFromParent(this.rightUnderline)
    }
}

// TODO: removing chord maybe cause very complex tree structure changes, rely on other commands
// constrain: underline node should have chord node at both begin and end
// to void this, when remove this kind of chord node, its underline will be removed, too
export class SheetEditCommandRemove extends SheetEditCommand {
    node: SheetNode;
    parent: SheetNode;
    index: number;

    constructor(node: SheetNode) {
        super();
        this.node = node;
        assert(node.parent, "Can not remove root node")
        this.parent = node.parent;
        this.index = node.getSelfIndex();
    }

    _executeV(): void {
        NodeUtils.removeFromParent(this.node)
    }

    _withdrawV(): void {
        NodeUtils.insert(this.parent, this.index, this.node)
    }
}

export class SheetEditCommandUpdateContent extends SheetEditCommand {
    node: SheetNode;
    newContent: string;
    oldContent: string;
    insertCmd: SheetEditCommandInsertAfter | null;

    constructor(node: SheetNode, newContent: string) {
        super();
        assert([ENodeType.Text, ENodeType.Chord, ENodeType.Mark].includes(node.type), `不能编辑${node.type}节点的内容`)
        this.node = node;
        assert(newContent.length > 0, "新内容不能为空")
        this.newContent = newContent;
        if (node.type == ENodeType.Text || node.type == ENodeType.Chord)
            assert(node.content.length == 1, "文本/和弦节点的原始内容应该为单个字符")
        this.oldContent = node.content;
        this.insertCmd = null;
    }

    _executeV(): void {
        switch (this.node.type) {
            case ENodeType.Text:
            case ENodeType.Chord: { // text node and chord node's content can only be one char
                this.node.content = this.newContent[0]
                let remaining = this.newContent.slice(1)
                if (remaining.length > 0) {
                    let textNodes = NodeUtils.createTextNodes(remaining)
                    this.insertCmd = new SheetEditCommandInsertAfter(this.node, textNodes)
                    this.insertCmd.execute()
                }
                break;
            }
            case ENodeType.Mark: {
                this.node.content = this.newContent
                break;
            }
            default: {
                console.warn("无法编辑该节点的内容", this.node);
                break;
            }
        }
    }

    _withdrawV(): void {
        this.node.content = this.oldContent // TIPS: old content is suppose to be valid, so just replace with it 
        if (this.insertCmd) {
            this.insertCmd.withdraw()
        }
        this.insertCmd = null;
    }
}

// Warning: unsafe command, make sure contrain is not break when use this
export class SheetEditCommandReplaceNode extends SheetEditCommand {
    node: SheetNode;
    newNode: SheetNode;

    constructor(node: SheetNode, newNode: SheetNode) {
        super();
        this.node = node
        this.newNode = newNode
    }

    _executeV(): void {
        NodeUtils.replace(this.node, this.newNode)
    }

    _withdrawV(): void {
        NodeUtils.replace(this.newNode, this.node)
    }
}