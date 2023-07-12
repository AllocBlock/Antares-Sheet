<template>
  <div class="audio_player">
    <div
      v-show="showHintCover"
      class="audio_hint_cover flex_hv_center"
      @click="selectMusic()"
    >{{hintCoverText}}</div>
    <div class="audio_button_zone flex_hv_center">
      <div class="audio_button flex_hv_center" @click="addMark()">
        <Svg src="/icons/mark.svg" class="icon" />
      </div>
      <div class="audio_button flex_hv_center" @click="jumpToPrevMark()">
        <Svg src="/icons/prevArrow.svg" class="icon" />
      </div>
      <div class="audio_button flex_hv_center" @click="jumpToNextMark()">
        <Svg src="/icons/nextArrow.svg" class="icon" />
      </div>
      <div class="audio_button flex_hv_center" @click="removeAllMark()">
        <Svg src="/icons/trash.svg" class="icon" />
      </div>

      <div class="audio_button-seperater"></div>

      <div class="audio_button_with_text flex_hv_center" @click="toggleMute()">
        <Svg src="/icons/muted.svg" class="icon" v-show="this.setting.mute" />
        <Svg src="/icons/volume.svg" class="icon" v-show="!this.setting.mute" />
        <div
          class="text flex_hv_center"
        >{{ setting.mute ? "静音" : Math.round(setting.volume * 100) + "%" }}</div>
      </div>
      <input
        id="slider_audio_volume"
        type="range"
        min="0"
        max="1.0"
        step="0.01"
        v-model="setting.volume"
        class="slider_default"
      />

      <div class="audio_button_with_text flex_hv_center" @click="resetSpeed()">
        <Svg src="/icons/speed.svg" class="icon" />
        <div class="text flex_hv_center">×{{ parseFloat(setting.speed).toFixed(1) }}</div>
      </div>
      <input
        id="slider_audio_speed"
        type="range"
        min="1"
        max="10"
        step="1"
        v-model="setting.speedLevel"
        @input="updateSpeed()"
        class="slider_default"
      />

      <div class="audio_button flex_hv_center" @click="resetDetune()">
        <Svg src="/icons/pitch.svg" class="icon" />
      </div>
      <input
        id="slider_audio_detune"
        type="number"
        min="-12"
        max="12"
        step="1"
        v-model="setting.detune"
        @change="updateDetune()"
      />

      <label class="switch">
        <input type="checkbox" v-model="setting.follow" />
        <span class="slider"></span>
        <div id="audio_follow_text" class="flex_hv_center">跟随{{setting.follow ? "开" : "关"}}</div>
      </label>
      
      <div class="audio_button flex_hv_center" @click="close()" style="position: absolute; right: 0; z-index: 2;">
        <Svg src="/icons/close.svg" class="icon" />
      </div>
    </div>
    <div id="audio_slider_zone" ref="progressSliderZone" 
      @scroll="onScrollProgressSlider"
      @dblclick="onDblclickProgressSlider"
    >
      <div class="audio_slider_blank" :style="`width: ${progressSlider.padding}px`"></div>
      <div id="audio_slider_zone_scale" class="flex_hv_center" ref="progressSlider"
        :style="`width: ${progressSlider.scale * 100}%`"
        @wheel="onWheelProgressSlider"
      >
        <canvas id="audio_waveform" width="30000" height="50" ref="audioWaveCanvas"></canvas>
        <input
          id="slider_music"
          type="range"
          min="0"
          :max="audioInfo.duration"
          step="0.01"
          v-model="audioInfo.curTick"
          @mousedown="onProgressSliderMouseDown"
          @change="onChangeProgressSlider()"
        />
        <div id="audio_mark_table">
          <div class="audio_mark" :style="getMarkStyle(mark)" v-for="(mark, i) in marks" :key="mark" @contextmenu.prevent="onContextMark($event, mark)" @mousedown="onMarkMouseDown($event, i)">
            <div class="audio_mark-name flex_hv_center">{{mark.text}}</div>
            <div class="audio_mark-pin"></div>
          </div>
        </div>
      </div>
      <div class="audio_slider_blank" :style="`width: ${progressSlider.padding}px`"></div>
    </div>
    <div class="audio_button_zone flex_hv_center">
      <div class="audio_button flex_hv_center" @click="togglePlay()">
        <Svg id="audio_play_icon" v-show="!setting.playing" src="/icons/play.svg" class="icon" />
        <Svg id="audio_pause_icon" v-show="setting.playing" src="/icons/pause.svg" class="icon" />
      </div>
      <div class="audio_button flex_hv_center" @click="stop()">
        <Svg id="audio_stop_icon" src="/icons/stop.svg" class="icon" />
      </div>

      <div id="slider_tick_progress" class="flex_hv_center">
        <div id="slider_tick">{{ tickToTimeStr(audioInfo.curTick) }}</div>
        <div id="slider_seperate">/</div>
        <div id="slider_length">{{ tickToTimeStr(audioInfo.duration) }}</div>
      </div>
    </div>

    <div id="mark_context" v-show="markContext.show" :style="markContext.style" @mouseenter="onMarkContextMouseenter" @mouseleave="onMarkContextMouseleave">
      <div id="mark_context_div">
        <div id="mark_context_name_zone" class="flex_hv_center">
          <input type="text" id="mark_context_name" v-model="markContext.mark.text" maxlength="10" ref="markContextInput" @blur="onMarkContextBlur" @keydown="onMarkContextKeydown"/>
        </div>
        <div id="mark_context_locate" class="flex_hv_center" @click="jumpToMark(markContext.mark); markContext.show = false">定位到这里</div>
        <div id="mark_context_delete" class="flex_hv_center" @click="removeMark(markContext.mark); markContext.show = false">删除</div>
      </div>
    </div>
  </div>
