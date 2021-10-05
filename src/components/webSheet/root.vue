<template>
  <div class="container" ref="container">
    <SheetNodeGeneral v-for="childNode in node.children" :key="childNode" :node="childNode" />
  </div>
</template>

<script>
import { SheetNode, ENodeType } from './sheetNode';
// import SheetNodeGeneral from './general';

export default {
  name: "SheetNodeRoot",
  components: {
    // SheetNodeGeneral
  },
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