<template>
  <component :is="getTag()">
    <SheetNodeGeneral v-for="childNode in node.children" :key="childNode" :node="childNode" :events="events" />
  </component>
</template>

<script>
import { SheetNode, ENodeType } from '@/utils/sheetNode';
// import SheetNodeGeneral from './general';
// const SheetNodeGeneral = () => import('./general');

export default {
  name: "SheetNodeUnderline",
  components: {
    // SheetNodeGeneral
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
    this.ENodeType = ENodeType
  },
  methods: {
    getTag() {
      return this.node.type == ENodeType.Underline ? "underline" : "underline-pure"
    },
  }
};
</script>

<style scoped>
/* 下划线 */
underline {
  border-top: var(--sheet-line-thickness) solid var(--sheet-underline-color);
}

underline > underline {
  border-top: var(--sheet-line-thickness) solid var(--sheet-underline-color);
  padding-top: calc(var(--sheet-line-thickness) * 2);
}

underline > underline > underline {
  border-top: var(--sheet-line-thickness) solid var(--sheet-underline-color);
  padding-top: calc(var(--sheet-line-thickness) * 4);
}

underline > underline > underline > underline {
  border-top: none;
}

/* 同行下划线 */
underline-pure {
  border-bottom: var(--sheet-line-thickness) solid var(--sheet-underline-color);
}

underline-pure > underline-pure {
  border-bottom: var(--sheet-line-thickness) solid var(--sheet-underline-color);
  padding-bottom: calc(var(--sheet-line-thickness) * 2);
}

underline-pure > underline-pure > underline-pure {
  border-bottom: var(--sheet-line-thickness) solid var(--sheet-underline-color);
  padding-bottom: calc(var(--sheet-line-thickness) * 4);
}

underline-pure > underline-pure > underline-pure > underline-pure {
  border-bottom: none;
}
</style>