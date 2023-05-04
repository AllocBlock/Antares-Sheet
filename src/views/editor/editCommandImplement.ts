import { assert } from "@/utils/assert.js";
import { SheetEditCommand } from "./editCommand";
import { ENodeType, SheetNode } from "@/utils/sheetNode";
import { NodeUtils } from "@/utils/sheetEdit";

// TODO: insert after a chord node at end of underline break constrain, so need special handling 
export class SheetEditCommandInsert extends SheetEditCommand {
    node: SheetNode;
    index: number;
    toInsertNodes: SheetNode[];
    replaceNumber: number
    replacedNodes: SheetNode[];

    constructor(
        node: SheetNode,
        index: number,
        data: SheetNode | SheetNode[],
        replaceNumber: number = 0
    ) {
        super();
        this.node = node;
        if (index < 0) throw "索引错误";
        this.index = index;
        this.toInsertNodes = Array.isArray(data) ? data : [data];
        this.replaceNumber = replaceNumber
    }

    // FIXME: original parent info will lose
    _executeV(): void {
        for (let n of this.toInsertNodes)
            n.parent = this.node;
        this.replacedNodes = this.node.children.splice(this.index, this.replaceNumber, ...this.toInsertNodes);
    }

    _withdrawV(): void {
        for (let n of this.replacedNodes)
            n.parent = this.node;
        this.node.children.splice(this.index, this.toInsertNodes.length, ...this.replacedNodes);
    }
}

// TODO: removing chord maybe cause very complex tree structure changes, rely on other commands
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
        this.parent.children.splice(this.index, 1)
    }

    _withdrawV(): void {
        this.parent.children.splice(this.index, 0, this.node)
    }
}

export class SheetEditCommandUpdateContent extends SheetEditCommand {
    node: SheetNode;
    newContent: string;
    oldContent: string;
    insertCmd: SheetEditCommandInsert | null;

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
                    this.insertCmd = new SheetEditCommandInsert(this.node.parent, this.node.getSelfIndex() + 1, textNodes)
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