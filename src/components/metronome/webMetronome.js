const ResourceDir = "/resources/"

const MetronomeLibrary = [
  {
    name: "drum",
    accentFile: ResourceDir + "sounds/metronome/drum-kick.mp3",
    tapFile: ResourceDir + "sounds/metronome/drum-hi-hat.mp3",
  }
]

export default class WebMetronome {
  constructor() {
    this.loaded = false
    this.bpm = 120
    this.pattern = "-..."
    this.accentFile = MetronomeLibrary[0].accentFile
    this.tapFile = MetronomeLibrary[0].tapFile
    this.audioContext = new AudioContext
    this.playingSources = []

    this.loadAudios()
  }

  loadAudios() {
    var that = this
    return new Promise(function (resolve, reject) {
      let audioNum = 2
      let loadedAudioNum = 0

      that._loadFileBuffer(that.accentFile).then((buffer) => {
        that.audioContext.decodeAudioData(buffer, (audioBuffer) => {
          loadedAudioNum++
          that.accent = audioBuffer

          if (audioNum == loadedAudioNum) {
            console.log("节拍器加载完成")
            that.loaded = true
            resolve()
          }
        }, (error) => {
          throw "解码音频失败：" + error
        })
      })

      that._loadFileBuffer(that.tapFile).then((buffer) => {
        that.audioContext.decodeAudioData(buffer, (audioBuffer) => {
          loadedAudioNum++
          that.tap = audioBuffer

          if (audioNum == loadedAudioNum) {
            console.log("节拍器加载完成")
            that.loaded = true
            resolve()
          }
        }, (error) => {
          throw "解码音频失败：" + error
        })
      })
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

  _loadFileBuffer(url) {
    return new Promise(function (resolve, reject) {
      fetch(url).then(result => result.blob()).then(blob => {
        var reader = new FileReader()
        reader.onloadend = () => {
          resolve(reader.result)
        }
        reader.readAsArrayBuffer(blob)
      })
    })
  }
}