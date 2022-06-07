<template>
  <newline v-on="localEvents">⇲</newline>
</template>

<script>
import { SheetNode } from '@/utils/sheetNode.js';

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
      type: Object,
      default: function() {
        return {}
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