import { assert } from "./assert";

// 尤克里里、吉他节奏型
// 例子：
// -x---x---
// -x-x---x-
// --x-x-x-x
// -x-------
// == {(124)3231323}

class RhythmBeat {
    stringNumbers : number[]
    beatDivided: number

    constructor(strings : number[], beatDivided = 4) {
        this.beatDivided = beatDivided
        this.stringNumbers = strings
    }

    get duration() : number { return 4.0 / this.beatDivided }
}

const NoteList = ["1", "2", "3", "4", "5", "6", "x"]
function parseRhythmString(str : string) : RhythmBeat[] {
    // {} for subdivide
    // () for combined note
    let beats : RhythmBeat[] = []
    let divide = 4
    let i = 0
    while (i < str.length) {
        let c = str[i]
        if (NoteList.includes(c)) { // normal note
            let stringNumbers : number[] = []
            if (c != "x") stringNumbers.push(parseInt(c))
            beats.push(new RhythmBeat(stringNumbers, divide))
            i++;
        } else if (c == '{') { // subdivide
            divide *= 2
            i++;
        } else if (c == '}') { // unsubdivide
            divide /= 2
            assert(divide >= 4, "节奏型中的花括号不匹配")
            i++;
        } else if (c == '(') { // combined note
            let k = i + 1
            let stringNumbers : number[] = []
            while (true) {
                if (str[k] == ")") break;
                let stringNumber = parseInt(str[k])
                assert(!isNaN(stringNumber), `格式有误，()括号内不应出现${str[k]}`)
                stringNumbers.push(stringNumber)
                k++;
            }
            assert(stringNumbers.length > 0, `格式有误，()括号内为空`)
            i = k + 1;
            beats.push(new RhythmBeat(stringNumbers, divide))
        } else {
            throw new Error(`格式有误，括号内不应出现${c}`)
        }
    }
    assert(divide == 4, "节奏型中的花括号不匹配")
    return beats
}

export class Rhythm {
    beats : RhythmBeat[]
    constructor(beats : RhythmBeat[]) {
        this.beats = beats
    }

    get duration() : number {
        return this.beats.map(b => b.duration).reduce((sum, cur) => sum + cur)
    }

    static createFromString(str : string) {   
        return new Rhythm(parseRhythmString(str))
    }

    getString() : string {
        let curSubdivide = 4
        let rhythmString = ''
        for (let beat of this.beats) {
            while (beat.beatDivided > curSubdivide) {
                curSubdivide *= 2
                rhythmString += "{"
            }
            while (beat.beatDivided < curSubdivide) {
                curSubdivide /= 2
                rhythmString += "}"
            }
            if (beat.stringNumbers.length == 0)  rhythmString += "x"
            else if (beat.stringNumbers.length == 1)  rhythmString += beat.stringNumbers[0]
            else rhythmString += "(" + beat.stringNumbers.join("") + ")"
        }
        
        while (4 < curSubdivide) {
            curSubdivide /= 2
            rhythmString += "}"
        }
        return rhythmString
    }
}