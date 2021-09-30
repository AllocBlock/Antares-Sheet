<template>
  <span class="info">{{node.content}}</span>
</template>

<script>
import { SheetNode, ENodeType } from './sheetNode';
export default {
  name: "SheetNodeInfo",
  props: {
    node: {
      type: SheetNode,
      required: true,
      default: function() {
        let node = new SheetNode(ENodeType.Text)
        node.content = "未知节点"
        return node
      }
    },
  },
};
</script>

<style scoped>
.info {
  padding: 3px 8px;
  border-radius: 5px;
  background-color: var(--sheet-theme-color);
  color: white;
  user-select: none;
  margin: 10px 5px;
  line-height: calc(var(--sheet-font-size) * 2);
}
</style>