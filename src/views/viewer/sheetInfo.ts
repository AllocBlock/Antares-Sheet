import { SheetNode, ENodeType } from "@/utils/sheetNode.js";

export default class SheetInfo {
    title: string;
    singer: string;
    by: string;
    originalKey: string;
    sheetKey: string;
    chords: string[];
    rhythms: string[];
    originalSheetKey: string;
    sheetTree: SheetNode;

    constructor(sheetRootNode: any = null) {
        if (sheetRootNode == null) {
            this.title = '';
            this.singer = '';
            this.by = '';
            this.originalKey = '';
            this.sheetKey = '';
            this.chords = [];
            this.rhythms = [];
            this.originalSheetKey = '';
            this.sheetTree = new SheetNode(ENodeType.Root);
        } else {
            this.title = sheetRootNode.title;
            this.singer = sheetRootNode.singer;
            this.by = sheetRootNode.by;
            this.originalKey = sheetRootNode.originalKey;
            this.sheetKey = sheetRootNode.sheetKey;
            this.chords = sheetRootNode.chords;
            this.rhythms = sheetRootNode.rhythms;
            this.originalSheetKey = sheetRootNode.sheetKey;
            this.sheetTree = sheetRootNode;
        }
    }
}
