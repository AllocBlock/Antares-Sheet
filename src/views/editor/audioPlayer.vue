<template>
  <div class="audio_player">
    <div
      v-show="this.loading || !this.loaded"
      class="audio_hint_cover flex_center"
      @click="selectMusic()"
    >{{this.loading ? "加载中..." : (!this.loaded ? "点击加载音乐~" : "加载完成" )}}</div>
    <div class="audio_button-zone flex_center">
      <div class="audio_button flex_center" @click="addMark()">
        <img src="@/assets/icons/mark.svg" type="image/svg+xml" />
      </div>
      <div class="audio_button flex_center" @click="prevMark()">
        <img src="@/assets/icons/prevArrow.svg" type="image/svg+xml" />
      </div>
      <div class="audio_button flex_center" @click="nextMark()">
        <img src="@/assets/icons/nextArrow.svg" type="image/svg+xml" />
      </div>
      <div class="audio_button flex_center" @click="deleteAllMark()">
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
        class="slider-default"
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
        class="slider-default"
      />

      <label class="switch">
        <input type="checkbox" onchange="updateFollowSwitch(this)" />
        <span class="slider"></span>
        <div id="audio_follow-text" class="flex_center">跟随关</div>
      </label>
    </div>
    <div id="audio_slider-zone">
      <div class="audio_slider-blank"></div>
      <div id="audio_slider-zone-scale" class="flex_center">
        <canvas id="audio_waveform" width="30000" height="50"></canvas>
        <input
          id="slider-music"
          type="range"
          min="0"
          :max="audioInfo.duration"
          step="0.01"
          v-model="audioInfo.curTick"
          @mousedown="onProgressSliderMouseDown"
          @change="onChangeProgressSlider()"
        />
        <div id="audio_mark-table"></div>
      </div>
      <div class="audio_slider-blank"></div>
    </div>
    <div class="audio_button-zone flex_center">
      <div class="audio_button flex_center" @click="togglePlay()">
        <img id="audio_pause-icon" :src="require(`@/assets/icons/${setting.playing ? 'pause' : 'play'}.svg`)" type="image/svg+xml" />
      </div>
      <div class="audio_button flex_center" @click="stop()">
        <img id="audio_stop-icon" src="@/assets/icons/stop.svg" type="image/svg+xml" />
      </div>

      <div id="slider-tick-progress" class="flex_center">
        <div id="slider-tick">{{ tickToTimeStr(audioInfo.curTick) }}</div>
        <div id="slider-seperate">/</div>
        <div id="slider-length">{{ tickToTimeStr(audioInfo.duration) }}</div>
      </div>
    </div>
  </div>
  <div id="mark-context" class="hide">
    <div id="mark-context-div">
      <div id="mark-context-name-zone" class="flex_center">
        <input type="text" id="mark-context-name" onchange="updateMarkName(this)" maxlength="10" />
      </div>
      <div id="mark-context-locate" class="flex_center" @click="markLocateClick()">定位到这里</div>
      <div id="mark-context-delete" class="flex_center" @click="markDeleteClick()">删除</div>
    </div>
  </div>
  <div id="audio_help" class="flex_center hide" @click="hideHelp()">
    <div id="audio_help-content" class="flex_center">
      <p style="font-size: 40px; color: #5ea9bc">音乐播放器~ By 锦瑟 2020年4月</p>
      <div class="audio_help-row flex_center">
        <div style="width: 50%;">
          <h1>介绍</h1>
          <p>这是一个音乐播放器。</p>
          <p>你可以方便的跳转到指定的进度，并在各个位置添加标记，以及跳转到各个标记。</p>
          <p style="display: block;">
            你需要加载本地的音乐文件。如果你不知道去哪儿找的话，可以试试这个网站：
            <a
              href="https://defcon.cn/dmusic/"
              target="_blank"
            >音乐搜索器</a>
          </p>
        </div>
        <div class="audio_help-sperator"></div>
        <div style="width: 50%;">
          <h1>页面布局</h1>
          <p>上方 - 标题，选择文件</p>
          <p>中间 - 没啥东西</p>
          <p>下方 - 进度条、播放控制以及标记功能</p>
          <h1>功能 和 快捷键</h1>
          <div class="audio_help-column">
            <p>
              <img src="@/assets/icons/mark.svg" type="image/svg+xml" /> 点击添加标记（快捷键W)
            </p>
            <p>
              <img src="@/assets/icons/prevArrow.svg" type="image/svg+xml" />
              上一个标记（快捷键Q)
            </p>
            <p>
              <img src="@/assets/icons/nextArrow.svg" type="image/svg+xml" />
              下一个标记（快捷键E)
            </p>
            <p>
              <img src="@/assets/icons/trash.svg" type="image/svg+xml" />
              删除所有标记
            </p>
            <p>
              <img src="@/assets/icons/volume.svg" type="image/svg+xml" />
              <img src="@/assets/icons/muted.svg" type="image/svg+xml" />
              音量/静音
            </p>
            <p>
              <img src="@/assets/icons/speed.svg" type="image/svg+xml" />
              播放速度
            </p>
            <p>
              <img src="@/assets/icons/play.svg" type="image/svg+xml" />
              <img src="@/assets/icons/pause.svg" type="image/svg+xml" />
              播放/暂停（快捷键Space)
            </p>
            <p>
              <img src="@/assets/icons/stop.svg" type="image/svg+xml" />
              停止
            </p>
            <p style="font-weight: bold;">标记上按右键可以打开编辑菜单！</p>
            <p style="font-weight: bold;">标记上按住Ctrl拖拽可以复制！</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="audio_help-icon-div" @click="showHelp()">
    <img src="@/assets/icons/help.svg" type="image/svg+xml" />
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
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

