<template>
  <span :class="getClass()" v-if="node.type == ENodeType.Chord">
    {{getContent()}}
    <span class="chord_name">{{node.chord}}</span>
  </span>
</template>

<script>
import { SheetNode, ENodeType } from './sheetNode';
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
  },
  created() {
    this.ENodeType = ENodeType
  },
  methods: {
    getClass() {
      return this.node.type == ENodeType.Chord ? "chord" : "chord_pure"
    },
    getContent() {
      return (!this.node.content || this.node.content == '_') ? "🔹" : this.node.content
    }
  }
};
</script>

<style scoped>
/* 占位标记 */
.placeholder {
  display: inline-block;
  border-bottom: var(--sheet-line-thickness) solid var(--sheet-theme-color);
  width: var(--sheet-font-size);
}

/* 和弦 */
.chord {
  color: var(--sheet-theme-color);
  user-select: none;
  position: relative;
  cursor: default;
  text-shadow: 0 0 0.5px rgba(0, 0, 0, 0.3);
  white-space: pre;
}
.chord:before {
  content: " ";
  position: relative;
  display: inline-block;
  margin-top: var(--sheet-line-height);
  height: 0;
  width: 0;
}
.chord::after {
  content: "";
  position: absolute;
  left: -10px;
  top: calc(-8px - var(--sheet-font-size));
  right: -10px;
  bottom: -2px;
  border: 2px solid transparent;
  transition: 0.3s ease-out;
  border-radius: 5px;
  z-index: 1;
  pointer-events: none;
}

.chord:hover::after,
chord_pure:hover::after {
  border: 2px solid var(--sheet-theme-color);
  box-shadow: 0 0 5px 2px black;
}

/* 和弦名称 */
.chord_name {
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
.chord_pure {
  color: var(--sheet-theme-color);
  user-select: none;
  position: relative;
  cursor: default;
  transition: 0.5s ease-out;
}
.chord_pure::after {
  content: "";
  position: absolute;
  left: -10px;
  top: -2px;
  right: -10px;
  bottom: -2px;
  border: 2px solid transparent;
  transition: 0.3s ease-out;
  border-radius: 5px;
  z-index: 1;
  pointer-events: none;
}
</style>