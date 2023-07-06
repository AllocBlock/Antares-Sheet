import { loadFileBuffer } from "@/utils/audio.js"
import { assert } from "@/utils/assert.js";

const g_ToneNameMap = {
  "A": 0,
  "B": 2,
  "C": 3,
  "D": 5,
  "E": 7,
  "F": 8,
  "G": 10,
}

const ReToneStr = /[A-G]\d/

export function isToneStr(v) {
  return typeof(v) == 'string' && v.test(ReToneStr)
}

export function isTone(v) {
  return v.name && g_ToneNameMap[v.name] && typeof v.octave === 'number'
}

export function isIndex(v) {
  return typeof v === 'number' && v % 1 === 0
}

export function toneToIndex(tone) { // A0 = 0, C4 = 52
  let res = tone.name.match(/[^b#]+/)
  if (!res) throw "未知错误：匹配音调失败";
  let keyWithoutDecoration = res[0]
  let remainIndex = g_ToneNameMap[keyWithoutDecoration]
  if (remainIndex == undefined) throw "未知错误：匹配音调失败";

  let hasSharp = false, hasFlat = false
  res = tone.name.match(/#/)
  if (res) hasSharp = true;
  res = tone.name.match(/b/)
  if (res) hasFlat = true;

  if (hasSharp) remainIndex++;
  else if (hasFlat) remainIndex--;

  let index = remainIndex + tone.octave * 12

  if (isNaN(index)) throw "未知错误：匹配音调失败";

  return index
}

export function indexToTone(index) {
  let remainIndex = index % 12
  let octave = Math.floor(index / 12)

  let name = null
  for (let key in g_ToneNameMap) {
    if (remainIndex == g_ToneNameMap[key]) {
      name = key
    }
    else if (remainIndex - 1 == g_ToneNameMap[key]) {
      name = "#" + key
    }
  }
  if (!name) throw "未知错误：获取音调失败"

  return {
    name: name,
    octave: octave
  }
}

const g_StandardFrequencyA = 440
function _ToneToFrequency(tone) {
  let absIndexA = toneToIndex({ name: "A", octave: 4 })
  let curIndex = toneToIndex(tone)
  let offset = curIndex - absIndexA

  let frequency = g_StandardFrequencyA * Math.pow(2, 1 / 12 * offset)
  return frequency
}

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

/**
 * 有调音源
 * 提供播放指定音调的能力
 * */ 
class PitchedAudioSource {
  constructor(audioContext) {
    this.audioContext = audioContext
    this.loaded = false
    this.type = "none"
  }

  readAudioFiles(fileList, basicTone, callbacks = {}) { // TODO: 要不把文件名里也加上音符信息吧，basicTone这样不直观
    if (callbacks.onLoadStart) callbacks.onLoadStart()
    if (!fileList) {
      let errMsg = "音频文件列表为空";
      if (callbacks.onFailed) callbacks.onFailed(errMsg);
      throw errMsg;
    }

    this.type = "sample"
    this.basicTone = basicTone
    this.audioBuffers = []
    var that = this
    return new Promise(function (resolve, reject) {
      let audioNum = fileList.length
      let loadedAudioNum = 0

      for (let i = 0; i < fileList.length; ++i) {
        loadFileBuffer(fileList[i]).then((buffer) => {
          that.audioContext.decodeAudioData(buffer, (audioBuffer) => {
            loadedAudioNum++
            that.audioBuffers[i] = audioBuffer
            if (callbacks.onLoadProgress) callbacks.onLoadProgress(loadedAudioNum / audioNum);

            if (audioNum == loadedAudioNum) {
              console.log("%c乐器音源加载完成", "color: green")
              that.loaded = true
              if (callbacks.onLoaded) callbacks.onLoaded();
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

  createOscillator(duration, callbacks = {}) {
    if (callbacks.onLoadStart) callbacks.onLoadStart()

    this.type = "oscillator"
    this.oscillatorDuration = duration
    this.loaded = true

    if (callbacks.onLoadProgress) callbacks.onLoadProgress(1.0);
    if (callbacks.onLoaded) callbacks.onLoaded();
    console.log("振荡器音源配置完成")
  }

  playTone(tone, volume = 0.5, delay = 0.0) {
    let absIndex = toneToIndex(tone)
    switch (this.type) {
      case "none": throw "音源未加载文件或振荡器"; break;
      case "sample": {
        let basicIndex = toneToIndex(this.basicTone)
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
        return { sourceNode: source, gainNode: gainNode }
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
        return { sourceNode: oscillator, gainNode: gainNode }
      }
      default: {
        throw "不支持的音源类型：" + this.type
      }
    }
  }

  stopTone(sourceNode, gainNode) {
    const fadeOutTime = 0.2;
    gainNode.gain.cancelScheduledValues(this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.0, this.audioContext.currentTime + fadeOutTime)
    sourceNode.stop(this.audioContext.currentTime + fadeOutTime)
  }
}

/**
 * 弦乐器接口尤克里里、吉他
 * 提供各种弹奏接口，需要指定音源
 * */ 
class StringInstrumentInterface {
  constructor(audioContext, stringBasicTones) {
    this.audioContext = audioContext
    this.stringBasicTones = stringBasicTones
    this.stringNum = stringBasicTones.length
    this.playingNodes = []
    this.capo = 0
  }

  doesChordMatch(chord) {
    if (!chord.stringNum) return false
    if (chord.stringNum != this.stringNum) return false
    return true
  }

  getFretsOfChord(chord) {
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

  playString(audioSource, string, fret, volume, delay) {
    this.stopString(string)
    let stringBasicToneIndex = toneToIndex(this.stringBasicTones[string - 1])
    let toneIndex = stringBasicToneIndex + fret + this.capo
    let tone = indexToTone(toneIndex)

    this.playingNodes[string - 1] = audioSource.playTone(tone, volume / this.stringNum, delay)
    this.playingNodes[string - 1].audioSource = audioSource
  }

  stop() {
    for (let i = 1; i <= this.stringNum; i++) {
      this.stopString(i)
    }
  }

  stopString(string) {
    if (!this.playingNodes[string - 1]) return;
    this.playingNodes[string - 1].audioSource.stopTone(this.playingNodes[string - 1].sourceNode, this.playingNodes[string - 1].gainNode)
    this.playingNodes[string - 1] = null;
  }

  playFingering(audioSource, frets, volume, duration) {
    this.stop()
    if (!audioSource.loaded)
      throw "乐器音源还未加载"

    for (let i = 0; i < this.stringNum; i++) {
      if (frets[i] == null) continue;
      this.playString(audioSource, i + 1, frets[i], volume, duration * i / this.stringNum)
    }
  }

  playChord(audioSource, chord, volume, duration) {
    let frets = this.getFretsOfChord(chord)
    this.playFingering(audioSource, frets, volume, duration)
  }
}

/** 
 * 乐器
 * 管理音频上下文，创建音源和乐器并连接
 * 提供各种播放、演奏接口
 */
class Instrument {
  constructor(audioSourceName, callbacks = {}) {
    this.audioContext = new AudioContext()
    this.loadAudioSource(audioSourceName, callbacks)
  }

  loadAudioSource(name, callbacks) {
    // 创建音源
    this.audioSource = new PitchedAudioSource(this.audioContext)

    if (name == "Oscillator") {
      this.audioSource.createOscillator(5, callbacks)
    }
    else {
      let audioSourceInfo = AudioSourceLibrary.find(e => e.name == name)
      if (!audioSourceInfo) {
        let errMsg = `未找到音源：${audioSource}`;
        if (callbacks.onFailed) callbacks.onFailed(errMsg);
        throw errMsg;
      }
      let fileList = []
      for (let i = 0; i <= audioSourceInfo.maxId; ++i) {
        fileList.push(audioSourceInfo.dir + i + ".mp3")
      }
      this.audioSource.readAudioFiles(fileList, audioSourceInfo.audioStartTone, callbacks)
    }
  }

  playTone(tone, volume = 0.5, delay = 0.0) {
    assert(this.audioSource.loaded, "播放失败：音源还未加载完成")
    return this.audioSource.playTone(tone, volume, delay)
  }

  stopTone(sourceNode, gainNode) {
    this.audioSource.stopTone(sourceNode, gainNode)
  }
}

/** 
 * 弦乐器
 */
export class StringInstrument extends Instrument {
  constructor(instrumentName = "Ukulele", audioSourceName = "Oscillator", callbacks = {}) {
    super(audioSourceName, callbacks)

    // 创建乐器
    let instrumentInfo = InstrumentLibrary.find(e => e.name == instrumentName)
    if (!instrumentInfo) throw `未找到乐器${instrumentName}`;
    assert(instrumentInfo.type == "string", `StringInstrument只能用于弦乐器（string），而${instrumentName}属于${instrumentInfo.type}类乐器`)
    this.instrument = new StringInstrumentInterface(this.audioContext, instrumentInfo.stringBasicTones)
  }

  playChord(chord, volume = 0.5, duration = 0.0) {
    assert(this.audioSource.loaded, "播放失败：音源还未加载完成")
    this.instrument.playChord(this.audioSource, chord, volume, duration)
  }

  playString(string, fret, volume = 1.0, delay = 0.0) {
    this.instrument.playString(this.audioSource, string, fret, volume, delay)
  }

  setCapo(capo) {
    capo = parseInt(capo)
    if (isNaN(capo) || capo < 0) throw "无效的变调夹位置"
    this.instrument.capo = capo
  }

  getCapo() {
    return this.instrument.capo
  }
}

/** 
 * 键盘
 */
export class Keyboard extends Instrument {
  constructor(audioSourceName = "Oscillator", callbacks = {}) {
    super(audioSourceName, callbacks)
    this.toneShift = 0
    this.keyPlayMap = new Map()
  }

  keyToToneWithTuneShift(key) {
    let index = (isIndex(key) ? key : toneToIndex(key))
    index += this.toneShift
    return indexToTone(index)
  }

  // key可以是索引也可以是音名
  playKey(key, volume = 1.0, delay = 0.0) {
    assert(this.audioSource.loaded, "播放失败：音源还未加载完成")
    let tone = this.keyToToneWithTuneShift(key)
    let uniqueKeyId = toneToIndex(tone)
    if (this.keyPlayMap.has(uniqueKeyId)) this.stopKey(key)
    this.keyPlayMap.set(uniqueKeyId, this.playTone(tone, volume, delay))
  }

  // key可以是索引也可以是音名
  playKeys(keys, volume = 0.5, duration = 0.0) {
    assert(this.audioSource.loaded, "播放失败：音源还未加载完成")

    let res = []
    for (let i in keys)
      res.push(this.playKey(keys[i], volume, duration, duration * i / keys.length))
    return res
  }

  stopKey(key) {
    let tone = this.keyToToneWithTuneShift(key)
    let uniqueKeyId = toneToIndex(tone)
    let nodes = this.keyPlayMap.get(uniqueKeyId)
    if (nodes) {
      this.stopTone(nodes.sourceNode, nodes.gainNode)
      this.keyPlayMap.delete(uniqueKeyId)
    }
  }

  setToneShift(shift) {
    this.toneShift = shift
  }

  getToneShift() {
    return this.toneShift = 0
  }
}