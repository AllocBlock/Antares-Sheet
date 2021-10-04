<template>
  <text>{{node.content}}</text>
</template>

<script>
import { SheetNode } from './sheetNode';
export default {
  name: "SheetNodeText",
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