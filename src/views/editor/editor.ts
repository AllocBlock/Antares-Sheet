import { SheetNode } from "@/utils/sheetNode"
import { SheetEditCommand, SheetCommandPool } from "./editCommand"
import {
    SheetEditCommandInsert,
    SheetEditCommandRemove,
    SheetEditCommandUpdateContent
} from "./editCommandImplement"

export default class SheetEditor {
    commandPool : SheetCommandPool = new SheetCommandPool()

    canUndo(): boolean { return this.commandPool.canUndo() }
    canRedo(): boolean { return this.commandPool.canRedo() }
    undo(): void { this.commandPool.undo() }
    redo(): void { this.commandPool.redo() }

    /** 在目标后方插入节点，可以是数组 */
    insertAfter(node : SheetNode, data) {
        let cmdInsert = new SheetEditCommandInsert(node.parent, node.getSelfIndex() + 1, data, 0)
        this.commandPool.execute(cmdInsert)
    }

    /** 在目标前方插入节点，可以是数组 */
    insertBefore(node : SheetNode, data) {
        let cmdInsert = new SheetEditCommandInsert(node.parent, node.getSelfIndex(), data, 0)
        this.commandPool.execute(cmdInsert)
    }

    /** 更新节点的内容 */
    updateContent(node : SheetNode, content : string) {
        let cmd = new SheetEditCommandUpdateContent(node, content)
        this.commandPool.execute(cmd)
    }
}