</template>

<script>
import Svg from "@/components/svg.vue";
import AudioPlayer from "@/utils/audioPlayer";
import HotKey from "@/utils/hotKey";
import { getEnv, clone } from "@/utils/common";
import { ELoadState, getPos, getRelativePos } from "@/utils/common"
import addToast from "@/utils/toast";

const PlaybackSpeedLevels = {
  1: 0.5,
  2: 0.6,
  3: 0.7,
  4: 0.8,
  5: 0.9,
  6: 1.0,
  7: 1.2,
  8: 1.5,
  9: 2.0,
  10: 2.5
}

export default {
  name: "SheetEditorAudioPlayer",
  components: { Svg },
  emits: [ "close" ],
  data() {
    return {
      loading: false,
      loaded: false,
      loadState: ELoadState.Empty,
      audioPlayer: new AudioPlayer(), // non-reactive
      audioInfo: {
        duration: 0,
        curTick: 0,
      },
      setting: {
        playing: false,
        speedLevel: 6,
        detune: 0,
        speed: 1.0,
        volume: 0.5,
        mute: false,
        follow: false,
      },
      timer: {
        curTick: null
      },
      progressSlider: {
        dragging: false,
        scale: 1.0,
        padding: 100
      },
      marks: [],
      markContext: {
        show: false,
        style: {},
        mouseIn: false,
        focused: false,
        mark: {
          text: '',
        }
      },
      markDragState: {
        isDragging: false,
        draggingMark: null,
      }
    };
  },
  props: {
    muteHotkey: {
      type: Boolean,
      default: false,
    }
  },
  computed: {
    showHintCover() {
      return this.loadState != ELoadState.Loaded
    },
    hintCoverText() {
      switch(this.loadState) {
        case ELoadState.Empty: return "点击加载音乐~";
        case ELoadState.Failed: return "解码文件失败，请选择正确的音频文件！";
        case ELoadState.Loaded: return "加载完成！";
        case ELoadState.Loading: return "加载中...";
      }
      return "未知错误";
    },
    enableHotkey() {
      return !this.markContext.show && !this.muteHotkey
    }
  },
  created() {
    let that = this

    document.addEventListener("mouseup", this.onMouseUp)
    document.addEventListener("mousemove", this.onMouseMove)

    function hotkeySwitcher(callback, preventDefault = false) {
      return (e) => {
        if (!that.enableHotkey) return;
        if (preventDefault) e.preventDefault()
        callback(e)
      }
    }

    HotKey.addListener("Space", hotkeySwitcher((e) => this.togglePlay(), true))
    HotKey.addListener("KeyW", hotkeySwitcher(() => this.addMark()))
    HotKey.addListener("KeyQ", hotkeySwitcher(() => this.jumpToPrevMark()))
    HotKey.addListener("KeyE", hotkeySwitcher(() => this.jumpToNextMark()))
  },
  methods: {
    getEnv,
    close() {
      this.$emit("close")
    },
    tickToTimeStr(tick) {
      let second = Math.floor(tick); // 取整
      let minute = Math.floor(second / 60); // 计算分钟
      second = second - minute * 60; // 计算秒数
      return `${(minute).toString().padStart(2, '0')}:${(second).toString().padStart(2, '0')}`;
    },
    drawWaveform(canvas, file) {
      return new Promise(function(resolve, reject) {
        let reader = new FileReader();
        reader.onload = () => {
          const resultDataBuffer = reader.result

          let tempContext = new AudioContext

          tempContext.decodeAudioData(resultDataBuffer)
            .then((decodedAudioDataBuffer) => {
              let pen = canvas.getContext("2d"); // 画笔
              // 关闭抗锯齿
              pen.webkitImageSmoothingEnabled = false;
              pen.mozImageSmoothingEnabled = false;
              pen.imageSmoothingEnabled = false;

              let data = decodedAudioDataBuffer.getChannelData(0); // 第一轨的数据
              let dataLen = data.length; // 数据个数

              // 设置画布宽度
              canvas.setAttribute("width", decodedAudioDataBuffer.duration * 200);

              // 绘制参数
              let width = canvas.getAttribute("width");
              let height = canvas.getAttribute("height");
              let interval = 50; // 采样间隔
              let sampleCount = Math.floor(dataLen / interval); // 采样数
              let amp = height / 2; // 振幅是高度的一般（注意音频数据是有正负的,-1.0到1.0）

              // 开始绘制
              pen.clearRect(0, 0, width, height); // 清空画布
              pen.moveTo(0, amp); // 左侧中点开始

              for (let i = 0; i < sampleCount; i++) {
                // 求区间平均值
                let avg = 0.0;
                for (let j = 0; j < interval; j++) {
                  avg += data[(i * interval) + j];
                }
                avg /= interval;
                // 画线
                let left = (i * interval) / dataLen * width;
                let top = avg * amp + amp;
                pen.lineTo(left, top);
              }
              pen.strokeStyle = "#ffddd3";
              pen.stroke();  // 填充
              resolve()
            })
            .catch((error) => {
              reject(error)
            })
        };
        reader.readAsArrayBuffer(file);
      })
    },
    selectMusic() {
      // 如果正在加载，则暂时禁止选择文件
      if (this.loadState == ELoadState.Loading) {
        return;
      }
      // 打开文件选择框
      let input = document.createElement('input');
      input.type = 'file';
      input.accept = "audio/*"
      input.onchange = e => { 
        this.loadAudio(e.currentTarget.files[0]);
      }
      input.click();
      input.remove()
    },
    /* 加载音乐 */
    loadAudio(file) {
      let that = this
      if (file == null) {
        addToast("打开文件失败！");
        return;
      }

      this.loadState = ELoadState.Loading;

      // this.audioPlayer.load(file, () => this.pause())
      this.audioPlayer.load(file, 
        (duration) => {
          this.audioInfo.duration = duration
          if (this.audioPlayer.isLoaded())
            this.audioPlayer.setTimePoint(0)
        }, 
        () => {
          this.pause()
        }
      )
        .then(() => {
          that.drawWaveform(this.$refs.audioWaveCanvas, file)
            .then(() => {
              that.loadState = ELoadState.Loaded
            })
        })
        .catch((error) => {
          console.log(error)
          this.loadState = ELoadState.Failed
        })
    },
    togglePlay() {
      if (this.loadState != ELoadState.Loaded) {
        addToast("请先加载音乐！");
        return;
      }
      if (this.setting.playing) {
        this.pause()
      } else {
        this.resume()
      }
    },
    resume() {
      this.audioPlayer.resume()
      window.cancelAnimationFrame(this.timer.curTick)
      const updateCurTick = () => {
        if (!this.progressSlider.dragging) {
          let curTick = this.audioPlayer.getTimePoint()
          this.audioInfo.curTick = curTick
          if (this.setting.follow)
            this.followTickMark(curTick, "inleft")
        }
        this.timer.curTick = window.requestAnimationFrame(updateCurTick)
      }
      updateCurTick()

      this.setting.playing = true
    },
    pause() {
      this.audioPlayer.pause()
      window.cancelAnimationFrame(this.timer.curTick)

      this.setting.playing = false
    },
    stop() {
      this.pause()
      this.audioPlayer.setTimePoint(0)
      this.audioInfo.curTick = 0
    },
    toggleMute() {
      this.setting.mute = !this.setting.mute
    },
    onChangeProgressSlider() {
      this.audioPlayer.setTimePoint(this.audioInfo.curTick)
      this.progressSlider.dragging = false
    },
    onProgressSliderMouseDown() {
      this.progressSlider.dragging = true
    },
    updateSpeed() {
      let speedLevel = parseInt(this.setting.speedLevel)
      this.setting.speed = PlaybackSpeedLevels[speedLevel]
      this.audioPlayer.setPlaybackRate(this.setting.speed)
    },
    resetSpeed() {
      this.setting.speedLevel = 6
      this.updateSpeed()
    },
    updateDetune() {
      let lastShift = this.audioPlayer.getPitchShift()
      let shift = parseInt(this.setting.detune)
      if (!isNaN(shift)) {
        shift = Math.min(12, Math.max(-12, shift))
        this.audioPlayer.setPitchShift(shift)
      }
      else
        shift = lastShift

      this.setting.detune = shift
    },
    resetDetune() {
      this.setting.detune = 0
      this.updateDetune()
    },
    addMark(text = "标记", timeTick = null, overwrite = true) {
      if (this.loadState != ELoadState.Loaded) {
        addToast("请先加载音乐！");
        return;
      }

      timeTick = timeTick ? parseFloat(timeTick) : this.audioPlayer.getTimePoint()
      // 覆盖模式下，如果该位置已经有标记，则覆盖掉
      if (overwrite){
        let index = this.marks.findIndex((e) => e.tick == timeTick)
        if (index >= 0)
          this.marks.splice(index, 1)
      }
      
      this.marks.push({
        text: text,
        tick: timeTick
      })
    },
    getMarkStyle(mark) {
      let style = {}
      if (this.loadState == ELoadState.Loaded) {
          let percentage = (mark.tick / this.audioInfo.duration) * 100;
          percentage = Math.max(0, Math.min(100, percentage)); // 限制范围
          let left = `${percentage}%`
          style = {left}
      }
      return style;
    },
    jumpToMark(mark) {
      this.audioPlayer.setTimePoint(mark.tick)
      this.audioInfo.curTick = mark.tick
    },
    jumpToPrevMark() {
      let targetTick = this.audioInfo.curTick
      let resMark = { text: '', tick: 0 }
      for(let mark of this.marks) {
        if (mark.tick > resMark.tick && mark.tick < targetTick) {
          resMark = mark 
        }
      }
      this.jumpToMark(resMark)
    },
    jumpToNextMark() {
      let targetTick = this.audioInfo.curTick
      let resMark = { text: '', tick: this.audioInfo.duration }
      for(let mark of this.marks) {
        if (mark.tick < resMark.tick && mark.tick > targetTick) {
          resMark = mark 
        }
      }
      this.jumpToMark(resMark)
    },
    removeMark(mark) {
      let index = this.marks.findIndex((e) => e == mark)
      if (index >= 0)
        this.marks.splice(index, 1)
    },
    removeAllMark() {
      if (confirm("删除所有标记？")) {
        this.marks = []
      }
    },
    onContextMark(e, mark) {
      this.markContext.show = true
      this.markContext.mark = mark
      this.markContext.mouseIn = false
      this.markContext.focused = true
      let offset = getPos(e.currentTarget)
      let width = e.currentTarget.clientWidth
      this.markContext.style = {
        left: `${offset.left + width / 2}px`,
        top: `${offset.top - 10}px`,
      }
      this.$nextTick(() => {
        this.$refs.markContextInput.focus()
      })
    },
    onMarkContextBlur() {
      this.markContext.focused = false
      if (!this.markContext.mouseIn) {
        this.markContext.show = false
      }
    },
    onMarkContextKeydown(e) {
      if (e.key == "Enter") {
        this.markContext.show = false
      }
    },
    onMarkContextMouseenter() {
      this.markContext.mouseIn = true
    },
    onMarkContextMouseleave() {
      this.markContext.mouseIn = false
      if (!this.markContext.focused) {
        this.markContext.show = false
      }
    },
    onWheelProgressSlider(e) {
      if (e.ctrlKey){
        let oldScale = this.progressSlider.scale
        let newScale = oldScale * (e.deltaY > 0 ? 1/1.1 : 1.1);
        newScale = Math.max(1.0, Math.min(20, newScale))
        this.progressSlider.scale = newScale
        // 更新滚动条位置
        const padding = this.progressSlider.padding
        const oldWidth = this.$refs.progressSlider.clientWidth
        const newWidth = this.$refs.progressSlider.clientWidth / oldScale * newScale
        const cursorTick = this.getTickByCursor(e)
        const oldPosX = padding + (cursorTick / this.audioInfo.duration) * oldWidth;
        const offset = oldPosX - this.getProgressSliderPos()
        const newPosX = padding + (cursorTick / this.audioInfo.duration) * newWidth;
        const newScrollPos = newPosX - offset
        this.$nextTick(() => {
          this.setProgressSliderPos(newScrollPos)
        })
      }
      e.preventDefault();
    },
    onScrollProgressSlider(e) {
      // console.log(e)
    },
    onDblclickProgressSlider(e) {
      // 双击播放
      if (this.loadState == ELoadState.Loaded && !this.setting.playing){
        this.resume();
      }
      e.preventDefault();
    },
    getProgressSliderPos() {
      return this.$refs.progressSliderZone.scrollLeft
    },
    setProgressSliderPos(pos) {
      this.$refs.progressSliderZone.scrollLeft = pos
    },
    getTickByCursor(e){
      if (this.loadState == ELoadState.Loaded){
        const left = getRelativePos(this.$refs.progressSlider, e.pageX, e.pageY).left
        const percentage = left / this.$refs.progressSlider.clientWidth
        let tick = percentage * this.audioInfo.duration;
        tick = Math.max(0, Math.min(this.audioInfo.duration, tick)); // 范围限制
        return tick;
      }
      return -1;
    },
    followTickMark(tick, follow = "none"){
      const padding = this.progressSlider.padding
      const waveWidth = this.$refs.progressSlider.clientWidth
      const sightWidth = this.$refs.progressSliderZone.clientWidth
      const sightMin = this.getProgressSliderPos()
      const sightMax = sightMin + sightWidth
      const tickPos = padding + tick / this.audioInfo.duration * waveWidth;
      const margin = 20
      let targetPos = null
      switch(follow){
        case "none":{ // 超出范围则平移到可以看见为止
            if (tickPos < sightMin)
              targetPos = tickPos - margin
            else if (tickPos > sightMax)
              targetPos = tickPos - sightWidth + margin
            break;
        }
        case "left":{ // 固定在左侧
            targetPos = tickPos - margin
            break;
        }
        case "right":{ // 固定在右侧
            targetPos = tickPos - sightWidth + margin
            break;
        }
        case "center":{ // 固定在中心
            targetPos = tickPos - sightWidth / 2
            break;
        }
        case "inleft":{ // 保证在屏幕内，左侧半边，到右侧时则强制居中
            if (tickPos >= sightMin + sightWidth / 2)
              targetPos = tickPos - sightWidth / 2
            else if (tickPos < sightMin)
              targetPos = tickPos - margin
            break;
        }
        // case "switchpage":{
        //     break;
        // }
        default:{
            throw "follow参数错误！";
            break;
        }
      } 
      if (targetPos != null)
        this.setProgressSliderPos(targetPos)
    },
    
    /* 事件：鼠标按下标记 */
    onMarkMouseDown(e, index) {
      if (e.which == 1){ // 左键按下
        this.markDragState.isDragging = true;
        let curMark = this.marks[index]
        if (e.ctrlKey){ // 复制模式
          let newMark = clone(curMark)
          this.marks.push(newMark)
          this.markDragState.draggingMark = newMark
        }
        else{
          this.markDragState.draggingMark = curMark
        }
      }
    },

    /* 事件：鼠标松开 */
    onMouseUp(e) {
      if (this.markDragState.isDragging && e.which == 1) { // 左键松开
        // 检查有无重叠，覆盖重叠的
        let draggingMark = this.markDragState.draggingMark
        let duplicateIndex = this.marks.findIndex((mark) => {
          return mark != draggingMark 
            && mark.text == draggingMark.text 
            && Math.abs(mark.tick - draggingMark.tick) < 0.001
        })
        if (duplicateIndex >= 0) {
          console.warn("覆盖原有标记")
          this.marks.splice(this.marks.indexOf(draggingMark), 1)
          this.marks[duplicateIndex] = draggingMark
        }
      }
      this.markDragState.isDragging = false
      this.markDragState.draggingMark = null

      this.progressSlider.dragging = false
    },

    /* 事件：鼠标移动 */
    onMouseMove(e){
      if (this.markDragState.isDragging){ // 有正在拖拽的标记
        let tick = this.getTickByCursor(e);
        this.markDragState.draggingMark.tick = tick
      }
    },
  },
  watch: {
    "setting.volume": function () {
      if (!this.audioPlayer.audio) return
      this.audioPlayer.audio.volume = this.setting.mute ? 0 : this.setting.volume
    },
    "setting.mute": function () {
      if (!this.audioPlayer.audio) return
      this.audioPlayer.audio.volume = this.setting.mute ? 0 : this.setting.volume
    }
  }
};
</script>

