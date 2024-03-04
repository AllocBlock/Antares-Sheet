import { loadFileBuffer } from "@/utils/audio"
import { assert } from "@/utils/assert";
import { FretChord, Key } from "./chord";
import { LoadCallback } from "./common";
import { Rhythm } from "./rhythm";

const gStandardFrequencyA = 440
export class Note {
    key: Key
    octave: number

    constructor(key : Key | string, octave : number) {
        if (typeof(key) == "string") {
            key = Key.createFromString(key)
        }
        this.key = key
        this.octave = octave
    }

    getIndex() {
        let index = this.key.getIndex() + this.octave * 12
    
        if (isNaN(index)) throw "未知错误：匹配音调失败";
    
        return index
    }

    getFrequency() {
        let absIndexA = new Note("A", 4).getIndex()
        let curIndex = this.getIndex()
        let offset = curIndex - absIndexA
    
        let frequency = gStandardFrequencyA * Math.pow(2, 1 / 12 * offset)
        return frequency
    }

    static createFromIndex(index) : Note {
        let remainIndex = index % 12
        let octave = Math.floor(index / 12)
        let key = Key.createFromIndex(remainIndex)
        return new Note(key, octave)
    }
}

const gResourceDir = "/resources"

const gAudioSourceLibrary = [
    {
        name: "Ukulele",
        audioStartNote: new Note("C", 4),
        dir: gResourceDir + "/sounds/ukulele/",
        maxId: 24,
    }
]

/**
 * 有调音源
 * 提供播放指定音调的能力
 * */
abstract class PitchedAudioSource {
    audioContext: AudioContext
    loaded: boolean
    curId: number
    playingNodes: Map<number, [AudioScheduledSourceNode, GainNode]>

    constructor(audioContext) {
        this.audioContext = audioContext
        this.loaded = false
        this.curId = 1
        this.playingNodes = new Map()
    }

    protected abstract getSourceNodeWithDuration(note : Note) : [AudioScheduledSourceNode, number];
    protected abstract setupGainNode(gainNode : GainNode, volume : number, delay : number, duration : number);
    protected abstract load(callbacks: LoadCallback);

    playNote(note : Note, volume = 0.5, delay = 0.0) {
        let [sourceNode, duration] = this.getSourceNodeWithDuration(note)

        let gainNode = this.audioContext.createGain()
        gainNode.connect(this.audioContext.destination)
        this.setupGainNode(gainNode, volume, delay, duration)

        sourceNode.connect(gainNode)
        sourceNode.start(this.audioContext.currentTime + delay)
        sourceNode.stop(this.audioContext.currentTime + delay + duration)

        let id = this.curId++
        this.playingNodes.set(id, [sourceNode, gainNode])
        return id
    }

    stopNote(id) {
        assert(this.playingNodes.has(id), `note id ${id} not found`)
        let [sourceNode, gainNode] = this.playingNodes.get(id)
        const fadeOutTime = 0.2;
        gainNode.gain.cancelScheduledValues(this.audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.0, this.audioContext.currentTime + fadeOutTime)
        sourceNode.stop(this.audioContext.currentTime + fadeOutTime)
        this.playingNodes.delete(id)
    }
}

const gOscillatorDuration = 2
export class Oscillator extends PitchedAudioSource {
    duration: number

    getSourceNodeWithDuration(note : Note) : [AudioScheduledSourceNode, number] {
        let oscillator = this.audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = note.getFrequency(); // value in hertz
        return [oscillator, this.duration]
    }
    
    setupGainNode(gainNode : GainNode, volume : number, delay : number, duration : number) {
        const fadeInTime = 0.01

        gainNode.gain.value = 0
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + delay + fadeInTime)
        gainNode.gain.linearRampToValueAtTime(0.0, this.audioContext.currentTime + delay + duration)
    }

    load(callbacks: LoadCallback = {}) {
        if (callbacks.onLoadStart) callbacks.onLoadStart()

        this.duration = gOscillatorDuration
        this.loaded = true

        if (callbacks.onLoadProgress) callbacks.onLoadProgress(1.0);
        if (callbacks.onLoaded) callbacks.onLoaded();
        console.log("振荡器音源配置完成")
        return this
    }
}

class PitchedAudioSourceSample extends PitchedAudioSource {
    fileList: string[]
    basicNote: Note
    audioBuffers: AudioBuffer[]

    constructor(audioContext, fileList: string[], basicNote: Note) {
        super(audioContext)
        this.fileList = fileList
        this.basicNote = basicNote
    }

