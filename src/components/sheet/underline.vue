<template>
  <span :class="getClass()">
    <SheetNodeGeneral v-for="childNode in node.children" :key="childNode" :node="childNode" />
  </span>
</template>

<script>
import { SheetNode, ENodeType } from './sheetNode';
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
  },
  created() {
    this.ENodeType = ENodeType
  },
  methods: {
    getClass() {
      return this.node.type == ENodeType.Underline ? "underline" : "underline_pure"
    },
  }
};
</script>

<style scoped>


/* 下划线 */
.underline {
  border-top: var(--sheet-line-thickness) solid var(--sheet-underline-color);
}

.underline > .underline {
  border-top: var(--sheet-line-thickness) solid var(--sheet-underline-color);
  padding-top: calc(var(--sheet-line-thickness) * 3);
}

.underline > .underline > .underline {
  border-top: var(--sheet-line-thickness) solid var(--sheet-underline-color);
  padding-top: calc(var(--sheet-line-thickness) * 6);
}

.underline > .underline > .underline > .underline {
  border-top: none;
}

/* 同行下划线 */
.underline_pure {
  border-bottom: var(--sheet-line-thickness) solid var(--sheet-underline-color);
}

.underline_pure > .underline_pure {
  border-bottom: var(--sheet-line-thickness) solid var(--sheet-underline-color);
  padding-bottom: calc(var(--sheet-line-thickness) * 3);
}

.underline_pure > .underline_pure > .underline_pure {
  border-bottom: var(--sheet-line-thickness) solid var(--sheet-underline-color);
  padding-bottom: calc(var(--sheet-line-thickness) * 6);
}

.underline_pure > .underline_pure > .underline_pure > .underline_pure {
  border-bottom: none;
}
</style>