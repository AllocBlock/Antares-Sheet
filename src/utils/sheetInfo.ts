import { SheetNode, ENodeType } from "@/utils/sheetNode";
import { toSheetFileString } from "@/utils/sheetWriter";

export class SheetMeta {
    title: string;
    singer: string;
    by: string;
    originalKey: string;
    sheetKey: string;
    chords: string[];
    rhythms: string[];
    extras: Map<string, string>;

    constructor() {
        this.reset()
    }

    update(key, value) {
        switch(key) {
            case "title": { this.title = value; break; }
            case "singer": { this.singer = value; break; }
            case "by": { this.by = value; break; }
            case "originalKey": { this.originalKey = value; break; }
            case "sheetKey": { this.sheetKey = value; break; }
            case "chords": { this.chords = value; break; }
            case "rhythms": { this.rhythms = value; break; }
            default: { this.extras.set(key, value); break; }
        }
    }

    reset() {
      this.title = "未命名"
      this.singer = ""
      this.by = "锦瑟"
      this.originalKey = "C"
      this.sheetKey = "C"
      this.chords = []
      this.rhythms = []
      this.extras = new Map()
    }
}

export class SheetInfo {
    meta: SheetMeta;
    root: SheetNode;

    constructor(meta : SheetMeta = null, root: SheetNode = null) {
        this.meta = meta ?? new SheetMeta()
        this.root = root ?? new SheetNode(ENodeType.Root);
    }

    toText(attachedChords : string[] = [], ignoreMeta = false) {
        return toSheetFileString(
          this.root,
          this.meta.title,
          this.meta.singer,
          this.meta.by,
          this.meta.originalKey,
          this.meta.sheetKey,
          attachedChords,
          ignoreMeta
        )
    }
}

export class SheetInfoRuntimeView extends SheetInfo {
    originalSheetKey: string;

    constructor(meta : SheetMeta = null, root: SheetNode = null) {
        super(meta, root)
        this.originalSheetKey = this.meta.originalKey
    }
}
