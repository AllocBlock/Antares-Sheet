import { NodeUtils } from "@/utils/sheetEdit";
import SheetMeta from "@/utils/sheetMeta"
import { SheetNode } from "@/utils/sheetNode";

export default class SheetViewContext {
    meta: SheetMeta;
    root: SheetNode;
    originalSheetKey: string;

    constructor(meta : SheetMeta = new SheetMeta(), root: SheetNode = NodeUtils.createRootNode()) {
        this.set(meta, root)
    }

    set(meta : SheetMeta = null, root: SheetNode = null) {
        this.meta = meta
        this.root = root
        this.originalSheetKey = this.meta.originalKey
    }
}