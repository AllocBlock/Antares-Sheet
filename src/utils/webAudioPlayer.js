class WebAudioPlayer {
  constructor() {
    this.loaded = false
    this.loading = false
    this.audio = null
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
}

export default WebAudioPlayer