function drawWaveform(canvas, arrayBuffer, callback) {
  // 使用audiocontext解码音频(ArrayBuffer转AudioBuffer)
  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioCtx.decodeAudioData(arrayBuffer, cbAudioDecoded).catch(function (error) {
    Toast.show("解码文件失败，请选择正确的音频文件！", 1.5);
    this.loading = false;
    $("#audio_hint-cover").text("点击加载音乐~");
  });

  // 音频解码完毕的回调
  function cbAudioDecoded(buffer) {
    var pen = canvas.getContext("2d"); // 画笔
    // 关闭抗锯齿
    pen.webkitImageSmoothingEnabled = false;
    pen.mozImageSmoothingEnabled = false;
    pen.imageSmoothingEnabled = false;

    var data = buffer.getChannelData(0); // 第一轨的数据
    var dataLen = data.length; // 数据个数

    // 设置画布宽度
    $(canvas).attr("width", buffer.duration * 200);

    // 绘制参数
    var width = $(canvas).attr("width");
    var height = $(canvas).attr("height");
    var interval = 50; // 采样间隔
    var sampleCount = Math.floor(dataLen / interval); // 采样数
    var amp = height / 2; // 振幅是高度的一般（注意音频数据是有正负的,-1.0到1.0）

    // 开始绘制
    pen.clearRect(0, 0, width, height); // 清空画布
    pen.moveTo(0, amp); // 左侧中点开始

    for (var i = 0; i < sampleCount; i++) {
      // 求区间平均值
      var avg = 0.0;
      for (var j = 0; j < interval; j++) {
        avg += data[(i * interval) + j];
      }
      avg /= interval;
      // 画线
      var left = (i * interval) / dataLen * width;
      var top = avg * amp + amp;
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
      },
      timer: {
        curTick: null
      },
      progressSlider: {
        dragging: false
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
        this.audioPlayer.pause()
        this.audioPlayer.moveToTick(0)
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

var music = null
var currentScale = 1.0;
var musicDuration = null;
var isMusicSliderMoving = false;
var isPlayBeforeMoving = false;

var isMarkContextShow = false;

//     // 禁止切换按钮的键盘事件快捷键
//     $("input[type=checkbox]").keydown(function(e){
//         e.preventDefault();
//     });

//     // 美化进度条的滚动条
//     $("#audio_slider-zone").niceScroll({
//         cursorcolor: "#ffddd3",// 颜色
//         cursoropacitymax: 0.8, // 透明度
//         cursorwidth: "10px", // 宽度
//         cursorborder: "0", // 边框
//         cursorborderradius: "10px",// 圆角
//         autohidemode: true // 自动隐藏滚动条
//     });

//     // 播放进度条，滚轮缩放事件
//     $('#audio_slider-zone').scrollLeft(100); // 移动滚动条到中间
//     $("#audio_slider-zone").on('mousewheel DOMMouseScroll', function(event, delta) {
//         if (this.loaded && event.ctrlKey){
//             //console.log(event);
//             var normalWidth = $("#part-music").width();
//             var newScale = currentScale *(1 + delta/20);
//             newScale = Math.max(1, Math.min(musicDuration / 10, newScale));

//             $("#audio_slider-zone-scale").css("width", newScale * normalWidth);

//             // 更新滚动条！
//             // 进度条的滚动条
//             var $sliderZone = $("#audio_slider-zone");
//             $sliderZone.getNiceScroll().resize();
//             // 以鼠标位置为中心缩放..
//             var marginLeft = parseInt($("#audio_slider-zone").css("margin-left").replace("px", ""));
//             var padding = 100;
//             var cursorX = event.pageX - marginLeft; // 要减去margin

//             var newLeft = (-padding + $sliderZone.scrollLeft() + cursorX) / currentScale * newScale - cursorX + padding;
//             $sliderZone.scrollLeft(newLeft);
//             currentScale = newScale;

//         }
//         event.preventDefault(); // 接管
//         return false;
//     });

//     // 播放进度条，双击事件
//     $("#audio_slider-zone").dblclick(function() {
//         // 双击播放
//         if (this.loaded && music.paused){
//             resumeMusic();
//         }
//         event.preventDefault(); // 接管
//         return false;
//     });

//     // 标签右键菜单事件
//     $contextMenu = $("#mark-context");

//     // 标签输入框失去焦点
//     $("#mark-context-name").blur(function(){ // 失去焦点则隐藏菜单
//         hideMarkContext();
//     });

//     // 标签输入框键盘
//     $("#mark-context-name").keydown(function(e){
//         switch(e.which){
//             case 13: { // 回车
//                 $("#mark-context-name")[0].blur(); // 输入完成，自动失去焦点
//                 break;
//             }
//         }
//     });

//     // :)
//     console.log("哈喽！aloha~");
// });


// /* 添加标记 */
// function addMark(text = "标记", timeTick = null, overwrite = true){
//     if (music == null){
//         Toast.show("请先加载音乐！");
//         return;
//     }

//     // 默认放置到当前位置
//     if (timeTick == null) timeTick = music.currentTime; 
//     else timeTick = parseFloat(timeTick);

//     // 覆盖模式下，如果该位置已经有标记，则覆盖掉
//     if (overwrite){
//         $(".audio_mark").each(function(){
//             if ($(this).attr("data-tick") == timeTick){ 
//                 $(this).remove();
//             }
//         })
//     }


//     var $markTable = $("#audio_mark-table");

//     var $mark = $("<div class=\"audio_mark\"></div>");
//     var $markName = $("<div class=\"audio_mark-name flex_center\">{0}</div>".format(text));
//     var $markPin = $("<div class=\"audio_mark-pin\"></div>");
//     $mark.append($markName);
//     $mark.append($markPin);
//     // 绑定事件
//     $mark.contextmenu(markContextClick);
//     $mark.mousedown(markMouseDown);

//     // 放置标记
//     $markTable.append($mark); // 先添加，否则不会渲染，也就不知道元素宽度

//     var left = getMarkLeftByTick($mark[0], timeTick);
//     var top = 0;

//     $mark.css("left", left);
//     $mark.css("top", top);

//     // 附加信息
//     $mark.attr("data-tick", timeTick.toFixed(5)); // 标记所处的时间, toFixed解决精度问题！

//     // 特效
//     $mark.hide();
//     $mark.fadeIn(150);

//     // 返回标记
//     return $mark;
// }

// /* 删除标记 */
// function deleteMark($mark){
//     $mark.css("pointer-events", "none"); // 先关闭按键响应
//     $mark.fadeOut(200, function(){
//         $mark.remove();
//     })
// }

// /* 删除所有标记 */
// function deleteAllMark(){
//     if (confirm("删除所有标记？")){
//         deleteMark($(".audio_mark"));
//     }
// }

// /* 上一个标记 */
// function prevMark(){
//     if (this.loaded){
//         var $targetMark = null;
//         var cTime = music.currentTime.toFixed(5);
//         $(".audio_mark").each(function(){
//             //console.log(cTime, $(this).attr("data-tick"), $targetMark == null?"":$targetMark.attr("data-tick"));
//             var cDataTick = parseFloat($(this).attr("data-tick"));
//             var tDataTick = $targetMark == null ? null : parseFloat($targetMark.attr("data-tick"));
//             if (cDataTick < cTime){
//                 if ($targetMark == null || cDataTick > tDataTick){
//                     $targetMark = $(this);
//                 }
//             }
//         })
//         if ($targetMark == null){
//             keepTickInSight(0);
//             moveToTick(0);
//         }
//         else{
//             keepTickInSight($targetMark.attr("data-tick"));
//             moveToTick($targetMark.attr("data-tick"));
//         }
//     }
// }
// /* 下一个标记 */
// function nextMark(){
//     if (this.loaded){
//         var $targetMark = null;
//         var cTime = music.currentTime.toFixed(5);
//         $(".audio_mark").each(function(){
//             //console.log(cTime, $(this).attr("data-tick"), $targetMark == null?"":$targetMark.attr("data-tick"));
//             var cDataTick = parseFloat($(this).attr("data-tick"));
//             var tDataTick = $targetMark == null ? null : parseFloat($targetMark.attr("data-tick"));
//             if (cDataTick > cTime){
//                 if ($targetMark == null || cDataTick < tDataTick){
//                     $targetMark = $(this);
//                 }
//             }
//         })
//         if ($targetMark != null){
//             keepTickInSight($targetMark.attr("data-tick"));
//             moveToTick($targetMark.attr("data-tick"));
//         }
//     }
// }

// /* 事件：移动到标记 */
// function markLocateClick(){
//     if ($currentMark != null){
//         var cTime = $currentMark.attr("data-tick");
//         music.currentTime = cTime;
//         $("#slider-music").val(cTime);
//         $("#slider-tick").text(tickToText(cTime));
//     }
// }
// /* 事件：删除标记 */
// function markDeleteClick(){
//     deleteMark($currentMark);
//     $currentMark = null;
// }

// var isMarkDragging = false;
// var isCopyingMark = false;
// var $markDrag = null;
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
//         var tick = getTickByCursor(e.pageX);
//         var left = getMarkLeftByTick($markDrag[0], tick);

//         $markDrag.css("left", left);
//         $markDrag.attr("data-tick", tick.toFixed(5)); // 标记所处的时间
//     }
// }
// var $currentMark = null;
// /* 事件：标记上右键 */
// function markContextClick(e){
//     //console.log("点击了右键");
//     e.preventDefault(); // 禁止默认右键菜单

//     $currentMark = $(this);

//     // 设置右键菜单
//     $contextMenu = $("#mark-context");
//     $contextMenuName = $("#mark-context-name");
//     $contextMenuName.val($currentMark.text());
//     // 移动右键菜单
//     // var left = $(this).offset().left - $(this).width()/2;
//     // var top = $(this).offset().top - $contextMenu.height()/2 - 20;
//     var left = $currentMark.offset().left + $currentMark.innerWidth()/2 - $contextMenu.width()/2;
//     left = Math.max(0, Math.min($(document).width() - $contextMenu.width(), left)); // 防止超出屏幕
//     var top = $currentMark.offset().top - $contextMenu.height() - 20;
//     $contextMenu.css("left", left);
//     $contextMenu.css("top", top);
//     // 显示右键菜单
//     isMarkContextShow = true;
//     $contextMenu.stop(true, true).show().animate({opacity: 1}, 200); 
//     // 文本框获取焦点
//     $contextMenuName[0].focus();
// }
// /* 更新事件：更新编辑框 */
// function updateMarkName(input){
//     if ($currentMark == null) return;
//     $currentMark.children(".audio_mark-name").text($(input).val());
//     var tick = $currentMark.attr("data-tick"); // 使用data-tick, 可能有误差...
//     $currentMark.css("left", getMarkLeftByTick($currentMark[0], tick)); 
// }
// /* 隐藏右键菜单 */
// function hideMarkContext(){
//     isMarkContextShow = false;
//     $contextMenu.stop(true, true).animate({opacity: 0}, 300, function(){
//         $contextMenu.hide();
//     });
// }


// /* 由鼠标位置计算对应的刻度 */
// function getTickByCursor(x){
//     if (this.loaded){

//         var marginLeft = parseInt($("#audio_slider-zone").css("margin-left").replace("px", ""));
//         var padding = 100;
//         x = x - marginLeft; // 要减去margin
//         var leftInSlider = $("#audio_slider-zone").scrollLeft() + x - padding;
//         var barWidth = $("#audio_slider-zone-scale").width(); // 父物体长度

//         var tick = (leftInSlider / barWidth) * musicDuration;
//         tick = Math.max(0, Math.min(musicDuration, tick)); // 范围限制
//         return tick;
//     }
//     return -1;
// }

// /* 由tick计算mark的left */
// function getMarkLeftByTick(mark, tick){
//     var $mark = $(mark);
//     if (this.loaded){
//         var markWidth = $mark.innerWidth();
//         var percentage = (tick / musicDuration) * 100;
//         percentage = Math.max(0, Math.min(100, percentage)); // 限制范围
//         var offset = markWidth/2;
//         var left = "calc({0}% - {1}px".format(percentage, offset);
//         return left;
//     }
//     return -1;
// }

// /* 保证视野内可以看见tick的位置 */
// function keepTickInSight(tick, follow = "none"){
//     var sightWidth = $("#audio_slider-zone").width();
//     var canvasWidth = $("#audio_slider-zone-scale").width();
//     var padding = 100;
//     var cLeft = $("#audio_slider-zone").scrollLeft();
//     var maxScrollLeft = canvasWidth + 2 * padding - sightWidth;


//     var tickPos = padding + tick / musicDuration * canvasWidth;
//     switch(follow){
//         case "none":{
//             if (tickPos < cLeft + padding){ // 处于左侧区域，或左侧看不见的区域
//                 var newLeft = Math.max(0, Math.min(maxScrollLeft, tickPos - padding));
//                 $("#audio_slider-zone").scrollLeft(newLeft);
//             }
//             else if (tickPos > cLeft + sightWidth - padding){ // 处于左侧区域，或左侧看不见的区域
//                 var newLeft = Math.max(0, Math.min(maxScrollLeft, tickPos + padding - sightWidth));
//                 $("#audio_slider-zone").scrollLeft(newLeft);
//             }
//             break;
//         }
//         case "left":{
//             var newLeft = Math.max(0, Math.min(maxScrollLeft, tickPos - padding));
//             $("#audio_slider-zone").scrollLeft(newLeft);
//             break;
//         }
//         case "right":{
//             var newLeft = Math.max(0, Math.min(maxScrollLeft, tickPos + padding - sightWidth));
//             $("#audio_slider-zone").scrollLeft(newLeft);
//             break;
//         }
//         case "center":{
//             var newLeft = Math.max(0, Math.min(maxScrollLeft, tickPos - sightWidth/2));
//             $("#audio_slider-zone").scrollLeft(newLeft);
//             break;
//         }
//         case "inleft":{ // 保证在屏幕内，左侧半边，到右侧时则强制居中
//             var newLeft = Math.max(0, Math.min(maxScrollLeft, tickPos - sightWidth/2));
//             if (tickPos >= cLeft + sightWidth/2){ // 在屏幕右侧，则居中
//                 $("#audio_slider-zone").scrollLeft(newLeft);
//             }
//             else if (tickPos < cLeft){ // 在看不见的左侧，放到最左
//                 $("#audio_slider-zone").scrollLeft(Math.max(0, Math.min(maxScrollLeft, tickPos)));
//             }

//             break;
//         }
//         // case "switchpage":{
//         //     break;
//         // }
//         default:{
//             throw "keepTickInSight follow参数错误！";
//             break;
//         }
//     } 
// }


// /* 显示音乐播放器加载提示 */
// function showMusicCover(){
//     $("#audio_hint-cover").stop(true, true).show().animate({opacity: 1}, 500); // 主要是更改文件时
// }
// /* 隐藏音乐播放器加载提示 */
// function hideMusicCover(){
//     $("#audio_hint-cover").css("pointer-events", "none"); // 暂时关闭事件
//     $("#audio_hint-cover").stop(true, true).animate({opacity: 0}, 500, function(){
//         $("#audio_hint-cover").hide();
//         $("#audio_hint-cover").text("点击加载音乐~");
//         $("#audio_hint-cover").removeClass("pointer-events"); // 暂时关闭事件
//     }); // 主要是更改文件时
// }


// var this.loading = false;

// var sightFollow = false;
// /* 轮询：根据歌曲进度更新进度条 */
// function updateMusicSliderAuto(){
//     if (music != null && !music.paused && !isMusicSliderMoving){ // 音乐已加载，正在播放且没有拖拽进度条
//         //console.log("音乐更新进度条");
//         var cTime = music.currentTime;
//         // 更新进度条
//         $("#slider-music").val(cTime);
//         //$("#slider-music").css('background', bgRaw.format(sliderFrontColor, (cTime/musicDuration)*100));
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

// /* 文件拖拽 */

// document.addEventListener("dragover", eventMuted);
// document.addEventListener("dragenter", eventMuted);
// document.addEventListener("dragleave", eventMuted);
// function eventMuted(e){
//     e.preventDefault();
// }

// document.addEventListener("drop", eventFileDrop)
// function eventFileDrop(e){
//     //console.log("拖放文件", e);
//     e.preventDefault();

//     if (this.loading){
//         Toast.show("等一下~正在加载上一个文件~");
//         return;
//     }
//     // 检查是否是文件
//     if (e.dataTransfer.files.length == 0){
//         return;
//     }
//     var file = e.dataTransfer.files[0];

//     // 显示并改变文本
//     $("#audio_hint-cover").text("加载中...");
//     showMusicCover();

//     // 加载音乐
//     loadMusic(file);
// }

// /* 开启帮助面板 */
// function showHelp(){
//     $("#audio_help").fadeIn(200);
// }

// /* 关闭帮助面板 */
// function hideHelp(){
//     $("#audio_help").fadeOut(300);
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
#audio_help {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  color: #ffddd3;
  z-index: 5;
}
#audio_help-content {
  position: absolute;
  width: 100%;
  height: 100%;
  flex-direction: column;
}
#audio_help-content p {
  margin: 3px 0;
  display: flex;
  align-items: center;
}
#audio_help-content img {
  margin: 0 10px 0 0;
}
#audio_help-content h1 {
  font-size: 24px;
  color: white;
  margin: 5px 0;
}
.audio_help-column {
  display: flex;
  flex-direction: column;
  align-items: left;
}
.audio_help-row {
  width: 80%;
}
.audio_help-sperator {
  position: relative;
  width: 2px;
  height: 80%;
  background-color: white;
  margin: 0 10px;
  opacity: 0.5;
}

