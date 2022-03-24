import { loadFileBuffer } from "@/utils/audio.js"
const ResourceDir = "/resources"

const AudioSourceLibrary = [
    {
        name: "Ukulele",
        audioStartTone: { name: "C", octave: 4 },
        dir: ResourceDir + "/sounds/ukulele/",
        maxId: 24,
    }
]

const InstrumentLibrary = [
    {
        name: "Ukulele",
        type: "string",
        stringNum: 4,
        stringBasicTones: [
            { name: "A", octave: 5 },
            { name: "E", octave: 4 },
            { name: "C", octave: 4 },
            { name: "G", octave: 4 },
        ],
    }
]

class AudioSource {
    constructor(audioContext) {
        this.audioContext = audioContext
        this.loaded = false
        this.type = "none"
    }

    readAudioFiles(fileList, basicTone, callbacks = {}) { // TODO: 要不把文件名里也加上音符信息吧，basicTone这样不直观
        if (callbacks.onLoadStart) callbacks.onLoadStart()
        if (!fileList) {
            errMsg = "音频文件列表为空";
            if (callbacks.onFailed) callbacks.onFailed(errMsg);
            throw errMsg;
        }

        this.type = "sample"
        this.basicTone = basicTone
        this.audioBuffers = []
        var that = this
        return new Promise(function(resolve, reject){
            let audioNum = fileList.length
            let loadedAudioNum = 0

            for(let i = 0; i < fileList.length; ++i) {
                loadFileBuffer(fileList[i]).then((buffer)=>{
                    that.audioContext.decodeAudioData(buffer, (audioBuffer)=>{
                        loadedAudioNum++
                        that.audioBuffers[i] = audioBuffer
                        if (callbacks.onLoadProgress) callbacks.onLoadProgress(loadedAudioNum / audioNum);

                        if (audioNum == loadedAudioNum) {
                            console.log("%c乐器音源加载完成", "color: green")
                            that.loaded = true
                            if (callbacks.onLoaded) callbacks.onLoaded();
                        }
                    }, (error)=>{
                        errMsg = "解码音频失败：" + error;
                        if (callbacks.onFailed) callbacks.onFailed(errMsg);
                        throw errMsg;
                    })
                    
                })
            }
        })
    }

    createOscillator(duration, callbacks = {}) {
        if (callbacks.onLoadStart) callbacks.onLoadStart()

        this.type = "oscillator"
        this.oscillatorDuration = duration
        this.loaded = true

        if (callbacks.onLoadProgress) callbacks.onLoadProgress(1.0);
        if (callbacks.onLoaded) callbacks.onLoaded();
        console.log("振荡器音源配置完成")
    }

    play(tone, volume = 0.5, delay = 0.0) {
        let absIndex = _toneToIndex(tone)
        switch(this.type){
            case "none": throw "音源未加载文件或振荡器"; break;
            case "sample": {
                let basicIndex = _toneToIndex(this.basicTone)
                let audioBufferIndex = absIndex - basicIndex
                if (audioBufferIndex < 0 || audioBufferIndex > this.audioBuffers.length)
                    throw "音调超出音源覆盖范围"
                let audioBuffer = this.audioBuffers[audioBufferIndex]

                const fadeInTime = 0.01
                const fadeOutTime = audioBuffer.duration * 0.1

                let gainNode = this.audioContext.createGain()
                gainNode.connect(this.audioContext.destination)
                gainNode.gain.value = 0
                gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + delay + fadeInTime)
                gainNode.gain.setValueCurveAtTime([volume, 0.0], this.audioContext.currentTime + delay + audioBuffer.duration - fadeOutTime, fadeOutTime)

                let source = this.audioContext.createBufferSource()
                source.buffer = audioBuffer
                source.loop = false
                source.connect(gainNode)

                source.start(this.audioContext.currentTime + delay)
                source.stop(this.audioContext.currentTime + delay + audioBuffer.duration)
                return [source, gainNode]
            }
            case "oscillator": {
                const fadeInTime = 0.01

                let gainNode = this.audioContext.createGain()
                gainNode.connect(this.audioContext.destination)
                gainNode.gain.value = 0
                gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + delay + fadeInTime)
                gainNode.gain.setTargetAtTime(0.0, this.audioContext.currentTime + delay + fadeInTime, 1)

                let oscillator = this.audioContext.createOscillator();
                oscillator.type = 'sine';
                oscillator.frequency.value = _ToneToFrequency(tone); // value in hertz
                oscillator.connect(gainNode)
                oscillator.start(this.audioContext.currentTime + delay)
                oscillator.stop(this.audioContext.currentTime + delay + this.oscillatorDuration)
                return [oscillator, gainNode]
            }
            default: {
                throw "不支持的音源类型：" + this.type
            }
        }
    }
}

class StringInstrument {
    constructor(audioContext, stringBasicTones) {
        this.audioContext = audioContext
        this.stringBasicTones = stringBasicTones
        this.stringNum = stringBasicTones.length
        this.playingNodes = []
    }

    play(audioSource, frets, volume, duration) {
        this.stop()
        if (!audioSource.loaded)
            throw "乐器音源还未加载"
        
        for(let i = 0; i < this.stringNum; i++) {
            if (frets[i] == null) continue;
            this.playString(audioSource, i+1, frets[i], volume, duration * i / this.stringNum)
        }
    }

