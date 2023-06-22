<template>
  <mark 
    @mouseenter="events.mark.triggerMouseEnter($event, node)"
    @mouseleave="events.mark.triggerMouseLeave($event, node)"
    @mousedown="events.mark.triggerMouseDown($event, node)"
    @dblclick="events.mark.triggerDoubleClick($event, node)"
    @contextmenu="events.mark.triggerContextMenu($event, node)"
  >{{node.content}}</mark>
</template>

<script>
import { SheetNode, ENodeType } from '@/utils/sheetNode';
import { NodeEventList } from '@/utils/elementEvent';

export default {
  name: "SheetNodeMark",
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
    if (this.events.mark) {
      for(let eventName in this.events.mark) {
        this.localEvents[eventName] = (e) => this.events.mark[eventName](e, this.node)
      }
    }
  },
};
</script>

<style scoped>
mark {
  padding: 3px 8px;
  border-radius: 5px;
  background-color: var(--sheet-theme-color);
  color: white;
  user-select: none;
  margin: 10px 5px;
  line-height: calc(var(--sheet-font-size) * 2);
}
</style>