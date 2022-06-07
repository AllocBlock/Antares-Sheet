<template>
  <SheetNodePlugin v-if="node.type == ENodeType.Plugin" :node="node" :events="events" />
  <SheetNodeUnderline v-else-if="node.type == ENodeType.Underline || node.type == ENodeType.UnderlinePure" :node="node" :events="events" />
  <SheetNodeChord v-else-if="node.type == ENodeType.Chord || node.type == ENodeType.ChordPure" :node="node" :events="events" />
  <SheetNodeMark v-else-if="node.type == ENodeType.Mark" :node="node" :events="events" />
  <SheetNodeText v-else-if="node.type == ENodeType.Text" :node="node" :events="events" />
  <SheetNodeNewLine v-else-if="node.type == ENodeType.NewLine" :node="node" :events="events" />
  <SheetNodeError v-else />
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
  created() {
    this.ENodeType = ENodeType
  },
};
</script>