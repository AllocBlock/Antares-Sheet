<template>
  <SheetNodePluginTab :node="node" />
</template>

<script>
import { SheetNode, ENodeType } from '@/utils/sheetNode';
import SheetNodePluginTab from './pluginTab/index';

export default {
  name: "SheetNodePlugin",
  components: {
    SheetNodePluginTab
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