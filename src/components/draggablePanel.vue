<template>
  <div class="draggable_panel" @mousedown="startDrag" ref="panel">
    <div class="draggable_title">
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
      updateTimer: null
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
    }
  },
  mounted() {
    document.addEventListener("mouseup", this.endDrag)
    document.addEventListener("mouseover", this.onDragOver)
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

      this.startUpdateTimer()
    },
    onDragOver(e) {
      if (!this.isDragging) return
      let curMousePos = getCursorClientPos(e)
      this.updatePos(curMousePos[0] - this.startDragMousePos[0] + this.startDragPanelPos.left,
        curMousePos[1] - this.startDragMousePos[1] + this.startDragPanelPos.top)
    },
    endDrag(e) {
      this.isDragging = false
      this.endUpdateTimer()
    },
    updatePos(left, top) {
      let windowSize = getWindowSize()
      let elementSize = getOuterSize(this.$refs.panel)

      left = Math.max(0, Math.min(windowSize.w - elementSize.w, left))
      top = Math.max(0, Math.min(windowSize.h - elementSize.h, top))

      this.curPanelPos.left = left
      this.curPanelPos.top = top
    },
    setPosImmediately(left, top) {
      setPos(this.$refs.panel, left, top)
    },
    startUpdateTimer() {
      let that = this
      let updateFunc = function() {
        that.setPosImmediately(that.curPanelPos.left, that.curPanelPos.top)
        that.updateTimer = window.requestAnimationFrame(updateFunc)
      }

      this.updateTimer = window.requestAnimationFrame(updateFunc)
    },
    endUpdateTimer() {
      window.cancelAnimationFrame(this.updateTimer)
      this.updateTimer = null
    },
    onResize() {
      // TODO: delay update
      this.updatePos(this.curPanelPos.left, this.curPanelPos.top)
      this.setPosImmediately(this.curPanelPos.left, this.curPanelPos.top)
    }
  }
};

</script>

<style scoped>
.draggable_panel {
  position: fixed;
  left: 0;
  top: 0;
  outline: 2px solid black;
  background: white;
  z-index: 20;
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
  height: 100px;
  padding: 4px;
  box-sizing: border-box;
}
</style>