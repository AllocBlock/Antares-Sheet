<template>
  <tab-box ref="tabBox" :style="globalCssVar" :state="tabState">
    <TabRow v-for="(row, rowIndex) in tabRows" :key="row" :bars="row" :row-number="rowIndex + 1"
      :first-bar-number="row[0].number" />
  </tab-box>
</template>


<script setup lang="ts">
// TODO: 不再把tabConfig当作参数传入，而是用provide/inject

import { computed, onMounted, reactive, ref, Ref, onBeforeUnmount, provide, readonly } from "vue";
import { SheetNode, ENodeType } from "@/utils/sheetNode";
import { Tab, TabConfig, parseTab } from "./tabParser";
import TabRow from "./row.vue";

const globalCssVar = reactive({
  "--string-num": "4",
  "--fret-font-size": "16px",
  "--row-split-width": "3px",
  "--bar-split-width": "1px",
  "--row-height": "60px",
  "--row-margin-top": "30px",
  "--stem-margin": "70px",
})

const tab: Ref<Tab> = ref(null)
const tabRows = reactive([])
const tabConfig = ref(new TabConfig())
const tabBox: Ref<HTMLElement> = ref(null)

provide('tabConfig', readonly(tabConfig))

let tabResizeObserver = null

const props = defineProps({
  node: {
    type: SheetNode,
    required: true,
    default: function () {
      let node = new SheetNode(ENodeType.Text);
      node.content = "未知节点";
      node.valid = true;
      return node;
    },
  },
})

const tabState = computed(() => {
  return props.node.valid ? "valid" : "invalid";
})

function updateTabLayout() {
  if (!tabBox.value) return
  tabRows.splice(0, tabRows.length)
  tabConfig.value = tab.value.config

  let width = tabBox.value.clientWidth
  const BarEspectWidth = 300
  let BarNum = Math.max(1, Math.round(width / BarEspectWidth))

  for (let i = 0; i < tab.value.bars.length; i += BarNum) {
    let row = []
    for (let k = i; k < i + BarNum && k < tab.value.bars.length; ++k) {
      let bar = tab.value.bars[k]
      bar.number = k + 1
      row.push(bar)
    }
    tabRows.push(row)
  }
}

onMounted(() => {
  tab.value = parseTab(props.node.content)
  updateTabLayout()

  let timer = null
  const delay = 200
  tabResizeObserver = new ResizeObserver(entries => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      updateTabLayout()
    }, delay)
  })
  tabResizeObserver.observe(tabBox.value)
})

onBeforeUnmount(() => {
  tabResizeObserver.disconnect()
})
</script>

<style scoped>
@font-face {
  font-family: MusicNotation;
  src: url(./fonts/Aruvarb.ttf);
}

tab-box {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 300px;
  color: var(--foreground-color);
  user-select: none;
}

tab-box[state="invalid"]>* {
  filter: blur(4px);
}

tab-box[state="invalid"]::before {
  content: "";
  position: absolute;
  left: -8px;
  right: -8px;
  top: -8px;
  bottom: -8px;
  background: rgba(255, 255, 255, 0.603);
  filter: blur(4px);
  z-index: 2;
}

tab-box[state="invalid"]:after {
  content: "指法谱不可用";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  color: var(--theme-color);
  font-size: 60px;

  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  z-index: 3;
  text-align: center;
}

:deep(svg) {
  fill: var(--foreground-color);
}
</style>