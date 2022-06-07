import * as Tone from 'tone'

class WebAudioPlayer {
  constructor() {
    this.audioContext = new AudioContext
    this.loaded = false
    this.loading = false
    this.audio = null
    this.audioNode = null

    Tone.setContext(this.audioContext);
    this.pitchShiftNode = new Tone.PitchShift()
  }

  isLoaded() {
    return this.loaded
  }

  load(file, cbOnloaded, cbOnDurationChange, cbOnEnd) {
    if (!file) return false;
    this.loaded = false;
    this.loading = true;

    // 如果已经打开，则销毁
    if (this.audio != null) {
      this.pause();
      this.audio = null
    }

    // 加载文件
    let reader = new FileReader();
    reader.onload = () => {
      this.audio = new Audio();
      // 加载音频
      this.audio.src = reader.result;
      this.audio.volume = 1;
      this.audio.onloadeddata = () => cbOnloaded(reader.result);
      this.audio.ondurationchange = () => cbOnDurationChange();
      this.audio.onended = () => cbOnEnd();
      this.audio.load();
      this.audioNode = this.audioContext.createMediaElementSource(this.audio)

      Tone.connect(this.audioNode, this.pitchShiftNode)
      Tone.connect(this.pitchShiftNode, this.audioContext.destination)
    };
    reader.readAsDataURL(file);
  }

  resume() {
    if (!this.audio) return false;
    this.audio.play();
    return true;
  }

  pause() {
    if (!this.audio) return false;
    this.audio.pause()
    return true;
  }

  restart() {
    if (!this.audio) return false;
    this.moveToTick(0);
    resume();
    return true;
  }

  moveToTick(tick){
    if (!this.audio) return false;
    tick = Math.max(0, Math.min(this.audio.duration, tick));
    this.audio.currentTime = tick;
    return true;
  }

  setPitchShift(shift) {
    this.pitchShiftNode.pitch = shift
  }

  getPitchShift() {
    return this.pitchShiftNode.pitch
  }
}

export default WebAudioPlayer