import { loadFileBuffer } from "@/utils/audio.js"
const ResourceDir = "/resources/"

const MetronomeLibrary = [
  {
    name: "drum",
    accentFile: ResourceDir + "sounds/metronome/drum-kick.mp3",
    tapFile: ResourceDir + "sounds/metronome/drum-hi-hat.mp3",
  }
]

export default class Metronome {
  constructor(callbacks = {}) {
    this.bpm = 120
    this.pattern = "-..."
    this.audioContext = new AudioContext
    this.onPlayingSources = new Set()
    
    this.state = {
      curBeatIndex: 0,
      onBeat: 0, // number of beat in queue to play, like a semaphore
      nextBeatStartTime: 0,
      started: false,
    }

    this.loaded = false
    this.accentFile = MetronomeLibrary[0].accentFile
    this.tapFile = MetronomeLibrary[0].tapFile
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
    let that = this
    if (!this.loaded)
      return false
    stop()
    this.state.started = true
    that.state.onBeat = 1

    function _loop() {
      if (that.state.onBeat > 0) {
        that.state.onBeat--
        that._recordNextBeat()
      }
      if (that.state.started)
        window.requestAnimationFrame(_loop);
    }

    window.requestAnimationFrame(_loop);

    return true
  }

  stop() {
    this.state.started = false
    this.state.onBeat = 0
    for (let source of this.onPlayingSources)
      source.stop(this.audioContext.currentTime)
    this.onPlayingSources.clear()
  }

  _recordNextBeat() {
    if (!this.state.started) return;

    const curIndex = this.state.curBeatIndex % this.pattern.length
    const curBeat = this.pattern[curIndex]
    this.state.curBeatIndex = (curIndex + 1) % this.pattern.length

    const oneBeatDuration = (1 / this.bpm) * 60
    const startTime = Math.max(this.state.nextBeatStartTime, this.audioContext.currentTime)
    this.state.nextBeatStartTime = startTime + oneBeatDuration
    this._recordBeat(curBeat, startTime, oneBeatDuration)
  }

  _recordBeat(beat, startTime, duration) {
    let that = this
    let audioBuffer = null
    switch (beat) {
      case "-": audioBuffer = this.accent; break;
      case ".": audioBuffer = this.tap; break;
      default: throw "不支持的节拍类型：" + beat
    }

    let source = that.audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(that.audioContext.destination)

    source.start(startTime)
    source.stop(startTime + duration)
    source.onended = () => {
      that.state.onBeat++;
      that.onPlayingSources.delete(source)
    }
    
    that.onPlayingSources.add(source)
  }
}