    playString(audioSource, string, fret, volume, delay) {
        this.stopString(string)
        let stringBasicToneIndex = _toneToIndex(this.stringBasicTones[string-1])
        let toneIndex = stringBasicToneIndex + fret
        let tone = _indexToTone(toneIndex)

        this.playingNodes[string-1] = audioSource.play(tone, volume / this.stringNum, delay)
    }

    stop() {
        for(let i = 1; i <= this.stringNum; i++) {
            this.stopString(i)
        }
    }

    stopString(string) {
        if (!this.playingNodes[string-1]) return;
        const fadeOutTime = 0.2;
        let [audio, gainNode] = this.playingNodes[string-1]
        gainNode.gain.cancelScheduledValues(this.audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.0, this.audioContext.currentTime + fadeOutTime)
        audio.stop(this.audioContext.currentTime + fadeOutTime)

        this.playingNodes[string-1] = null;
    }
}

/* 
 * 管理音频上下文，创建音源和乐器并连接
 */
class WebInstrument {
    constructor(instrumentName = "Ukulele", audioSourceName = "Oscillator", callbacks = {}) {
        this.audioContext = new AudioContext()

        // 创建乐器
        let instrumentInfo = InstrumentLibrary.find(e=>e.name == instrumentName)
        if (!instrumentInfo) throw `未找到乐器${instrumentName}`;
        switch(instrumentInfo.type) {
            case "string" : {
                this.instrument = new StringInstrument(this.audioContext, instrumentInfo.stringBasicTones)
                break;
            }
            default:
                throw "不支持乐器类型：" + instrumentInfo.type
        }
        this.type = instrumentInfo.type

        // 创建音源
        this.audioSource = new AudioSource(this.audioContext)

        if (audioSourceName == "Oscillator") {
            this.audioSource.createOscillator(5, callbacks)
        }
        else {
            let audioSourceInfo = AudioSourceLibrary.find(e=>e.name == audioSourceName)
            if (!audioSourceInfo) {
                let errMsg = `未找到音源：${audioSource}`;
                if (callbacks.onFailed) callbacks.onFailed(errMsg);
                throw errMsg;
            }
            let fileList = []
            for(let i = 0 ; i <= audioSourceInfo.maxId; ++i) {
                fileList.push(audioSourceInfo.dir + i + ".mp3")
            }
            this.audioSource.readAudioFiles(fileList, audioSourceInfo.audioStartTone, callbacks)
        }
    }

    play(tone, volume = 0.5) {
        if (this.audioSource.loaded)
            this.audioSource.play(tone, volume)
        else
            console.log("乐器音源还未加载完成")
    }

    playChord(chord, volume = 0.5, duration = 0.0) {
        let stringNum = chord.stringNum
        let fingerings = chord.fingerings
        let disabledStrings = chord.disabledStrings
        if (!stringNum)
            throw "和弦格式有误"

        let frets = []
        for(let i = 0; i < stringNum; ++i) // 填0
            frets.push(0)

        for(let fingering of fingerings) { // 根据指法找到品位
            let fret = fingering.fret
            let startString = fingering.startString
            let endString = fingering.endString ? fingering.endString : startString

            for(let i = startString - 1; i <= endString - 1; ++i) {
                frets[i] = Math.max(frets[i], fret)
            }
        }

        for(let disabledString of disabledStrings) { // 禁用弦不弹
            frets[disabledString - 1] = null
        }

        if (this.audioSource.loaded)
            this.instrument.play(this.audioSource, frets, volume, duration)
        else
            console.log("乐器音源还未加载完成")
    }

    playString(string, fret, volume = 1.0, delay = 0.0) {
        if (this.type != "string") throw "乐器非有弦乐器，不能调用该函数";
        this.instrument.playString(this.audioSource, string, fret, volume, delay)
    }
}

const g_ToneNameMap = {
    "A": 0,
    "B": 2,
    "C": 3,
    "D": 5,
    "E": 7,
    "F": 8,
    "G": 10,
}

function  _toneToIndex(tone) { // A0 = 0, C4 = 52
    let res = tone.name.match(/[^b#]+/)
    if (!res) throw "未知错误";
    let keyWithoutDecoration = res[0]
    let remainIndex = g_ToneNameMap[keyWithoutDecoration]
    if (remainIndex == undefined) throw "未知错误";

    let hasSharp = false, hasFlat = false
    res = tone.name.match(/#/)
    if (res) hasSharp = true;
    res = tone.name.match(/b/)
    if (res) hasFlat = true;

    if (hasSharp) remainIndex++;
    else if (hasFlat) remainIndex--;

    let index = remainIndex + tone.octave * 12

    if (isNaN(index)) throw "未知错误";

    return index
}

function _indexToTone(index) {
    let remainIndex = index % 12
    let octave = Math.floor(index / 12)

    let name = null
    for(let key in g_ToneNameMap) {
        if (remainIndex == g_ToneNameMap[key]) {
            name = key
        }
        else if (remainIndex - 1 == g_ToneNameMap[key]) {
            name = "#" + key
        }
    }
    
    if (!name) throw "未知错误"

    return {
        name: name,
        octave: octave
    }
}

const g_StandardFrequencyA = 440
function _ToneToFrequency(tone) {
    let absIndexA = _toneToIndex({name : "A", octave: 4})
    let curIndex = _toneToIndex(tone)
    let offset = curIndex - absIndexA

    let frequency = g_StandardFrequencyA * Math.pow(2, 1 / 12 * offset)
    return frequency
}

export { WebInstrument }