    getSourceNodeWithDuration(note : Note) : [AudioScheduledSourceNode, number] {
        let noteIndex = note.getIndex()
        let basicIndex = this.basicNote.getIndex()
        let audioBufferIndex = noteIndex - basicIndex
        if (audioBufferIndex < 0 || audioBufferIndex > this.audioBuffers.length)
            throw "音调超出音源覆盖范围"
        let audioBuffer = this.audioBuffers[audioBufferIndex]

        let source = this.audioContext.createBufferSource()
        source.buffer = audioBuffer
        source.loop = false
        return [source, audioBuffer.duration]
    }
    
    setupGainNode(gainNode : GainNode, volume : number, delay : number, duration : number) {
        const fadeInTime = 0.01
        const fadeOutTime = duration * 0.1
        gainNode.gain.value = 0
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + delay + fadeInTime)
        gainNode.gain.setValueCurveAtTime([volume, 0.0], this.audioContext.currentTime + delay + duration - fadeOutTime, fadeOutTime)
    }

    load(callbacks: LoadCallback = {}) {
        if (callbacks.onLoadStart) callbacks.onLoadStart()
        if (!this.fileList) {
            let errMsg = "音频文件列表为空";
            if (callbacks.onFailed) callbacks.onFailed(errMsg);
            throw errMsg;
        }

        this.audioBuffers = []
        return new Promise((resolve, reject) => {
            let audioNum = this.fileList.length
            let loadedAudioNum = 0

            for (let i = 0; i < this.fileList.length; ++i) {
                loadFileBuffer(this.fileList[i]).then((buffer) => {
                    this.audioContext.decodeAudioData(buffer, (audioBuffer) => {
                        loadedAudioNum++
                        this.audioBuffers[i] = audioBuffer
                        if (callbacks.onLoadProgress) callbacks.onLoadProgress(loadedAudioNum / audioNum);

                        if (audioNum == loadedAudioNum) {
                            console.log("%c乐器音源加载完成", "color: green")
                            this.loaded = true
                            if (callbacks.onLoaded) callbacks.onLoaded();
                            resolve(null)
                        }
                    }, (error) => {
                        let errMsg = "解码音频失败：" + error;
                        if (callbacks.onFailed) callbacks.onFailed(errMsg);
                        throw errMsg;
                    })
                })
            }
        })
    }
}

export class UkuleleSample extends PitchedAudioSourceSample {
    constructor(audioContext) {
        let audioSourceInfo = gAudioSourceLibrary.find(e => e.name == "Ukulele")
        if (!audioSourceInfo) {
            throw `未找到尤克里里音源`;
        }
        let fileList = []
        for (let i = 0; i <= audioSourceInfo.maxId; ++i) {
            fileList.push(audioSourceInfo.dir + i + ".mp3")
        }
        super(audioContext, fileList, audioSourceInfo.audioStartNote)
    }
}

/**
 * 弦乐器，如尤克里里、吉他
 * 提供各种弹奏接口，需要指定音源
 * */
export class StringInstrument {
    audioSource : PitchedAudioSource
    stringBasicNotes : Note[]
    stringNum: number
    capo: number
    playingIds: Map<number, number[]>

    constructor(audioSource : PitchedAudioSource, stringBasicNotes : Note[]) {
        this.audioSource = audioSource
        this.stringBasicNotes = stringBasicNotes
        this.stringNum = stringBasicNotes.length
        this.playingIds = new Map<number, number[]>
        for (let i = 1; i <= this.stringNum; ++i) {
            this.playingIds[i] = []
        }
        this.capo = 0
    }

    isReady() {
        return this.audioSource.loaded
    }

    setCapo(capo) {
        capo = parseInt(capo)
        if (isNaN(capo) || capo < 0) throw "无效的变调夹位置"
        this.capo = capo
    }

    getCapo() {
        return this.capo
    }

    doesChordMatch(chord) {
        if (!chord.stringNum) return false
        if (chord.stringNum != this.stringNum) return false
        return true
    }