#audio_help-icon-div {
  pointer-events: all;
  position: absolute;
  width: 30px;
  height: 30px;
  left: 5px;
  bottom: 5px;
  opacity: 0.5;
  transition: opacity 0.2s;
}
#audio_help-icon-div:hover {
  opacity: 1;
}
#audio_help-icon-div img {
  width: 30px;
  height: 30px;
}

.audio_button-zone {
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
#audio_slider-zone {
  position: relative;
  width: calc(100% - 40px);
  height: 100px;
  margin: 0 20px;

  display: flex;
  flex-wrap: nowrap;
}
.audio_slider-blank {
  pointer-events: none;
  position: relative;
  background-color: transparent;
  width: 100px;
  height: 100%;
  flex-shrink: 0;
}
#audio_slider-zone-scale {
  position: relative;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  flex-shrink: 0;
}
#audio_mark-table {
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
#mark-context {
  position: absolute;
  width: 120px;
  z-index: 8;
  font-size: 14px;
  opacity: 0.5;
}
#mark-context-div {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #54677c;
  border-radius: 4px;
  overflow: hidden;
}
#mark-context-name-zone {
  width: 80%;
  height: 40px;

  margin: 10px 0;

  position: relative;
  font-size: 6px;
  color: #aaa;
}
#mark-context-name {
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
#mark-context-locate {
  width: 80%;
  height: 30px;
  border-bottom: 1.5px solid #d5c2d5;
  margin: 5px 0;
  opacity: 0.8;
}
#mark-context-locate:hover {
  color: #d5c2d5;
  opacity: 1;
}
#mark-context-delete {
  width: 80%;
  height: 30px;
  border-bottom: 1.5px solid #ff625a;
  margin: 5px 0;
  opacity: 0.8;
}
#mark-context-delete:hover {
  color: #ff625a;
  opacity: 1;
}

