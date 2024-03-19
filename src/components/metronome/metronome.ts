import { loadAudioFile, loadFileBuffer } from "@/utils/audio"
import { LoadCallback } from "@/utils/common"
const ResourceDir = "/resources/"

const MetronomeLibrary = [
    {
        name: "drum",
        accentFile: ResourceDir + "sounds/metronome/drum-kick.mp3",
        tapFile: ResourceDir + "sounds/metronome/drum-hi-hat.mp3",
    }
]

export default class Metronome {
    audioContext: AudioContext
    loaded: boolean
    accentFile: string
    accentAudioBuffer: AudioBuffer
    tapFile: string
    tapAudioBuffer: AudioBuffer
    onPlayingSources: Set<AudioBufferSourceNode>

    bpm: number
    pattern: string

    curBeatIndex: number
    onBeat: number // number of beat in queue to play, like a semaphore
    nextBeatStartTime: number
    started: boolean

    constructor(callbacks: LoadCallback = {}) {
        this.audioContext = new AudioContext
        this.bpm = 120
        this.pattern = "-..."
        this.onPlayingSources = new Set()

        this.curBeatIndex = 0
        this.onBeat = 0
        this.nextBeatStartTime = 0
        this.started = false

        this.loaded = false
        this.accentFile = MetronomeLibrary[0].accentFile
        this.accentAudioBuffer = null
        this.tapFile = MetronomeLibrary[0].tapFile
        this.tapAudioBuffer = null
        this.loadAudios(callbacks)
    }

    async loadAudios(callbacks: LoadCallback = {}) {
        if (callbacks.onLoadStart) callbacks.onLoadStart()
        this.accentAudioBuffer = await loadAudioFile(this.accentFile)
        if (callbacks.onLoadProgress) callbacks.onLoadProgress(0.5);
        this.tapAudioBuffer = await loadAudioFile(this.tapFile)
        if (callbacks.onLoadProgress) callbacks.onLoadProgress(1.0);
        if (callbacks.onLoaded) callbacks.onLoaded();
        this.loaded = true
    }

    isReady() {
        return this.loaded
    }

    start() {
        if (!this.loaded)
            return false
        stop()
        this.started = true
        this.onBeat = 1

        let _loop = function () {
            if (this.onBeat > 0) {
                this.onBeat--
                this._recordNextBeat()
            }
            if (this.started)
                window.requestAnimationFrame(_loop.bind(this));
        }

        window.requestAnimationFrame(_loop.bind(this));

        return true
    }

    stop() {
        this.started = false
        this.onBeat = 0
        for (let source of this.onPlayingSources)
            source.stop(this.audioContext.currentTime)
        this.onPlayingSources.clear()
    }

    _recordNextBeat() {
        if (!this.started) return;

        const curIndex = this.curBeatIndex % this.pattern.length
        const curBeat = this.pattern[curIndex]
        this.curBeatIndex = (curIndex + 1) % this.pattern.length

        const oneBeatDuration = (1 / this.bpm) * 60
        const startTime = Math.max(this.nextBeatStartTime, this.audioContext.currentTime)
        this.nextBeatStartTime = startTime + oneBeatDuration
        this._recordBeat(curBeat, startTime, oneBeatDuration)
    }

    _recordBeat(beat, startTime, duration) {
        let audioBuffer = null
        switch (beat) {
            case "-": audioBuffer = this.accentAudioBuffer; break;
            case ".": audioBuffer = this.tapAudioBuffer; break;
            default: throw "不支持的节拍类型：" + beat
        }

        let source = this.audioContext.createBufferSource()
        source.buffer = audioBuffer
        source.connect(this.audioContext.destination)

        source.start(startTime)
        source.stop(startTime + duration)
        source.onended = () => {
            this.onBeat++;
            this.onPlayingSources.delete(source)
        }

        this.onPlayingSources.add(source)
    }
}