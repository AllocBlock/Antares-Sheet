<template>
  <SheetNodePluginTab v-if="isTab" :node="node" />
</template>

<script>
import { SheetNode, ENodeType, EPluginType } from '@/utils/sheetNode';
import SheetNodePluginTab from './pluginTab/index.vue';

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
        node.pluginType = EPluginType.Unknown
        return node
      }
    },
  },
  computed: {
    isTab() {
      return this.node.pluginType == EPluginType.Tab;
    }
  }
};
</script>