<style scoped>

a,
a:visited,
a:link,
a:active {
  color: #a88;
}
a:hover {
  color: white;
}

::selection {
  background-color: rgb(51, 61, 80);
  color: white;
}

.icon {
  width: 28px;
  height: 28px;
  pointer-events: none;
  fill: white;
}

.audio_player {
  position: relative;
  width: 100%;
  height: 100%;

  display: flex;
  flex-wrap: wrap;
  color: #ffddd3;
  font-size: 12px;

  background-color: #24414a;
  user-select: none;
}

.audio_button_zone {
  width: 100%;
  height: 40px;
  overflow: hidden;

  flex-wrap: nowrap;
}
.audio_button {
  width: 40px;
  height: 40px;
  margin: 0 5px;

  position: relative;
}
.audio_button_with_text {
  width: 40px;
  height: 40px;
  margin: 0 5px;

  position: relative;
}
.audio_button_with_text *{
  pointer-events: none;
  position: absolute;
}
.audio_button_with_text .icon {
  width: 20px;
  height: 20px;
  top: 4px;
}
.audio_button_with_text .text {
  width: 100%;
  height: 12px;
  bottom: 0;
}
.audio_button-seperater {
  width: 2px;
  height: 80%;
  border-radius: 4px;
  background-color: white;
  margin: 0px 5px;
}
#slider_audio_volume {
  position: relative;
  width: 100px;
}
#slider_audio_speed {
  position: relative;
  width: 100px;
}
#audio_play_icon,
#audio_pause_icon,
#audio_stop_icon {
  width: 28px;
  height: 28px;
}
#audio_slider_zone {
  position: relative;
  width: calc(100% - 40px);
  height: 100px;
  margin: 0 20px;
  overflow-x: scroll;

  display: flex;
  flex-wrap: nowrap;
}

