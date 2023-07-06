<template>
  <TopCover :show="showLoadCover">
    <div>{{ loadStateString }}</div>
  </TopCover>
</template>

<script type="module">
import { ELoadState } from "@/utils/common"
import TopCover from "@/components/topCover.vue"

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
        case ELoadState.Failed: return "曲谱解析失败" + (this.message ? `：${this.message}` : '');
        case ELoadState.Empty: return "未指定曲谱文件";
        default: return "未知状态";
      }
    },
    showLoadCover() {
      return this.state != ELoadState.Loaded;
    },
  }
}
</script>