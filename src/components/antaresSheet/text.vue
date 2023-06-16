<template>
  <text v-on="localEvents" :style="node.style ?? {}">{{node.content}}</text>
</template>

<script>
import { SheetNode } from '@/utils/sheetNode';
export default {
  name: "SheetNodeText",
  data() {
    return {
      localEvents: {}
    }
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
      type: Object,
      default: function() {
        return {}
      }
    }
  },
  created() {
    this.localEvents = {}
    if (this.events.text) {
      for(let eventName in this.events.text) {
        this.localEvents[eventName] = (e) => this.events.text[eventName](e, this.node)
      }
    }
  },
};
</script>