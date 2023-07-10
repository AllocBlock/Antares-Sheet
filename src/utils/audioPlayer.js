import * as Tone from 'tone'
import { assert } from '@/utils/assert'

class AudioPlayer {
  constructor() {
    this.audioContext = null  // delay init
    this.loaded = false
    this.loading = false
    this.audio = null
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

  isLoaded() {
    return this.loaded
  }

  load(file, cbOnDurationChange, cbOnEnd) { 
    let that = this
    return new Promise(function(resolve, reject) {
      that.callbackPlayEnded = cbOnEnd

      const context = that._prepareAudioContext()

      if (!file) reject("参数有误");
      that.loaded = false;
      that.loading = true;

      // 如果已经打开，则销毁
      if (that.audio != null) {
        that.pause();
        that.audio = null
      }

      let fileURL = URL.createObjectURL(file);
      let audio = new Audio();
      audio.src = fileURL;
      audio.volume = 1;
      audio.ondurationchange = () => cbOnDurationChange(audio.duration);
      audio.onended = () => cbOnEnd();

      audio.onloadeddata = () => {
        let audioNode = context.createMediaElementSource(audio)
        Tone.connect(audioNode, that.pitchShiftNode)
        
        that.loaded = true;
        that.loading = false;
        resolve(fileURL)
      };
      
      audio.load();
      that.audio = audio
    })
  }

  resume() {
    assert(this.isLoaded(), "还未加载音频")
    this.audio.play();
  }

  pause() {
    assert(this.isLoaded(), "还未加载音频")
    this.audio.pause()
  }

  restart() {
    assert(this.isLoaded(), "还未加载音频")
    this.setTimePoint(0);
    resume();
  }

  getTimePoint() {
    assert(this.isLoaded(), "还未加载音频")
    return this.audio.currentTime
  }

  setTimePoint(timePoint){
    assert(this.isLoaded(), "还未加载音频")
    timePoint = Math.max(0, Math.min(this.audio.duration, timePoint));
    this.audio.currentTime = timePoint;
  }

  setPlaybackRate(rate) {
    assert(this.isLoaded(), "还未加载音频")
    this.audio.playbackRate = rate
  }

  getPlaybackRate() {
    assert(this.isLoaded(), "还未加载音频")
    return this.audio.playbackRate
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