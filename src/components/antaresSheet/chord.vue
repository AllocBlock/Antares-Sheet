<template>
  <component :is="getTag()" ref="main" :style="node.style ?? {}"
    @mouseenter="events.chord.triggerMouseEnter($event, node)"
    @mouseleave="events.chord.triggerMouseLeave($event, node)"
    @mousedown="events.chord.triggerMouseDown($event, node)"
    @dblclick="events.chord.triggerDoubleClick($event, node)"
    @contextmenu="events.chord.triggerContextMenu($event, node)"
  >
    <template v-if="isMarkChord">
      <chord-body>
        <Placeholder v-if="isPlaceholder"/>
        <template v-else>
          {{node.content}}
        </template>
      </chord-body>
      <chord-ruby>
        <ChordName :chord="node.chord" />
      </chord-ruby>
    </template>
    <chord-body v-else>
      <ChordName :chord="node.chord" />
    </chord-body>
  </component>
</template>

<script lang="ts">
import { SheetNode, ENodeType } from '@/utils/sheetNode';
import ChordName from './chordName.vue';
import Placeholder from './placeholder.vue';
import { NodeEventList } from '@/utils/elementEvent';

export default {
  name: "SheetNodeChord",
  components: { ChordName, Placeholder },
  data() {
    return {
      localEvents: {},
    }
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
      type: NodeEventList,
      default: function() {
        return new NodeEventList()
      }
    }
  },
  created() {
    this.localEvents = {}
    if (this.events.chord) {
      for(let eventName in this.events.chord) {
        this.localEvents[eventName] = (e) => this.events.chord[eventName](e, this.node)
      }
    }
  },
  computed: {
    isMarkChord: function() {
      return this.node.type == ENodeType.Chord
    },
    isPlaceholder() {
      return !this.node.content || this.node.content == '_' || this.node.content == ' ';
    },
  },
  methods: {
    getTag() {
      return this.node.type == ENodeType.Chord ? "chord" : "chord-pure"
    },
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
  white-space: nowrap;
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