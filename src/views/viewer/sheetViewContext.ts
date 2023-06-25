import { Key } from "@/utils/chord";
import SheetMeta from "@/utils/sheetMeta"
import { SheetNode, NodeUtils } from "@/utils/sheetNode";

export default class SheetViewContext {
    meta: SheetMeta;
    root: SheetNode;
    originalSheetKey: Key;

    constructor(meta : SheetMeta = new SheetMeta(), root: SheetNode = NodeUtils.createRootNode()) {
        this.set(meta, root)
    }

    set(meta : SheetMeta = null, root: SheetNode = null) {
        this.meta = meta
        this.root = root
        this.originalSheetKey = this.meta.originalKey
    }
}