#audio_slider_zone::-webkit-scrollbar-thumb {
  border-radius: 10px;
}

.audio_slider_blank {
  pointer-events: none;
  position: relative;
  background-color: transparent;
  width: 0;
  height: 100%;
  flex-shrink: 0;
}
#audio_slider_zone_scale {
  position: relative;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  flex-shrink: 0;
}
#audio_mark_table {
  pointer-events: none;
  width: calc(100% - 2px); /* 减去滑块宽度，避免百分比缩放导致的细微错位 */
  height: 100%;
  position: absolute;
}
.audio_mark {
  width: fit-content;
  min-width: 20px;
  height: 24px;
  position: absolute;
  left: 0;
  top: 0;
  transform: translateX(-50%);
  border-radius: 10px;
  background-color: #614840;
  pointer-events: all; /* 父物体取消了，但可以单独设置子物体！*/
  overflow: visible;
}
.audio_mark-name {
  position: relative;
  width: auto; /* 重要！如果设置为auto，则在最右侧标签宽度会收缩并贴在容器边缘... */
  font-size: 12px;
  padding: 0 8px;
  height: 100%;
}
.audio_mark-pin {
  pointer-events: none;
  width: 2px;
  height: 40px;
  position: absolute;
  left: calc(50% - 1px);
  top: 24px;
  background-color: #5b4e5b;
  opacity: 0.9;
}
#mark_context {
  position: fixed;
  width: 120px;
  z-index: 8;
  font-size: 14px;
  transform: translate(-50%, -100%);
  color: white;
}
#mark_context_div {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #54677c;
  border-radius: 4px;
  overflow: hidden;
}
#mark_context_name_zone {
  width: 80%;
  height: 40px;

  margin: 10px 0;

  position: relative;
  font-size: 6px;
  color: #aaa;
}
#mark_context_name {
  position: absolute;
  outline: none;
  border: 0;
  background-color: rgba(255, 255, 255, 0.1);
  width: 100%;
  height: 100%;
  text-align: center;
  font-size: 18px;
  color: #ffddd3;
}
#mark_context_locate {
  width: 80%;
  height: 30px;
  border-bottom: 1.5px solid #d5c2d5;
  margin: 5px 0;
  opacity: 0.8;
  cursor: pointer;
}
#mark_context_locate:hover {
  color: #d5c2d5;
  opacity: 1;
}
#mark_context_delete {
  width: 80%;
  height: 30px;
  border-bottom: 1.5px solid #ff625a;
  margin: 5px 0;
  opacity: 0.8;
  cursor: pointer;
}
#mark_context_delete:hover {
  color: #ff625a;
  opacity: 1;
}

