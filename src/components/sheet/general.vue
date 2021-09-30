<template>
  <SheetNodePlugin v-if="node.type == ENodeType.PluginType" :node="node" />
  <SheetNodeUnderline v-else-if="node.type == ENodeType.Underline || node.type == ENodeType.UnderlinePure" :node="node" />
  <SheetNodeChord v-else-if="node.type == ENodeType.Chord || node.type == ENodeType.ChordPure" :node="node" />
  <SheetNodeInfo v-else-if="node.type == ENodeType.Info" :node="node" />
  <SheetNodeText v-else-if="node.type == ENodeType.Text" :node="node" />
  <SheetNodeError v-else />
</template>

<script>
import { SheetNode, ENodeType } from './sheetNode';
import SheetNodeError from './error';
import SheetNodeChord from './chord';
import SheetNodeInfo from './info';
// const SheetNodeUnderline = () => import('./underline');
import SheetNodePlugin from './plugin';
import SheetNodeText from './text';

export default {
  name: "SheetNodeGeneral",
  components: {
    SheetNodePlugin, SheetNodeChord, SheetNodeInfo, SheetNodeText, SheetNodeError
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
  },
  created() {
    this.ENodeType = ENodeType
  },
};
</script>