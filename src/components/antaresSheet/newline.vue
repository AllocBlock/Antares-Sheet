<template>
  <newline 
    @mouseenter="events.newline.triggerMouseEnter($event, node)"
    @mouseleave="events.newline.triggerMouseLeave($event, node)"
    @mousedown="events.newline.triggerMouseDown($event, node)"
    @dblclick="events.newline.triggerDoubleClick($event, node)"
    @contextmenu="events.newline.triggerContextMenu($event, node)"
  >⇲</newline>
</template>

<script>
import { SheetNode } from '@/utils/sheetNode';
import { NodeEventList } from '@/utils/elementEvent';

export default {
  name: "SheetNodeNewLine",
  data() {
    return {
      localEvents: {}
    }
  },
  props: {
    node: {
      type: SheetNode,
      required: true,
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
    if (this.events.newline) {
      for(let eventName in this.events.newline) {
        this.localEvents[eventName] = (e) => this.events.newline[eventName](e, this.node)
      }
    }
  },
};
</script>

<style scoped>
newline::after {
  content: "\D\A";
}
</style>