<template>
  <div class="container" ref="container" :style="globalCssVar">
    <template v-if="sheetTree" ref="sheet">
      <SheetNodeRoot :node="sheetTree" :events="events"/>
    </template>
    <template v-else>曲谱加载中...</template>
  </div>
</template>

<script>
import Chord from "@/components/chord"
import SheetNodeRoot from "./root"
import { SheetNode } from "@/utils/sheetNode.js"

export default {
  name: "WebSheet",
  components: {
    Chord, SheetNodeRoot
  },
  data() {
    return {
      globalCssVar: {
        // "--sheet-theme-color": "black",
        "--sheet-theme-color": "#e9266a",
        "--sheet-font-size": "30px",
        "--sheet-underline-color": "var(--sheet-theme-color)",
        "--sheet-line-height": "calc(var(--sheet-font-size) + 20px)",
        "--sheet-line-thickness": "calc(var(--sheet-font-size) * 0.07)" /* 各种下划线的粗细 */
      },
    };
  },
  props: {
    sheetTree: {
      type: SheetNode,
      required: true,
    },
    events: {
      type: Object,
      default: function() {
        return {}
      }
    }
  }
};

</script>

<style>
.container {
  width: 100%;
  height: 100%;
  word-wrap: break-word;
  user-select: none;
  letter-spacing: 1px;
  white-space: pre-wrap;
  white-space: break-spaces; /* 优先，如果不支持则退回pre-wrap */
  position: relative;

  font-family: Tahoma, Verdana, Arial, Microsoft YaHei, sans-serif;
}

.container chord {
  letter-spacing: 1px;
}

.container chord_name {
  letter-spacing: 0px;
}

.container chord_pure {
  letter-spacing: 0px;
}
</style>