#audio_waveform {
  pointer-events: none;
  position: absolute;
  width: 100%;
  height: 100%;
}

#slider-tick-progress {
  position: relative;
  height: 28px;
  margin: 0 5px;
  font-size: 16px;
}
#slider-tick-progress div {
  margin: 0 2px;
}
.slider-padding {
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
.slider-default {
  -webkit-appearance: none; /* 移除默认样式 */
  width: 100%;

  height: 2px;
  margin: 10px 0;
  border-radius: 4px;
}
.slider-default:focus {
  /* 获取焦点后 */
  outline: none;
}
.slider-default::-webkit-slider-runnable-track {
  /* 轨道的样式 */
}
.slider-default::-webkit-slider-thumb {
  /* 滑块的样式 */
  -webkit-appearance: none; /* 移除默认样式 */
  background-color: #ffddd3;
  width: 16px;
  height: 16px;
  border-radius: 8px;
  cursor: pointer;
}

/* 播放进度条样式 */
#slider-music {
  position: relative;

  -webkit-appearance: none; /* 移除默认样式 */
  width: 100%;
  height: 100%;
  margin: 0;
  background-color: transparent;
}
#slider-music:focus {
  /* 获取焦点后 */
  outline: none;
}
#slider-music::-webkit-slider-thumb {
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
</style>