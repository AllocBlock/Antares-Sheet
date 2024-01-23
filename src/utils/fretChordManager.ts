/* 
 * 小科普，scale、key和mode的区别
 * scale=音阶，多个不同音调的音符的组合是一个音阶，任意一个音阶可以代表一个调式
 * key=调性，标记了主音（如C key标记了C为主音tonic)，主音也是自然音阶中的第一个音，是调性的中心音、终止音、最稳定的音。
 * mode=调式，如大调、小调、五声调式、中古调式等
 * key有时可以同时表示调性和调式，如C-major，G-minor
 */

/* 
 * 小科普，有关音级(scale degree)
 * 在一个调式中，每个音都对应了一个音级
 *  级    中文名称    英文名称            意思
 * 1/Ⅰ   主音        Tonic              音阶中最主要的音
 * 2/Ⅱ   上主音      Supertonic         主音之上
 * 3/Ⅲ   中音        Mediant            主音与属音的中间
 * 4/Ⅳ   下属音      Subdominant        属音之下
 * 5/Ⅴ   属音        Dominant           第二重要的音
 * 6/Ⅵ   下中音      Submediant         主音和下属音的中间
 * 7/Ⅶ   导音        Leading tone/note  导向主音的音
 * 使用音级可以方便地表示和弦，称为和弦音级。
 * 半音阶里每个音也有对应的名称，这里不做赘述。
 */

import { Chord, FretChord, FretChordFinger } from "@/utils/chord"

const CHORD_ARRAY_LIST = [
    // Major
    ["C", 4, 1, 3, null, [], [[3, 3, 1, null]]],
    ["#C", 4, 1, 4, null, [], [[1, 1, 1, 4], [4, 4, 1, null]]],
    ["bD", 4, 1, 4, null, [], [[1, 1, 1, 4], [4, 4, 1, null]]],
    ["D", 4, 1, 3, null, [], [[1, 2, 4, null], [2, 2, 3, null], [3, 2, 2, null]]],
    ["#D", 4, 1, 3, null, [], [[1, 1, 1, null], [2, 3, 3, null], [3, 3, 2, null]]],
    ["bE", 4, 1, 3, null, [], [[1, 1, 1, null], [2, 3, 3, null], [3, 3, 2, null]]],
    ["E", 4, 1, 4, null, [], [[1, 2, 1, null], [2, 4, 4, null], [3, 4, 3, null], [4, 4, 2, null]]],
    ["F", 4, 1, 3, null, [], [[1, 1, 2, null], [2, 2, 4, null]]],
    ["#F", 4, 1, 3, null, [], [[1, 1, 1, 4], [2, 2, 2, null], [3, 3, 4, null]]],
    ["bG", 4, 1, 3, null, [], [[1, 1, 1, 4], [2, 2, 2, null], [3, 3, 4, null]]],
    ["G", 4, 1, 3, null, [], [[1, 2, 3, null], [2, 2, 1, null], [3, 3, 2, null]]],
    ["#G", 4, 3, 3, null, [], [[1, 3, 1, 4], [2, 4, 2, null], [3, 5, 4, null]]],
    ["bA", 4, 3, 3, null, [], [[1, 3, 1, 4], [2, 4, 2, null], [3, 5, 4, null]]],
    ["A", 4, 1, 3, null, [], [[1, 1, 3, null], [2, 2, 4, null]]],
    ["#A", 4, 1, 3, null, [], [[1, 1, 1, 4], [2, 2, 3, null], [3, 3, 4, null]]],
    ["bB", 4, 1, 3, null, [], [[1, 1, 1, 4], [2, 2, 3, null], [3, 3, 4, null]]],
    ["B", 4, 1, 4, null, [], [[1, 2, 1, 4], [2, 3, 3, null], [3, 4, 4, null]]],

    // Minor
    ["Cm", 4, 1, 3, null, [], [[1, 3, 1, 3]]],
    ["#Cm", 4, 4, 3, null, [], [[1, 4, 1, 4], [3, 6, 4, null]]],
    ["bDm", 4, 4, 3, null, [], [[1, 4, 1, 4], [3, 6, 4, null]]],
    ["Dm", 4, 1, 3, null, [], [[1, 1, 2, null], [2, 2, 3, null], [3, 2, 4, null]]],
    ["#Dm", 4, 1, 3, null, [4], [[1, 1, 1, null], [2, 2, 2, null], [3, 3, 3, null]]],
    ["bEm", 4, 1, 3, null, [4], [[1, 1, 1, null], [2, 2, 2, null], [3, 3, 3, null]]],
    ["Em", 4, 1, 4, null, [], [[1, 2, 1, null], [2, 3, 2, null], [3, 4, 3, null]]],
    ["Fm", 4, 1, 3, null, [], [[1, 1, 4, null], [2, 1, 2, null], [4, 3, 1, null]]],
    ["#Fm", 4, 1, 3, null, [], [[1, 1, 3, null], [2, 2, 4, null], [3, 2, 2, null]]],
    ["bGm", 4, 1, 3, null, [], [[1, 1, 3, null], [2, 2, 4, null], [3, 2, 2, null]]],
    ["Gm", 4, 1, 3, null, [], [[1, 1, 1, null], [2, 2, 3, null], [3, 3, 2, null]]],
    ["#Gm", 4, 2, 3, null, [4], [[1, 2, 1, null], [2, 3, 3, null], [3, 4, 2, null]]],
    ["bAm", 4, 2, 3, null, [4], [[1, 2, 1, null], [2, 3, 3, null], [3, 4, 2, null]]],
    ["Am", 4, 1, 3, null, [], [[2, 2, 4, null]]],
    ["#Am", 4, 1, 3, null, [], [[1, 1, 1, 4], [2, 3, 4, null]]],
    ["bBm", 4, 1, 3, null, [], [[1, 1, 1, 4], [2, 3, 4, null]]],
    ["Bm", 4, 1, 4, null, [], [[1, 2, 1, 4], [2, 4, 4, null]]],

    // 部分7
    ["C7", 4, 1, 3, null, [], [[1, 1, 1, null]]],
    ["D7", 4, 1, 3, null, [], [[1, 2, 1, 4], [2, 3, 1, null]]],
    ["E7", 4, 1, 3, null, [], [[1, 1, 4, null], [2, 2, 3, null], [3, 2, 1, null]]],
    ["F7", 4, 1, 3, null, [], [[1, 1, 2, null], [2, 2, 4, null], [3, 3, 3, null], [4, 3, 1, null]]],
    ["G7", 4, 1, 3, null, [], [[1, 1, 2, null], [2, 2, 3, null], [3, 2, 1, null]]],
    ["A7", 4, 1, 3, null, [], [[1, 1, 3, null]]],
    ["B7", 4, 1, 3, null, [], [[1, 2, 1, 4], [2, 3, 3, null]]],

    // 部分sus4
    ["Csus4", 4, 1, 3, null, [], [[3, 3, 1, null], [1, 1, 2, null]]],
    ["Dsus4", 4, 1, 3, null, [], [[1, 2, 4, null], [2, 2, 3, null], [3, 3, 2, null]]],
    ["Esus4", 4, 2, 4, null, [], [[1, 2, 1, null], [2, 4, 4, null], [3, 4, 3, null], [4, 5, 2, null]]],
    ["Fsus4", 4, 1, 3, null, [], [[1, 1, 1, 2], [3, 3, 4, null]]],
    ["Gsus4", 4, 1, 3, null, [], [[1, 2, 3, null], [3, 3, 1, null], [2, 3, 2, null]]],
    ["Asus4", 4, 1, 3, null, [], [[2, 2, 4, null], [3, 2, 3, null]]],
    ["Bsus4", 4, 1, 4, null, [], [[1, 2, 1, 4], [3, 4, 4, null], [4, 4, 3, null]]],
]

