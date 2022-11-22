import * as Tone from 'tone'
import { assert } from '@/utils/assert.js'

/**
 * AudioContext的时间流逝是固定的，需要根据此来安排音频播放
 * 记录音频的起始时间，用于计算已播放的时间
 * 暂停：实际是停止，暂停时存储此时已播放的时间，用于后面恢复状态
 */

class AudioPlayer {
  constructor() {
    this.audioContext = null
    this.loaded = false
    this.loading = false
    this.audioSourceNode = null
    this.audioData = null

    this.callbackPlayEnded = null

    this.playbackRate = 1.0
    this.startTimePoint = 0
    this.pauseTimePeriod = 0
    this.isPaused = true
  }

  _prepareAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext
      Tone.setContext(this.audioContext);
      this.pitchShiftNode = new Tone.PitchShift()
      Tone.connect(this.pitchShiftNode, this.audioContext.destination)
    }
    return this.audioContext
  }

  _createSourceNode() {
    assert(this.audioData, "请先加载音源")
    const context = this._prepareAudioContext()
    let audioSourceNode = context.createBufferSource();
    if (this.callbackPlayEnded) audioSourceNode.onended = this.callbackPlayEnded
    audioSourceNode.buffer = this.audioData;
    audioSourceNode.playbackRate.value = this.playbackRate;
    Tone.connect(audioSourceNode, this.pitchShiftNode)
    this.audioSourceNode = audioSourceNode
  }

  isLoaded() {
    return this.loaded
  }

  load(file, cbOnEnd) { 
    this.callbackPlayEnded = cbOnEnd

    const context = this._prepareAudioContext()

    if (!file) return false;
    this.loaded = false;
    this.loading = true;

    // 如果已经打开，则销毁
    if (this.audio != null) {
      this.pause();
      this.audio = null
    }

    let that = this
    return new Promise(function(resolve, reject) {
      // 加载文件
      let reader = new FileReader();
      reader.onload = () => {
        const resultDataBuffer = reader.result

        context.decodeAudioData(resultDataBuffer)
          .then((decodedDataBuffer) => {
            that.audioData = decodedDataBuffer
            that.loaded = true;
            that.loading = false;
            resolve(decodedDataBuffer)
          })
          .catch((error) => {
            reject(error)
          })
      };
      reader.readAsArrayBuffer(file);
    })
  }

  resume() {
    assert(this.isLoaded(), "还未加载音频")
    if (!this.isPaused) return
    const context = this._prepareAudioContext()

    this._createSourceNode()
    
    this.startTimePoint = context.currentTime - this.pauseTimePeriod
    this.audioSourceNode.start(this.startTimePoint, this.pauseTimePeriod)
    this.pauseTimePeriod = 0 // clear
    this.isPaused = false
  }

  pause() {
    assert(this.isLoaded(), "还未加载音频")
    const context = this._prepareAudioContext()

    this.audioSourceNode.stop()
    this.pauseTimePeriod = context.currentTime - this.startTimePoint
    this.isPaused = true
    this.audioSourceNode = null
  }

  stop() {
    assert(this.isLoaded(), "还未加载音频")
    this.pause()
    this.pauseTimePeriod = 0
  }

  restart() {
    assert(this.isLoaded(), "还未加载音频")
    this.stop();
    this.resume();
  }

  getTimePoint() {
    assert(this.isLoaded(), "还未加载音频")
    const context = this._prepareAudioContext()
    return this.isPaused ? this.pauseTimePeriod : (context.currentTime - this.startTimePoint)
  }

  setTimePoint(timePoint){
    assert(this.isLoaded(), "还未加载音频")
    if (this.isPaused) {
      this.pauseTimePeriod = timePoint
    }
    else {
      this.pause()
      this.pauseTimePeriod = timePoint
      this.resume()
    }
  }

  setPlaybackRate(rate) {
    assert(this.isLoaded(), "还未加载音频")
    if (this.audioSourceNode) this.audioSourceNode.playbackRate.value = rate
    this.playbackRate = rate
  }

  getPlaybackRate(rate) {
    assert(this.isLoaded(), "还未加载音频")
    return this.playbackRate
  }

  setPitchShift(shift) {
    assert(this.isLoaded(), "还未加载音频")
    this.pitchShiftNode.pitch = shift
  }

  getPitchShift() {
    assert(this.isLoaded(), "还未加载音频")
    return this.pitchShiftNode.pitch
  }
}

export default AudioPlayer