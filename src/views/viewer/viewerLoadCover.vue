<template>
  <TopCover :show="showLoadCover">
    <div>{{ loadStateString }}</div>
  </TopCover>
</template>

<script setup>
import { computed, defineProps } from "vue";
import { ELoadState } from "@/utils/common"
import TopCover from "@/components/topCover.vue"

const props = defineProps({
  state: {
    type: Number, // ELoadState
    default: ELoadState.Loaded,
  },
  message: {
    type: String,
    default: '',
  },
})

const loadStateString = computed(() => {
  switch (props.state) {
    case ELoadState.Loading: return "加载中...";
    case ELoadState.Loaded: return "加载完成";
    case ELoadState.Failed: return "曲谱解析失败" + (props.message ? `：${props.message}` : '');
    case ELoadState.Empty: return "未指定曲谱文件";
    default: return "未知状态";
  }
})

const showLoadCover = computed(() => {
  return props.state != ELoadState.Loaded;
})
</script>