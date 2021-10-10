<template>
  <component 
    :is="getTag()"
    @click="events.chord ? events.chord.click(node) : null"
    @dblclick="events.chord ? events.chord.dblclick(node) : null"
    @mouseenter="events.chord ? events.chord.mouseenter(node) : null"
    @mouseleave="events.chord ? events.chord.mouseleave(node) : null"
    @contextmenu="events.chord ? events.chord.contextmenu($event, node) : null"
  >
    <chord-body>{{getContent()}}</chord-body>
    <chord-ruby v-if="node.type == ENodeType.Chord">{{node.chord}}</chord-ruby>
  </component>
</template>

<script>
import { SheetNode, ENodeType } from '@/utils/sheetNode';
export default {
  name: "SheetNodeChord",
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
    this.ENodeType = ENodeType
  },
  methods: {
    getTag() {
      return this.node.type == ENodeType.Chord ? "chord" : "chord-pure"
    },
    getContent() {
      if (this.node.type == ENodeType.Chord)
        return (!this.node.content || this.node.content == '_') ? "🔹" : this.node.content
      else
        return this.node.chord
    }
  },
};
</script>

<style scoped>
/* 占位标记 */
/* placeholder {
  display: inline-block;
  border-bottom: var(--sheet-line-thickness) solid var(--sheet-theme-color);
  width: var(--sheet-font-size);
} */

/* 和弦 */
chord {
  color: var(--sheet-theme-color);
  user-select: none;
  position: relative;
  cursor: default;
  text-shadow: 0 0 0.5px rgba(0, 0, 0, 0.3);
  white-space: normal;
}
chord::before {
  content: " ";
  position: relative;
  display: inline-block;
  margin-top: var(--sheet-line-height);
  height: 0;
  width: 0;
}

/* 和弦标注 */
chord-ruby {
  color: var(--sheet-theme-color);
  position: absolute;
  user-select: none;
  transition: 0.5s ease-out;
  text-align: center;
  text-shadow: none;
  width: fit-content;

  left: 50%;
  transform: translateX(-50%);

  display: flex;
  justify-content: center;
  align-items: center;
  bottom: 100%;
}

/* 同行和弦 */
chord-pure {
  color: var(--sheet-theme-color);
  user-select: none;
  position: relative;
  cursor: default;
  transition: 0.5s ease-out;
  margin: 0 5px;
  white-space: normal;
}
</style>