#audio_waveform {
  pointer-events: none;
  position: absolute;
  width: 100%;
  height: 100%;
}

#slider_tick_progress {
  position: relative;
  height: 28px;
  margin: 0 5px;
  font-size: 16px;
}
#slider_tick_progress div {
  margin: 0 2px;
}
.slider_padding {
  position: relative;
  width: 100px;
  height: 100%;
  background-color: #16c;
}

/* 默认滑动条样式 */
.slider_default {
  -webkit-appearance: none; /* 移除默认样式 */
  width: 100%;

  height: 2px;
  margin: 10px 0;
  border-radius: 4px;
}
.slider_default:focus {
  /* 获取焦点后 */
  outline: none;
}
.slider_default::-webkit-slider-runnable-track {
  /* 轨道的样式 */
}
.slider_default::-webkit-slider-thumb {
  /* 滑块的样式 */
  -webkit-appearance: none; /* 移除默认样式 */
  background-color: #ffddd3;
  width: 16px;
  height: 16px;
  border-radius: 8px;
  cursor: pointer;
}

/* 播放进度条样式 */
#slider_music {
  position: relative;

  -webkit-appearance: none; /* 移除默认样式 */
  width: 100%;
  height: 100%;
  margin: 0;
  background-color: transparent;
}
#slider_music:focus {
  /* 获取焦点后 */
  outline: none;
}
#slider_music::-webkit-slider-thumb {
  /* 滑块的样式 */
  -webkit-appearance: none; /* 移除默认样式 */
  background-color: #e62c69;
  width: 2px;
  height: 70px;
  border-radius: 0;
  opacity: 0.9;
}

/* 切换按钮默认样式 */
/* The switch - the box around the slider */
.switch {
  position: relative;
  width: 43px;
  height: 100%;
  margin: 0 10px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 2px;
  left: 0;
  height: 20px;
  width: 40px;
  border: 1.5px solid white;
  -webkit-transition: 0.2s;
  transition: 0.2s;
  border-radius: 26px;
}

.slider:before {
  /* 圆球 */
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 2px;
  background-color: #ffddd3;
  -webkit-transition: 0.2s;
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .slider {
  border: 1.5px solid #ffddd3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #ffddd3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(18px);
  -ms-transform: translateX(18px);
  transform: translateX(18px);
}

.switch div {
  /* 文本 */
  pointer-events: none;
  position: absolute;
  width: 100%;
  height: 12px;
  bottom: 0;
}

.audio_hint_cover {
  position: absolute;
  height: 100%;
  width: 100%;
  color: #fdf9e0;
  font-size: 24px;
  background-color: rgba(80, 80, 80, 0.8);
  z-index: 1;
  transition: background-color 0.3s, color 0.3s;
}
.audio_hint_cover:hover {
  background-color: rgba(100, 100, 100, 0.8);
  color: #ff625a;
}
</style>