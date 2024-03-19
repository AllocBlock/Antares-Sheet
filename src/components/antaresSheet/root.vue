<template>
  <div class="container" ref="container">
    <SheetNodeGeneral v-for="childNode in node.children" :key="childNode" :node="childNode" :events="events"/>
  </div>
</template>

<script>
import { NodeEventList } from '@/utils/elementEvent';
import { SheetNode, ENodeType } from '@/utils/sheetNode';
// import SheetNodeGeneral from './general.vue';

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
    events: {
      type: NodeEventList,
      default: function() {
        return new NodeEventList()
      }
    }
  },
};
</script>