<template>
  <div class="draggable_panel" ref="panel"
    tabindex="0"
    @focus="updateFocusState(true)" 
    @blur="updateFocusState(false)" 
    :focused="this.isFocused"
  >
    <div class="draggable_title" @mousedown="startDrag">
      {{title}}
      <div class="draggable_fold_mark" @click="onFoldMarkClick">{{isFolded ? "⇲" : "⇱"}}</div>
    </div>
    <div class="draggable_content" v-show="!isFolded">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { setPos, getOuterSize, getWindowSize } from '@/utils/common.js';
import { MouseDelta } from '@/utils/mouse.js';

export default {
  name: "DraggablePanel",
  data() {
    return {
      isDragging: false,
      mouseDelta: new MouseDelta(),
      curPanelPos: {
        left: 0,
        top: 0
      },
      willUpdateNextFrame: false,
    }
  },
  props: {
    title: {
      type: String,
      default: "标题"
    },
    initPos: {
      default: {
        left: 0,
        top: 0
      }
    },
    isFocused: {
      type: Boolean,
      default: false
    },
    isFolded: {
      type: Boolean,
      default: false
    },
  },
  mounted() {
    document.addEventListener("mouseup", this.endDrag)
    document.addEventListener("mousemove", this.onDragMove)
    window.addEventListener("resize", this.onResize)

    let w = document.body.clientWidth
    let h = document.body.clientHeight
    if (this.initPos.left < 0)
      this.initPos.left += w
    if (this.initPos.top < 0)
      this.initPos.top += h

    this.curPanelPos.left = this.initPos.left
    this.curPanelPos.top = this.initPos.top
    this.setPosImmediately(this.curPanelPos.left, this.curPanelPos.top)
  },
  methods: {
    startDrag(e) {
      this.isDragging = true
      this.mouseDelta.start(e)
    },
    limitPos() {
      let windowSize = getWindowSize()
      let elementSize = getOuterSize(this.$refs.panel)

      this.curPanelPos.left = Math.max(0, Math.min(windowSize.w - elementSize.w, this.curPanelPos.left))
      this.curPanelPos.top = Math.max(0, Math.min(windowSize.h - elementSize.h, this.curPanelPos.top))
    },
    onDragMove(e) {
      if (!this.isDragging) return
      let [dx, dy] = this.mouseDelta.tick(e)
      this.curPanelPos.left += dx
      this.curPanelPos.top += dy
      this.limitPos()
      this.setPosNextFrame(this.curPanelPos.left, this.curPanelPos.top)
    },
    endDrag(e) {
      this.isDragging = false
    },
    setPosNextFrame(left, top) {
      this.curPanelPos.left = left
      this.curPanelPos.top = top
      if (!this.willUpdateNextFrame) {
        this.willUpdateNextFrame = true
        window.requestAnimationFrame(() => {
          this.setPosImmediately(this.curPanelPos.left, this.curPanelPos.top) // 触发时是最新数据
          this.willUpdateNextFrame = false
        })
      }
    },
    setPosImmediately(left, top) {
      setPos(this.$refs.panel, left, top)
    },
    onResize() {
      this.setPosNextFrame(this.curPanelPos.left, this.curPanelPos.top)
    },
    updateFocusState(state) {
      this.$emit("update:isFocused", state)
    },
    onFoldMarkClick() {
      this.$emit("update:isFolded", !this.isFolded)
      this.$nextTick(() => {
        this.onResize()
      })
    }
  }
};

</script>

<style scoped lang="scss">
.draggable_panel {
  position: fixed;
  left: 0;
  top: 0;
  outline: 2px solid black;
  background: white;
  z-index: 10;

  transition: opacity 0.3s ease-out;

  &[focused=true] {
    opacity: 1.0;
  }
  &[focused=false] {
    opacity: 0.8;
    &:hover {
      opacity: 0.9;
    }
  }
}

.draggable_title {
  width: 100%;
  height: 28px;
  user-select: none;
  border-bottom: 2px solid black;
  padding: 2px 5px;
  box-sizing: border-box;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  white-space: nowrap;

  .draggable_fold_mark {
    width: 20px;
    margin-left: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
}

.draggable_content {
  width: 100%;
  padding: 4px;
  box-sizing: border-box;
}
</style>