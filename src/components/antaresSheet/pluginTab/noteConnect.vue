<template>
  <TabNoteBase
    v-for="(note, noteIndex) in note.notes"
    :key="note"
    :note="note"
    :flags="getFlags(noteIndex)"
    :global-config="globalConfig"
  />
</template>

<script>
import TabNoteBase from "./noteBase.vue";

export default {
  name: "TabNoteConnect",
  components: {
    TabNoteBase,
  },
  props: {
    note: {
      type: Object,
      required: true,
    },
    globalConfig: {
      type: Object,
      required: true,
    },
  },
  methods: {
    getFlags(noteIndex) {
      let prevFlagNum =
        noteIndex > 0 ? this.note.notes[noteIndex - 1].getFlagNum() : null
      let nextFlagNum =
        noteIndex < this.note.notes.length - 1
          ? this.note.notes[noteIndex + 1].getFlagNum()
          : null
      let curFlagNum = this.note.notes[noteIndex].getFlagNum()

      let flags = [];

      if (!prevFlagNum) { // 第一个音符，全部朝右
        for (let i = 0; i < curFlagNum; ++i)
          flags.push("right")
      } else if (!nextFlagNum) { // 不是第一个，且是最后一个，全部朝左
        for (let i = 0; i < curFlagNum; ++i)
          flags.push("left")
      } else {
        // 中间
        // 如果和上一个flag相同，则向左连接，右侧顺应下一个音符
        // 如果不同，依旧向左连接，右侧使用自己的flag数
        let isEqualToPrev = prevFlagNum == curFlagNum
        let rightFlagNum = isEqualToPrev ? nextFlagNum : curFlagNum
        for (let i = 0; i < Math.max(curFlagNum, prevFlagNum, nextFlagNum); ++i) {
          if (i < prevFlagNum && i < rightFlagNum)
            flags.push("both")
          else if (i < prevFlagNum)
            flags.push("left")
          else if (i < nextFlagNum)
            flags.push("right")
        }
      }
      return flags
    },
  },
};
</script>