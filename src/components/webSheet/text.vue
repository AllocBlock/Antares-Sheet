<template>
  <text 
    @click="events.text ? events.text.click(node) : null"
    @dblclick="events.text ? events.text.dblclick(node) : null"
    @contextmenu="events.text ? events.text.contextmenu($event, node) : null"
  >{{node.content}}</text>
</template>

<script>
import { SheetNode } from '@/utils/sheetNode';
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
    events: {
      type: Object,
      default: function() {
        return {}
      }
    }
  },
};
</script>