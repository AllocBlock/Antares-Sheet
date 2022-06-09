<template>
  <component :is="tag" :node="node" :events="events"/>
</template>

<script>
import { SheetNode, ENodeType } from '@/utils/sheetNode.js';
import SheetNodeError from './error.vue';
import SheetNodeChord from './chord.vue';
import SheetNodeMark from './mark.vue';
// const SheetNodeUnderline = () => import('./underline.vue');
import SheetNodePlugin from './plugin.vue';
import SheetNodeText from './text.vue';
import SheetNodeNewLine from './newline.vue';

export default {
  name: "SheetNodeGeneral",
  components: {
    SheetNodePlugin, SheetNodeChord, SheetNodeMark, SheetNodeText, SheetNodeError, SheetNodeNewLine
  },
  props: {
    node: {
      type: Object, 
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
  computed: {
    tag() {
      switch(this.node.type) {
        case ENodeType.Plugin: return "SheetNodePlugin";
        case ENodeType.Underline:
        case ENodeType.UnderlinePure: return "SheetNodeUnderline";
        case ENodeType.Chord:
        case ENodeType.ChordPure: return "SheetNodeChord";
        case ENodeType.Mark: return "SheetNodeMark";
        case ENodeType.Text: return "SheetNodeText";
        case ENodeType.NewLine: return "SheetNodeNewLine";
        default: return "SheetNodeError";
      }
    }
  }
};
</script>