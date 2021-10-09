<template>
  <mark 
    @click="events.mark ? events.mark.click(node) : null"
    @contextmenu="events.mark ? events.mark.contextmenu($event, node) : null"
  >{{node.content}}</mark>
</template>

<script>
import { SheetNode, ENodeType } from '@/utils/sheetNode';
export default {
  name: "SheetNodeMark",
  props: {
    node: {
      type: SheetNode,
      required: true,
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