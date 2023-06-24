import { Chord, Key } from "./chord";

export default class SheetMeta {
    title: string;
    singer: string;
    by: string;
    originalKey: Key;
    sheetKey: Key;
    chords: Chord[];
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
            case "originalKey": { this.originalKey = Key.createFromString(value); break; }
            case "sheetKey": { this.sheetKey = Key.createFromString(value); break; }
            case "chords": {
                if (!value) this.chords = []
                else {
                    let chordNames = value
                    if (!Array.isArray(chordNames)) {
                        chordNames = [chordNames]
                    }
                    this.chords = chordNames.map(chordName => Chord.createFromString((chordName))); 
                }
                break; 
            }
            case "rhythms": { this.rhythms = value; break; }
            default: { this.extras.set(key, value); break; }
        }
    }

    reset() {
      this.title = "未命名"
      this.singer = ""
      this.by = "锦瑟"
      this.originalKey = Key.createFromString("C")
      this.sheetKey = Key.createFromString("C")
      this.chords = []
      this.rhythms = []
      this.extras = new Map()
    }
}