<template>
  <text :style="node.style ?? {}"
    @mouseenter="events.text.triggerMouseEnter($event, node)"
    @mouseleave="events.text.triggerMouseLeave($event, node)"
    @mousedown="events.text.triggerMouseDown($event, node)"
    @dblclick="events.text.triggerDoubleClick($event, node)"
    @contextmenu="events.text.triggerContextMenu($event, node)"
  >{{node.content}}</text>
</template>

<script>
import { SheetNode } from '@/utils/sheetNode';
import { NodeEventList } from '@/utils/elementEvent';

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
      type: NodeEventList,
      default: function() {
        return new NodeEventList()
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