import { Chord, Key } from "./chord";

export default class SheetMeta {
    title: string;
    singer: string;
    by: string;
    originalKey: Key;
    sheetKey: Key;
    capo: number;
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
            case "capo": { this.capo = parseInt(value); break; }
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
            case "rhythms": { 
                this.rhythms = []
                // TODO: add rhythm support
                break;
            }
            default: { this.extras.set(key, value); break; }
        }
    }

    assign(meta : SheetMeta) {
        console.log(meta)
        this.title = meta.title
        this.singer = meta.singer
        this.by = meta.by
        this.originalKey = meta.originalKey
        this.sheetKey = meta.sheetKey
        this.capo = meta.capo
        this.chords = meta.chords.map(c => c)
        this.rhythms = meta.rhythms.map(c => c)
        this.extras = new Map(meta.extras)
    }

    reset() {
      this.title = "未命名"
      this.singer = ""
      this.by = "锦瑟"
      this.originalKey = Key.createFromString("C")
      this.sheetKey = Key.createFromString("C")
      this.capo = 0
      this.chords = []
      this.rhythms = []
      this.extras = new Map()
    }
}