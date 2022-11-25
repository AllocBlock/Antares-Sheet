<template>
  <div class="draggable_panel" ref="panel"
    tabindex="0"
    @focus="updateFocusState(true)" 
    @blur="updateFocusState(false)" 
    :focused="this.isFocused"
  >
    <div class="draggable_title" @mousedown="startDrag">
      {{title}}
    </div>
    <div class="draggable_content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { getCursorClientPos, getPos, setPos, getOuterSize, getWindowSize } from '@/utils/common.js';

export default {
  name: "DraggablePanel",
  data() {
    return {
      isDragging: false,
      startDragPanelPos: {
        left: 0,
        top: 0
      },
      startDragMousePos: [0, 0],
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
    }
  },
  mounted() {
    document.addEventListener("mouseup", this.endDrag)
    document.addEventListener("mousemove", this.onDragMove)
    window.addEventListener("resize", this.onResize)
    this.setPosImmediately(this.initPos.left, this.initPos.top)
  },
  methods: {
    startDrag(e) {
      this.isDragging = true
      this.startDragMousePos = getCursorClientPos(e)
      let curPanelPos = getPos(this.$refs.panel)
      this.startDragPanelPos.left = curPanelPos.left
      this.startDragPanelPos.top = curPanelPos.top
      this.curPanelPos.left = curPanelPos.left
      this.curPanelPos.top = curPanelPos.top
    },
    onDragMove(e) {
      if (!this.isDragging) return
      let curMousePos = getCursorClientPos(e)
      this.setPosNextFrame(curMousePos[0] - this.startDragMousePos[0] + this.startDragPanelPos.left,
        curMousePos[1] - this.startDragMousePos[1] + this.startDragPanelPos.top)
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
      let windowSize = getWindowSize()
      let elementSize = getOuterSize(this.$refs.panel)

      left = Math.max(0, Math.min(windowSize.w - elementSize.w, left))
      top = Math.max(0, Math.min(windowSize.h - elementSize.h, top))

      setPos(this.$refs.panel, left, top)
    },
    onResize() {
      this.setPosNextFrame(this.curPanelPos.left, this.curPanelPos.top)
    },
    updateFocusState(state) {
      this.$emit("update:isFocused", state)
    },
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
  z-index: 20;

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
}

.draggable_content {
  width: 100%;
  padding: 4px;
  box-sizing: border-box;
}
</style>