<template>
  <div class="audio_player">
    <div
      v-show="this.loading || !this.loaded"
      class="audio_hint_cover flex_center"
      @click="selectMusic()"
    >{{this.loading ? "加载中..." : (!this.loaded ? "点击加载音乐~" : "加载完成" )}}</div>
    <div class="audio_button_zone flex_center">
      <div class="audio_button flex_center" @click="addMark()">
        <img src="@/assets/icons/mark.svg" type="image/svg+xml" />
      </div>
      <div class="audio_button flex_center" @click="jumpToPrevMark()">
        <img src="@/assets/icons/prevArrow.svg" type="image/svg+xml" />
      </div>
      <div class="audio_button flex_center" @click="jumpToNextMark()">
        <img src="@/assets/icons/nextArrow.svg" type="image/svg+xml" />
      </div>
      <div class="audio_button flex_center" @click="removeAllMark()">
        <img src="@/assets/icons/trash.svg" type="image/svg+xml" />
      </div>

      <div class="audio_button-seperater"></div>

      <div class="audio_button-with-text flex_center" @click="toggleMute()">
        <img id="audio_volume-icon" src="@/assets/icons/volume.svg" type="image/svg+xml" />
        <img id="audio_mute-icon" src="@/assets/icons/muted.svg" type="image/svg+xml" class="hide" />
        <div
          id="audio_volume-text"
          class="flex_center"
        >{{ setting.mute ? "静音" : Math.round(setting.volume * 100) + "%" }}</div>
      </div>
      <input
        id="slider-audio_volume"
        type="range"
        min="0"
        max="1.0"
        step="0.01"
        v-model="setting.volume"
        class="slider_default"
      />

      <div class="audio_button-with-text flex_center" @click="resetSpeed()">
        <img src="@/assets/icons/speed.svg" type="image/svg+xml" />
        <div id="audio_speed-text" class="flex_center">×{{ parseFloat(setting.speed).toFixed(1) }}</div>
      </div>
      <input
        id="slider-audio_speed"
        type="range"
        min="1"
        max="10"
        step="1"
        v-model="setting.speedLevel"
        @input="updateSpeed()"
        class="slider_default"
      />

      <label class="switch">
        <input type="checkbox" v-model="setting.follow" />
        <span class="slider"></span>
        <div id="audio_follow-text" class="flex_center">跟随{{setting.follow ? "开" : "关"}}</div>
      </label>
    </div>
    <div id="audio_slider_zone" ref="progressSliderZone" @scroll="onScrollProgressSlider">
      <div class="audio_slider_blank" :style="`width: ${progressSlider.padding}px`"></div>
      <div id="audio_slider_zone_scale" class="flex_center" ref="progressSlider"
        :style="`width: ${progressSlider.scale * 100}%`"
        @wheel="onWheelProgressSlider"
      >
        <canvas id="audio_waveform" width="30000" height="50"></canvas>
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
          <div class="audio_mark" :style="getMarkStyle(mark)" v-for="mark in marks" :key="mark" @contextmenu.prevent="onContextMark($event, mark)">
            <div class="audio_mark-name flex_center">{{mark.text}}</div>
            <div class="audio_mark-pin"></div>
          </div>
        </div>
      </div>
      <div class="audio_slider_blank" :style="`width: ${progressSlider.padding}px`"></div>
    </div>
    <div class="audio_button_zone flex_center">
      <div class="audio_button flex_center" @click="togglePlay()">
        <img id="audio_pause-icon" :src="require(`@/assets/icons/${setting.playing ? 'pause' : 'play'}.svg`)" type="image/svg+xml" />
      </div>
      <div class="audio_button flex_center" @click="stop()">
        <img id="audio_stop-icon" src="@/assets/icons/stop.svg" type="image/svg+xml" />
      </div>

      <div id="slider_tick_progress" class="flex_center">
        <div id="slider-tick">{{ tickToTimeStr(audioInfo.curTick) }}</div>
        <div id="slider-seperate">/</div>
        <div id="slider-length">{{ tickToTimeStr(audioInfo.duration) }}</div>
      </div>
    </div>
  </div>
  
  <div id="mark_context" v-show="markContext.show" :style="markContext.style" @mouseenter="onMarkContextMouseenter" @mouseleave="onMarkContextMouseleave">
    <div id="mark_context_div">
      <div id="mark_context_name_zone" class="flex_center">
        <input type="text" id="mark_context_name" v-model="markContext.mark.text" maxlength="10" ref="markContextInput" @blur="onMarkContextBlur"/>
      </div>
      <div id="mark_context_locate" class="flex_center" @click="jumpToMark(markContext.mark); markContext.show = false">定位到这里</div>
      <div id="mark_context_delete" class="flex_center" @click="removeMark(markContext.mark); markContext.show = false">删除</div>
    </div>
  </div>
