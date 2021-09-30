<template>
  <span>【插件{{node.pluginType}}】</span>
</template>

<script>
import { SheetNode, ENodeType } from './sheetNode';
export default {
  name: "SheetNodePlugin",
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