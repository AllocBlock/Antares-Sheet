import { reactive } from "vue";
import { ENodeType, SheetNode, NodeUtils } from "@/utils/sheetNode";

/** 高亮节点 */
export function highlightNode(node : SheetNode) {
    // FIXME: style is not reactive for sometimes...there force a reactive style
    node.style = reactive(node.style)
    
    node.style.opacity = 0.5
    if (node.type == ENodeType.Text && NodeUtils.isPlaceholder(node.content)) {
        node.style.background = "var(--theme-color)"
    }
}

/** 取消高亮节点 */
export function unhighlightNode(node : SheetNode) {
    node.style.opacity = 1.0
    node.style.background = ''
}
