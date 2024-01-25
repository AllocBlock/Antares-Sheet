<template>
  <div id="editor_context" class="context" v-show="props.show" :style="style"
      @click.stop="close">
      <div id="editor_context_menu">
        <div class="context_menu_item">
          <Svg v-for="item in contextMenu.insertMenu" :key="item.type" :src="`/icons/${item.svgName}.svg`"
            class="context_icon context_menu_button" @click="emits('insert', item.type, true)"
            @mouseenter="onButtonMouseEnter('在左侧' + item.tip)" @mouseleave="onButtonMouseLeave()"></Svg>
        </div>
        <div class="context_menu_item">
          <Svg v-for="item in contextMenu.insertMenu" :key="item.type" :src="`/icons/${item.svgName}.svg`"
            class="context_icon context_menu_button" @click="emits('insert', item.type, false)"
            @mouseenter="onButtonMouseEnter('在右侧' + item.tip)" @mouseleave="onButtonMouseLeave()"></Svg>
        </div>
        <div class="context_menu_item" @click="emits('edit')" v-show="hasEntry('editContent')">
          <Svg src="/icons/edit.svg" class="context_icon context_menu_button"
            @mouseenter="onButtonMouseEnter('编辑内容')" @mouseleave="onButtonMouseLeave()"></Svg>
        </div>
        <div class="context_menu_item" @click="emits('remove')">
          <Svg src="/icons/trash.svg" class="context_icon context_menu_button"
            @mouseenter="onButtonMouseEnter('删除')" @mouseleave="onButtonMouseLeave()"></Svg>
        </div>
        <div class="context_menu_item" v-show="hasEntry(['addUnderline', 'removeUnderline'])">
          下划线
          <Svg src="/icons/add.svg" class="context_icon context_menu_button" @click="emits('addUnderline')"
            v-show="hasEntry('addUnderline')" @mouseenter="onButtonMouseEnter('添加下划线')"
            @mouseleave="onButtonMouseLeave()"></Svg>
          <Svg src="/icons/trash.svg" class="context_icon context_menu_button" @click="emits('removeUnderline')"
            v-show="hasEntry('removeUnderline')" @mouseenter="onButtonMouseEnter('删除下划线')"
            @mouseleave="onButtonMouseLeave()"></Svg>
        </div>
        <div class="context_menu_item" v-show="hasEntry(['recoverChord', 'toggleChordType'])">
          和弦
          <Svg src="/icons/recover.svg" class="context_icon context_menu_button" @click="emits('recoverChord')"
            v-show="hasEntry('recoverChord')" @mouseenter="onButtonMouseEnter('将和弦恢复成文本')"
            @mouseleave="onButtonMouseLeave()"></Svg>
          <Svg src="/icons/switch.svg" class="context_icon context_menu_button" @click="emits('toggleChordType')"
            v-show="hasEntry('toggleChordType')" @mouseenter="onButtonMouseEnter('切换和弦类别')"
            @mouseleave="onButtonMouseLeave()"></Svg>
        </div>
      </div>

      <Transition name="trans_fade">
        <div id="editor_context_tip" v-show="contextMenu.tip.show">
          {{ contextMenu.tip.content }}
        </div>
      </Transition>
    </div>
</template>

<script setup lang="ts">
import Svg from "@/components/svg.vue";

import { Position } from "@/utils/common";
import { ref, computed } from "vue"

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  pos: {
    type: Position,
    default: new Position()
  },
  entries : {
    type: Array<string>,
    default: [
      "editContent",
      "addUnderline",
      "removeUnderline",
      "recoverChord",
      "toggleChordType"
    ]
  }
})

const style = computed(() => {
  return {
    left: `${props.pos.left}px`,
    top: `${props.pos.top}px`
  }
})

const contextMenu = ref({
  insertMenu: [
    { svgName: "marker", type: "mark", tip: "插入标记" },
    { svgName: "space", type: "space", tip: "插入空格" },
    { svgName: "enter", type: "newline", tip: "插入换行" },
    { svgName: "text", type: "text", tip: "插入文本" },
  ],
  tip: {
    show: false,
    content: ""
  }
})

const emits = defineEmits([
  "close",
  "insert",
  "edit",
  "remove",
  "addUnderline",
  "removeUnderline",
  "recoverChord",
  "toggleChordType"
])

function close() {
  console.log(props.entries)
  emits("close")
}

function hasEntry(nameOrNames : string | string[]) {
  if (typeof nameOrNames == "string") {
    return props.entries.includes(nameOrNames)
  } else {
    for (let name of nameOrNames) {
      if (hasEntry(name)) {return true;}
    }
    return false;
  }
}

function onButtonMouseEnter(tip) {
  contextMenu.value.tip.show = true
  contextMenu.value.tip.content = tip
}

function onButtonMouseLeave() {
  contextMenu.value.tip.show = false
}
</script>

<style scoped lang="scss">
.context {
  position: fixed;
  display: flex;
  user-select: none;
  z-index: 20;
}

#editor_context {
  z-index: 21;
  width: 140px;
  flex-direction: column;

  #editor_context_menu {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
    background: rgb(49, 100, 88, 0.9);
  }

  #editor_context_tip {
    left: 50%;
    bottom: -40px;
    transform: translateX(-50%);
    position: absolute;
    padding: 10px;
    font-size: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    white-space: nowrap;

    border-radius: 10px;
    background: rgb(49, 100, 88, 0.9);
  }
}

.context_menu_item {
  position: relative;
  color: white;
  padding: 5%;
  transition: all 0.2s ease-out;
  border-radius: 10px;

  display: flex;
  justify-content: flex-start;
  align-items: center;
  white-space: nowrap;

  .context_icon {
    margin: 5px;
    height: 20px;
    width: 20px;
    fill: white;
    transition: fill 0.1s ease-out;
  }
}

.context_menu_button {
  cursor: pointer;

  &:hover {
    fill: var(--theme-color); // for svg icon
    text-decoration: underline; // for text
  }
}

</style>