function chordArrayToObject(chordArray): FretChord {
    let fretChord = new FretChord()
    fretChord.chord = Chord.createFromString(chordArray[0])
    fretChord.stringNum = chordArray[1]
    fretChord.startFret = chordArray[2]
    fretChord.fretNum = chordArray[3]
    fretChord.rootString = chordArray[4]
    fretChord.disabledStrings = chordArray[5]
    fretChord.fingerings = []
    for (let fingerArray of chordArray[6]) {
        let finger = new FretChordFinger()
        finger.finger = fingerArray[0]
        finger.fret = fingerArray[1]
        finger.startString = fingerArray[2]
        finger.endString = fingerArray[3]
        fretChord.fingerings.push(finger)
    }

    return fretChord
}

class FretChordManager {
    fretChords: FretChord[]
    map: Map<string, FretChord>

    constructor() {
        this.fretChords = []
        this.map = new Map()
        for (let chordArray of CHORD_ARRAY_LIST) {
            let fretChord = chordArrayToObject(chordArray)
            this.map.set(fretChord.chord.toString(), fretChord)
            this.fretChords.push(fretChord)
        }
    }

    getFretChord(chord : string | Chord, allowAlias: boolean = false) : FretChord {
        let name = chord instanceof Chord ? chord.toString() : chord
        if (this.map.has(name)) {
            return this.map.get(name)
        }
        else if (allowAlias) {
            for (let fretChord of this.fretChords) {
                if (Chord.isAlias(fretChord.chord, chord)) {
                    return fretChord;
                }
            }
        }

        return null
    }

    traverse(func) {
        this.fretChords.forEach(c => func(c))
    }
}

export default new FretChordManager()