import { loadFileBuffer } from "@/utils/audio.js"
const ResourceDir = "/resources/"

const MetronomeLibrary = [
  {
    name: "drum",
    accentFile: ResourceDir + "sounds/metronome/drum-kick.mp3",
    tapFile: ResourceDir + "sounds/metronome/drum-hi-hat.mp3",
  }
]

export default class WebMetronome {
  constructor(callbacks = {}) {
    this.loaded = false
    this.bpm = 120
    this.pattern = "-..."
    this.accentFile = MetronomeLibrary[0].accentFile
    this.tapFile = MetronomeLibrary[0].tapFile
    this.audioContext = new AudioContext
    this.playingSources = []

    this.loadAudios(callbacks)
  }

  loadAudios(callbacks = {}) {
    if (callbacks.onLoadStart) callbacks.onLoadStart()
    var that = this
    return new Promise(function (resolve, reject) {
      let audioNum = 2
      let loadedAudioNum = 0

      let loadSource = function(fileName, memberKey) {
        loadFileBuffer(fileName).then((buffer) => {
          that.audioContext.decodeAudioData(buffer, (audioBuffer) => {
            loadedAudioNum++
            that[memberKey] = audioBuffer
            if (callbacks.onLoadProgress) callbacks.onLoadProgress(loadedAudioNum / audioNum);
  
            if (audioNum == loadedAudioNum) {
              if (callbacks.onLoaded) callbacks.onLoaded();
              console.log("%c节拍器加载完成", "color: green")
              that.loaded = true
              resolve()
            }
          }, (error) => {
            errMsg =  "解码音频失败：" + error;
            if (callbacks.onFailed) callbacks.onFailed(errMsg);
            throw errMsg;
          })
        })
      }

      loadSource(that.accentFile, "accent");
      loadSource(that.tapFile, "tap");
    })
  }

  isReady() {
    return this.loaded
  }

  start() {
    if (!this.loaded)
      return false
    stop()
    this.counting = true
    this._playBar(this.audioContext.currentTime)

    return true
  }

  stop() {
    this.counting = false
    for (let source of this.playingSources)
      source.stop(this.audioContext.currentTime)
    this.playingSources = []
  }

  _playBar(startTime) {
    var that = this

    let oneBeatDuration = (1 / this.bpm) * 60
    let oneBarDuration = oneBeatDuration * this.pattern.length
    for (let i = 0; i < this.pattern.length; ++i) {
      let beatType = this.pattern[i]
      let audioBuffer
      switch (beatType) {
        case "-": audioBuffer = this.accent; break;
        case ".": audioBuffer = this.tap; break;
        default: throw "不支持的节拍类型：" + beatType
      }

      let source = that.audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(that.audioContext.destination)

      source.start(startTime + i * oneBeatDuration)
      source.stop(startTime + oneBarDuration)
      if (i == 0) {
        source.onended = () => {
          if (that.counting) {
            that._playBar(startTime + oneBarDuration)
          }
        }
      }
      that.playingSources[i] = source
    }
  }
}