</template>

<script>
import $ from "jquery";
import Toast from "@/utils/toast";
import WebAudioPlayer from "@/utils/webAudioPlayer";
import HotKey from "@/utils/hotKey";
import { getEnv } from "@/utils/webCommon.js";
import timeSignatureVue from "../../components/webSheet/pluginTab/timeSignature.vue";

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
/* 库函数：base64(dataurl)转binary */
function base64ToArrayBuffer(base64) {
  let binary_string = window.atob(base64);
  let len = binary_string.length;
  let bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

function drawWaveform(canvas, arrayBuffer, callback) {
  // 使用audiocontext解码音频(ArrayBuffer转AudioBuffer)
  let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioCtx.decodeAudioData(arrayBuffer, cbAudioDecoded).catch(function (error) {
    Toast.show("解码文件失败，请选择正确的音频文件！", 1.5);
    this.loading = false;
    $("#audio_hint-cover").text("点击加载音乐~");
  });

  // 音频解码完毕的回调
  function cbAudioDecoded(buffer) {
    let pen = canvas.getContext("2d"); // 画笔
    // 关闭抗锯齿
    pen.webkitImageSmoothingEnabled = false;
    pen.mozImageSmoothingEnabled = false;
    pen.imageSmoothingEnabled = false;

    let data = buffer.getChannelData(0); // 第一轨的数据
    let dataLen = data.length; // 数据个数

    // 设置画布宽度
    $(canvas).attr("width", buffer.duration * 200);

    // 绘制参数
    let width = $(canvas).attr("width");
    let height = $(canvas).attr("height");
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

    if (callback) callback()
  }

}

export default {
  name: "SheetEditorAudioPlayer",
  data() {
    return {
      loading: false,
      loaded: false,
      audioPlayer: null,
      audioInfo: {
        duration: 0,
        curTick: 0,
      },
      setting: {
        playing: false,
        speedLevel: 6,
        speed: 1.0,
        volume: 0.5,
        mute: false,
        follow: false
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
      }
    };
  },
  created() {
    this.audioPlayer = new WebAudioPlayer
    document.addEventListener("mouseup", this.onMouseUp)
    HotKey.addListener(" ", false, false, false, (e) => {
      e.preventDefault()
      this.togglePlay()
    })
    HotKey.addListener("w", false, false, false, () => this.addMark())
    HotKey.addListener("q", false, false, false, () => this.jumpToPrevMark())
    HotKey.addListener("e", false, false, false, () => this.jumpToNextMark())
  },
  methods: {
    getEnv,
    tickToTimeStr(tick) {
      let second = Math.floor(tick); // 取整
      let minute = Math.floor(second / 60); // 计算分钟
      second = second - minute * 60; // 计算秒数
      return `${(minute).toString().padStart(2, '0')}:${(second).toString().padStart(2, '0')}`;
    },
    selectMusic() {
      // 如果正在加载，则暂时禁止选择文件
      if (this.loading) {
        return;
      }
      // 打开文件选择框
      let $fileInput = $("<input type=\"file\">");
      $fileInput.change((e) => {
        this.loading = true
        this.loadAudio(e.currentTarget.files[0]);
      });
      $fileInput.click();
    },
    /* 加载音乐 */
    loadAudio(file) {
      if (file == null) {
        Toast.show("打开文件失败！");
        return;
      }

      this.loaded = false;
      this.loading = true;
      this.audioPlayer.load(file, (data) => {
        let base64 = data.replace(/.*base64,/, ""); // DataUrl转Base64
        drawWaveform($("#audio_waveform")[0], base64ToArrayBuffer(base64), () => {
          this.loading = false
          this.loaded = timeSignatureVue
        });
      }, () => {
        this.audioInfo.duration = this.audioPlayer.audio.duration
        this.audioPlayer.moveToTick(0)
      }, () => {
        this.pause()
      })
    },
    togglePlay() {
      if (!this.loaded) {
        Toast.show("请先加载音乐！");
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
          let curTick = this.audioPlayer.audio.currentTime
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
      this.audioPlayer.moveToTick(0)
      this.audioInfo.curTick = 0
    },
    toggleMute() {
      this.setting.mute = !this.setting.mute
    },
    onChangeProgressSlider() {
      this.audioPlayer.moveToTick(this.audioInfo.curTick)
      this.progressSlider.dragging = false
    },
    onProgressSliderMouseDown() {
      this.progressSlider.dragging = true
    },
    onMouseUp() {
      this.progressSlider.dragging = false
    },
    updateSpeed() {
      let speedLevel = parseInt(this.setting.speedLevel)
      this.setting.speed = PlaybackSpeedLevels[speedLevel]
      this.audioPlayer.audio.playbackRate = this.setting.speed
    },
    resetSpeed() {
      this.setting.speedLevel = 6
      this.updateSpeed()
    },
    addMark(text = "标记", timeTick = null, overwrite = true) {
      if (!this.loaded) {
          Toast.show("请先加载音乐！");
          return;
      }

      timeTick = timeTick ? parseFloat(timeTick) : this.audioPlayer.audio.currentTime
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
      if (this.loaded) {
          let percentage = (mark.tick / this.audioInfo.duration) * 100;
          percentage = Math.max(0, Math.min(100, percentage)); // 限制范围
          let left = `${percentage}%`
          style = {left}
      }
      return style;
    },
    jumpToMark(mark) {
      this.audioPlayer.audio.currentTime = mark.tick
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
      let offset = $(e.currentTarget).offset()
      let width = $(e.currentTarget).width()
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
    getProgressSliderPos() {
      return this.$refs.progressSliderZone.scrollLeft
    },
    setProgressSliderPos(pos) {
      this.$refs.progressSliderZone.scrollLeft = pos
    },
    getTickByCursor(e){
      if (this.loaded){
        let x
        if (e.pageX) { 
            x = e.pageX; 
        } 
        else { 
            x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
        }
        const padding = this.progressSlider.padding
        let originalPosX = x + this.getProgressSliderPos();
        let originalPercentage = (originalPosX - padding) / this.$refs.progressSlider.clientWidth
        let tick = originalPercentage * this.audioInfo.duration;
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
    }
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

let music = null
let currentScale = 1.0;
let musicDuration = null;
let isMusicSliderMoving = false;
let isPlayBeforeMoving = false;

let isMarkContextShow = false;

//     // 美化进度条的滚动条
//     $("#audio_slider_zone").niceScroll({
//         cursorcolor: "#ffddd3",// 颜色
//         cursoropacitymax: 0.8, // 透明度
//         cursorwidth: "10px", // 宽度
//         cursorborder: "0", // 边框
//         cursorborderradius: "10px",// 圆角
//         autohidemode: true // 自动隐藏滚动条
//     });

//     // 播放进度条，滚轮缩放事件
//     $('#audio_slider_zone').scrollLeft(100); // 移动滚动条到中间
//     $("#audio_slider_zone").on('mousewheel DOMMouseScroll', function(event, delta) {
//         if (this.loaded && event.ctrlKey){
//             //console.log(event);
//             let normalWidth = $("#part-music").width();
//             let newScale = currentScale *(1 + delta/20);
//             newScale = Math.max(1, Math.min(musicDuration / 10, newScale));

//             $("#audio_slider_zone_scale").css("width", newScale * normalWidth);

//             // 更新滚动条！
//             // 进度条的滚动条
//             let $sliderZone = $("#audio_slider_zone");
//             $sliderZone.getNiceScroll().resize();
//             // 以鼠标位置为中心缩放..
//             let marginLeft = parseInt($("#audio_slider_zone").css("margin-left").replace("px", ""));
//             let padding = 100;
//             let cursorX = event.pageX - marginLeft; // 要减去margin

//             let newLeft = (-padding + $sliderZone.scrollLeft() + cursorX) / currentScale * newScale - cursorX + padding;
//             $sliderZone.scrollLeft(newLeft);
//             currentScale = newScale;

//         }
//         event.preventDefault(); // 接管
//         return false;
//     });

//     // 播放进度条，双击事件
//     $("#audio_slider_zone").dblclick(function() {
//         // 双击播放
//         if (this.loaded && music.paused){
//             resumeMusic();
//         }
//         event.preventDefault(); // 接管
//         return false;
//     });

//     // 标签右键菜单事件
//     $contextMenu = $("#mark_context");

//     // 标签输入框失去焦点
//     $("#mark_context_name").blur(function(){ // 失去焦点则隐藏菜单
//         hideMarkContext();
//     });

//     // 标签输入框键盘
//     $("#mark_context_name").keydown(function(e){
//         switch(e.which){
//             case 13: { // 回车
//                 $("#mark_context_name")[0].blur(); // 输入完成，自动失去焦点
//                 break;
//             }
//         }
//     });

//     // :)
//     console.log("哈喽！aloha~");
// });

// let isMarkDragging = false;
// let isCopyingMark = false;
// let $markDrag = null;
// /* 事件：鼠标按下标记 */
// function markMouseDown(e){
//     //console.log("鼠标左键按下标记");
//     if (e.which == 1){ // 左键按下
//         isMarkDragging = true;
//         if (e.ctrlKey){ // 复制模式
//             //Toast.show("复制");
//             isCopyingMark = true;
//             $markDrag = addMark($(this).text(), $(this).attr("data-tick"), false);
//         }
//         else{
//             $markDrag = $(this);
//         }
//     }
// }
// /* 事件：鼠标松开 */
// $(document).mouseup(mouseUp);
// function mouseUp(e){
//     if (isMarkDragging && e.which == 1){ // 左键松开
//         //console.log("鼠标左键松开");
//         if (isCopyingMark){ // 复制模式
//             // 检查有无重叠，覆盖重叠的（主要是针对点一下又松开的情况？
//             $(".audio_mark").each(function(){
//                 if ($(this)[0] != $markDrag[0] && $(this).attr("data-tick") == $markDrag.attr("data-tick")){ 
//                     $(this).remove();
//                 }
//             })
//             isCopyingMark = false;
//         }
//         isMarkDragging = false;
//         $markDrag = null;

//     }
// }
// /* 事件：鼠标移动 */
// $(document).mousemove(mouseMove);
// function mouseMove(e){
//     if (isMarkDragging){ // 有正在拖拽的标记
//         //console.log("鼠标拖拽");
//         let tick = getTickByCursor(e.pageX);
//         let left = getMarkLeftByTick($markDrag[0], tick);

//         $markDrag.css("left", left);
//         $markDrag.attr("data-tick", tick.toFixed(5)); // 标记所处的时间
//     }
// }

// /* 由tick计算mark的left */
// function getMarkLeftByTick(mark, tick){
//     let $mark = $(mark);
//     if (this.loaded){
//         let markWidth = $mark.innerWidth();
//         let percentage = (tick / musicDuration) * 100;
//         percentage = Math.max(0, Math.min(100, percentage)); // 限制范围
//         let offset = markWidth/2;
//         let left = "calc({0}% - {1}px".format(percentage, offset);
//         return left;
//     }
//     return -1;
// }

// let this.loading = false;

// let sightFollow = false;
// /* 轮询：根据歌曲进度更新进度条 */
// function updateMusicSliderAuto(){
//     if (music != null && !music.paused && !isMusicSliderMoving){ // 音乐已加载，正在播放且没有拖拽进度条
//         //console.log("音乐更新进度条");
//         let cTime = music.currentTime;
//         // 更新进度条
//         $("#slider_music").val(cTime);
//         //$("#slider_music").css('background', bgRaw.format(sliderFrontColor, (cTime/musicDuration)*100));
//         // 更新文本
//         $("#slider-tick").text(tickToText(cTime));

//         if (sightFollow){
//             keepTickInSight(cTime, "inleft");
//         }
//     }
// }

// setInterval(updateMusicSliderAuto, musicSliderUpdateTime);

// /* 切换是否跟随的按钮 */
// function updateFollowSwitch(switchButton){
//     //console.log($(switchButton).is(":checked"));
//     sightFollow = $(switchButton).is(":checked");
//     if (sightFollow){
//         $("#audio_follow-text").text("跟随开");
//         // 提示
//         Toast.show("视角跟随进度条 - 开启");
//     }
//     else{
//         $("#audio_follow-text").text("跟随关");
//         // 提示
//         Toast.show("视角跟随进度条 - 关闭");
//     }
// }
</script>

<style scoped src="./common.css">
</style>

<style scoped>
img {
  width: 28px;
  height: 28px;
  pointer-events: none;
}

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
.audio_button-with-text {
  width: 40px;
  height: 40px;
  margin: 0 5px;

  position: relative;
}
.audio_button-with-text img {
  pointer-events: none;
  position: absolute;
  width: 20px;
  height: 20px;
  top: 4px;
}
.audio_button-with-text div {
  pointer-events: none;
  position: absolute;
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
#slider-audio_volume {
  position: relative;
  width: 100px;
}
#slider-audio_speed {
  position: relative;
  width: 100px;
}
#audio_play-icon,
#audio_pause-icon,
#audio_stop-icon {
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
  position: absolute;
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

.flex_center {
  display: flex;
  align-items: center;
  justify-content: center;
}
.hide {
  display: none;
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