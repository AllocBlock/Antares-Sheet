import { assert } from "./assert";

const RE_SPLIT_CHORD = /^(#?b?[A-Ga-g]#?b?)(m|aug|dim)?((maj|add|sus|[1-9])*)?$/

const CHORD_OPTION = {
    AccidentalAfterBaseNote: false
}

export enum EBaseNote {
    C = "C",
    D = "D",
    E = "E",
    F = "F",
    G = "G",
    A = "A",
    B = "B"
}

export function convertBaseNoteToIndex(baseNote: EBaseNote) {
    switch (baseNote) {
        case EBaseNote.C: return 0;
        case EBaseNote.D: return 2;
        case EBaseNote.E: return 4;
        case EBaseNote.F: return 5;
        case EBaseNote.G: return 7;
        case EBaseNote.A: return 9;
        case EBaseNote.B: return 11;
    }
    throw "无效的音符"
}

export enum EAccidental {
    None = "",
    Sharp = "#",
    Flat = "b"
}

const INDEX_2_BASE_NOTE_ACCIDENTAL = {
    0: [EBaseNote.C, EAccidental.None],
    1: [EBaseNote.C, EAccidental.Sharp],
    2: [EBaseNote.D, EAccidental.None],
    3: [EBaseNote.D, EAccidental.Sharp],
    4: [EBaseNote.E, EAccidental.None],
    5: [EBaseNote.F, EAccidental.None],
    6: [EBaseNote.F, EAccidental.Sharp],
    7: [EBaseNote.G, EAccidental.None],
    8: [EBaseNote.G, EAccidental.Sharp],
    9: [EBaseNote.A, EAccidental.None],
    10: [EBaseNote.A, EAccidental.Sharp],
    11: [EBaseNote.B, EAccidental.None],
}

function normalizeIndex(index: number) {
    while (index < 0) index += 12;
    index = index % 12
    return index
}

export class Key {
    _base: EBaseNote
    _accidental: EAccidental

    constructor(base: EBaseNote, accidental: EAccidental) {
        // TODO: add prefer chord alias, e.g. always use bB instead of #A
        this._base = base
        this._accidental = accidental
    }

    get base(): EBaseNote { return this._base; }
    get accidental(): EAccidental { return this._accidental; }

    static createFromIndex(index: number): Key {
        index = normalizeIndex(index)
        let [base, accidental] = INDEX_2_BASE_NOTE_ACCIDENTAL[index]
        return new Key(base, accidental)
    }

    static createFromString(keyStr: string): Key {
        let accidental = EAccidental.None;
        let hasSharp = false, hasFlat = false
        let res = keyStr.match(/#/g)
        if (res) {
            hasSharp = true;
            accidental = EAccidental.Sharp;
            if (res.length > 2) throw "和弦格式错误，不应有多个#";
        }
        res = keyStr.match(/b/g)
        if (res) {
            hasFlat = true;
            accidental = EAccidental.Flat;
            if (res.length > 2) throw "和弦格式错误，不应有多个b";
        }
        if (hasSharp && hasFlat) throw "和弦格式错误，不应同时拥有#和b";
        let baseNoteName = keyStr.replace(/[#b]/, "")
        if (EBaseNote[baseNoteName] === undefined) throw `和弦根音[${baseNoteName}]有误`;
        let baseNote = baseNoteName as EBaseNote
        assert(baseNote , "和弦有误，未找到根音")
        return new Key(baseNote, accidental)
    }

    // get offset from key1 to key2
    static getOffset(key1: Key, key2: Key) {
        return normalizeIndex(key2.getIndex() - key1.getIndex())
    }

    static isEqual(key1: Key, key2: Key) {
        return key1.getIndex() == key2.getIndex()
    }

    getPitchNames() { // 音名
        let baseNoteStr = this._base.toString()
        let accidentalStr = this._accidental.toString()
        if (CHORD_OPTION.AccidentalAfterBaseNote) {
            return baseNoteStr + accidentalStr
        }
        else {
            return accidentalStr + baseNoteStr
        }
    }

    getIndex() : number { // 十二平均律半音，范围[0,11]
        let index = convertBaseNoteToIndex(this._base)
        if (this._accidental == EAccidental.Sharp) index++;
        else if (this._accidental == EAccidental.Flat) index--;
        return index;
    }

    shift(offset: number): Key {
        return Key.createFromIndex(this.getIndex() + offset)
    }

    toString() {
        return this.getPitchNames()
    }
}

export enum EChordQuality {
    Major = "",
    Minor = "m",
    Diminished = "dim",
    Augmented = "aug"
}

// 目前仅支持部分和弦标注语法（流行音乐）
// https://viva.pressbooks.pub/openmusictheory/chapter/chord-symbols/
// 根音部分+性质（大小增减）+装饰音（挂、加）
export class Chord {
    root: Key
    quality: EChordQuality
    extension: string | null

    constructor(root: Key, quality: EChordQuality = EChordQuality.Major, extension: string = "") {
        this.root = root
        this.quality = quality
        this.extension = extension
    }

    static createFromString(chordNameStr: string): Chord {
        let res = chordNameStr.match(RE_SPLIT_CHORD)
        if (!res)
            throw "和弦格式有误：" + chordNameStr

        let rootName = res[1]
        let qualityStr = res[2] ?? ""
        let extensionStr = res[3] ?? ""

        let root = Key.createFromString(rootName)
        assert(root, "和弦有误，和弦性质有误")
        let quality = qualityStr as EChordQuality;

        return new Chord(root, quality, extensionStr)
    }

    static isChord(chordName) {
        try {
            Chord.createFromString(chordName);
            return true;
        }
        catch {
            return false;
        }
    }

    /**
     * 判断两个和弦是否本质相同
     * @param {string | Chord} chord1
     * @param {string | Chord} chord2
     */
    static isAlias(chord1: string | Chord, chord2: string | Chord): boolean {
        if (typeof chord1 === 'string') {
            if (!Chord.isChord(chord1)) return false;
            chord1 = Chord.createFromString(chord1)
        }
        if (typeof chord2 === 'string') {
            if (!Chord.isChord(chord2)) return false;
            chord2 = Chord.createFromString(chord2)
        }
        if (chord1.root.getIndex() != chord2.root.getIndex()) return false;
        if (chord1.quality != chord2.quality) return false;
        if (chord1.extension != chord2.extension) return false;
        return true;
    }

    shiftKey(offset: number): Chord {
        let newRoot = this.root.shift(offset)
        return new Chord(newRoot, this.quality, this.extension)
    }

    toString() {
        return this.root.getPitchNames() + this.quality + this.extension
    }
}

export class FretChordFinger {
    finger: string
    fret: number
    startString: number
    endString: number
}

const FINGER_NAMES = ["1", "2", "3", "4", "T"];

export class FretChord {
    chord: Chord
    stringNum: number = 0
    startFret: number = 0
    fretNum: number = 0
    rootString: number = null
    disabledStrings: number[] = []
    fingerings: FretChordFinger[] = []

    isValid(): boolean {
        if (!this.chord) {
            console.error("和弦为空");
            return false;
        }

        if (!this.stringNum) {
            console.error("和弦未指定弦数量");
            return false;
        }

        if (this.stringNum <= 0) {
            console.error(
                `和弦渲染：琴弦数量需要大于0，而当前的值为${this.stringNum}`
            );
            return false;
        }
        if (this.startFret <= 0) {
            if (this.startFret == 0)
                console.warn(`和弦渲染：起始品格不能为0，已自动修正为1`);
            else {
                console.error(
                    `和弦渲染：起始品格需要大于0，而当前的值为${this.startFret}`
                );
                return false;
            }
        }
        if (this.fretNum <= 0) {
            console.error(
                `和弦渲染：品格数需要大于0，而当前的值为${this.fretNum}`
            );
            return false;
        }
        if (
            this.rootString != null &&
            (this.rootString <= 0 || this.rootString > this.stringNum)
        ) {
            console.error(
                `和弦渲染：根音弦为null或取[1-${this.stringNum}]，而当前的值为${this.rootString}`
            );
            return false;
        }
        for (let disabledString of this.disabledStrings) {
            if (disabledString <= 0 || disabledString > this.stringNum) {
                console.error(
                    `和弦渲染：禁用弦的范围是[1-${this.stringNum}]，而存在禁用弦的值为${disabledString}`
                );
                return false;
            }
        }
        for (let fingering of this.fingerings) {
            // 指法检查
            let fingerIndex = FINGER_NAMES.findIndex(
                (f) => f == fingering.finger
            );
            if (fingerIndex < 0 || fingerIndex > FINGER_NAMES.length) {
                console.error(
                    `和弦渲染：指法存在错误，手指标号可选的值为`,
                    FINGER_NAMES,
                    `，而当前值为${fingering.finger}`
                );
                return false;
            }
            if (
                fingering.fret < this.startFret ||
                fingering.fret >= this.fretNum + this.startFret
            ) {
                console.error(
                    `和弦渲染：指法存在错误，品位标号的范围是[${this.startFret}-${this.startFret + this.fretNum
                    }]，而存在值为${fingering.fret}`
                );
                return false;
            }
            if (
                fingering.startString < 1 ||
                fingering.startString > this.stringNum
            ) {
                console.error(
                    `和弦渲染：指法存在错误，起始琴弦标号的范围是[1-${this.stringNum}]，而存在值为${fingering.startString}`
                );
                return false;
            }
            if (
                fingering.endString &&
                (fingering.startString > fingering.endString ||
                    fingering.endString > this.stringNum)
            ) {
                console.error(
                    `和弦渲染：指法存在错误，结束琴弦标号可以为null或取[${fingering.startString}（起始）-${this.stringNum}]，而存在值为${fingering.endString}`
                );
                return false;
            }
        }

        return true;
    }
}