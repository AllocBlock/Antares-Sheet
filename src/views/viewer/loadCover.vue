<template>
  <transition name="trans_fade_out">
    <div id="cover" v-show="showLoadCover">
      <div>{{ loadStateString }}</div>
    </div>
  </transition>
</template>

<script type="module">
import { ELoadState } from "@/utils/common.js"

export default {
  name: "SheetViewerLoadCover",
  props: {
    state: {
      type: Number, // ELoadState
      default: ELoadState.Loaded,
    },
    message: {
      type: String,
      default: '',
    },
  },
  computed: {
    loadStateString: function () {
      switch (this.state) {
        case ELoadState.Loading: return "加载中...";
        case ELoadState.Loaded: return "加载完成";
        case ELoadState.Failed: return "曲谱解析失败" + (this.message ? `：${message}` : '');
        case ELoadState.Empty: return "未指定曲谱文件";
        default: return "未知状态";
      }
    },
    showLoadCover() {
      return this.state != ELoadState.Loaded;
    },
  },
}
</script>

<style scoped>
#cover {
  position: fixed;
  width: 100%;
  height: 100%;
  background-color: wheat;
  color: var(--sheet-theme-color);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 50px;
  letter-spacing: 5px;
  z-index: 20;
  margin-right: auto;
}

.trans_fade_out-enter-from, 
.trans_fade_out-leave-to{
	opacity: 0;
}
.trans_fade_out-enter-active{
	transition: opacity 0.1s;
}
.trans_fade_out-leave-active{
	transition: opacity 1s;
}
</style>
