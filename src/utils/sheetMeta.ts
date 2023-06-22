import { SheetNode, ENodeType } from "@/utils/sheetNode";

export default class SheetMeta {
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