    getFretsOfChord(chord) : number[] {
        assert(this.doesChordMatch(chord), "和弦有误或与本乐器不匹配")

        let stringNum = chord.stringNum
        let fingerings = chord.fingerings
        let disabledStrings = chord.disabledStrings

        let frets = []
        for (let i = 0; i < stringNum; ++i) // 填0
            frets.push(0)

        for (let fingering of fingerings) { // 根据指法找到品位
            let fret = fingering.fret
            let startString = fingering.startString
            let endString = fingering.endString ? fingering.endString : startString

            for (let i = startString - 1; i <= endString - 1; ++i) {
                frets[i] = Math.max(frets[i], fret)
            }
        }

        for (let disabledString of disabledStrings) { // 禁用弦不弹
            frets[disabledString - 1] = null
        }

        return frets
    }

    getFretOfStringOfChord(chord, string) {
        assert(this.doesChordMatch(chord), "和弦有误或与本乐器不匹配")

        if (chord.disabledStrings.includes(string)) // 禁用弦不弹
            return null;

        let resFret = 0

        for (let fingering of chord.fingerings) { // 根据指法找到品位
            let fret = fingering.fret
            let startString = fingering.startString
            let endString = fingering.endString ? fingering.endString : startString

            if (startString <= string && string <= endString)
                resFret = Math.max(fret, fret)
        }

        return resFret
    }

    playString(string, fret, volume, delay) {
        assert(this.isReady(), "音源还未加载完成")
        let stringBasicNoteIndex = this.stringBasicNotes[string - 1].getIndex()
        let noteIndex = stringBasicNoteIndex + fret + this.capo
        let note = Note.createFromIndex(noteIndex)

        this.playingIds[string].push(this.audioSource.playNote(note, volume / this.stringNum, delay))
    }

    stop() {
        for (let i = 1; i <= this.stringNum; i++) {
            this.stopString(i)
        }
    }

    stopString(string) {
        for(let id of this.playingIds[string]) {
            this.audioSource.stopNote(id)
        }
        this.playingIds[string] = []
    }

    playFingering(frets, volume, duration) {
        assert(this.isReady(), "音源还未加载完成")
        this.stop()

        for (let i = 0; i < this.stringNum; i++) {
            if (frets[i] == null) continue;
            this.playString(i + 1, frets[i], volume, duration * i / this.stringNum)
        }
    }

    playChord(chord : FretChord, volume, duration : number, rhythm : Rhythm = null) {
        assert(this.isReady(), "音源还未加载完成")
        let frets = this.getFretsOfChord(chord)
        if (rhythm == null) {
            this.playFingering(frets, volume, duration)
        } else {
            let curTime = 0
            for (let beat of rhythm.beats) {
                let beatDuration = (beat.duration / rhythm.duration) * duration
                let beatVolume = volume / beat.stringNumbers.length
                for (let stringNumber of beat.stringNumbers) {
                    this.playString(stringNumber, frets[stringNumber - 1], beatVolume, curTime)
                }

                curTime += beatDuration
            }
        }
    }
}

export class Ukulele extends StringInstrument {
    constructor(audioSource : PitchedAudioSource) {
        let stringBasicNotes = [
            new Note("A", 4),
            new Note("E", 4),
            new Note("C", 4),
            new Note("G", 4),
        ]
        super(audioSource, stringBasicNotes)
    }
}

/** 
 * 键盘
 */
export class Keyboard {
    audioSource : PitchedAudioSource
    toneShift: number
    playingNoteIds: Map<number, number>

    constructor(audioSource : PitchedAudioSource) {
        this.audioSource = audioSource
        this.toneShift = 0
        this.playingNoteIds = new Map()
    }

    shiftNoteTone(note : Note) : Note {
        let index = note.getIndex()
        index += this.toneShift
        return Note.createFromIndex(index)
    }

    playNote(note : Note, volume = 1.0, delay = 0.0) {
        assert(this.audioSource.loaded, "播放失败：音源还未加载完成")
        note = this.shiftNoteTone(note)
        this.stopNote(note)
        this.playingNoteIds.set(note.getIndex(), this.audioSource.playNote(note, volume, delay))
    }

    playNotes(notes : Note[], volume = 0.5, duration = 0.0) {
        assert(this.audioSource.loaded, "播放失败：音源还未加载完成")

        notes.forEach((note, i) => {
            this.playNote(note, volume, duration * i / notes.length)
        })
    }

    stopNote(note : Note) {
        let noteIndex = note.getIndex()
        if (!this.playingNoteIds.has(noteIndex)) {
            return;
        }
        let id = this.playingNoteIds.get(noteIndex)
        this.audioSource.stopNote(id)
        this.playingNoteIds.delete(noteIndex)
    }

    setToneShift(shift) {
        this.toneShift = shift
    }

    getToneShift() {
        return this.toneShift
    }
}