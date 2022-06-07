<template>
  <!-- TODO: 配置项的元素 -->
  <note>
    <TabStum v-if="isStum()" :note="note" :global-config="globalConfig"/>
    <template v-else-if="isFretVisible()">
      <note-element
        v-for="(fret, fretIndex) in note.frets"
        :key="fret"
      >
        <template v-if="fret == '-'">
          <note-fret-stem
            v-if="hasMiddleStem(fretIndex, note.frets)"
            type="normal"
          />
          <note-fret-empty v-else />
        </template>
        <template v-else>
          <note-fret>{{ fret }}</note-fret>
        </template>
      </note-element>
    </template>
    <note-stem :type="note.getStemType()" />
    <note-flag>
      <note-flag-connect v-for="flagType in flags" :key="flagType" :type="flagType" />
    </note-flag>
  </note>
</template>

<script>
import TabStum from './stum.vue'

export default {
  name: "TabNoteBase",
  components: {
    TabStum
  },
  props: {
    note: {
      type: Object,
      required: true,
    },
    flags: { // TODO: 这样安排是否合理？connect传入flags列表，还是base获取前后flag信息生成列表?
      type: Array,
      default: function() {
        return []
      }
    },
    globalConfig: {
      type: Object,
      required: true,
    },
  },
  created() {
    if (this.note.type != "single") {
      console.error("音符类型错误", this.note);
      throw "音符类型错误";
    }
  },
  methods: {
    isStum() {
      return this.note.config.a || this.note.config.s;
    },
    isFretVisible() {
      if (!this.isStum()) return true;
      let globalConfig = this.globalConfig.getBool("showStumFret") ?? true;
      let localConfig = this.note.config.getBool("showStumFret");

      return globalConfig && localConfig;
    },
    hasMiddleStem(fretIndex, frets) {
      let globalHasMiddleStem = true;
      let isBeforeAllEmpty =
        frets.slice(0, fretIndex).filter((fret) => fret != "-") == 0;
      return globalHasMiddleStem && !isBeforeAllEmpty;
    },
  },
};
</script>

<style scoped>
note {
  position: relative;
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}
note-element {
  position: relative;
  width: 100%;
  height: 0;
  flex-shrink: 1;

  display: flex;
  justify-content: center;
  align-items: center;
}
note-element > * {
  position: absolute;
}
note-fret {
  display: flex;
  justify-content: center;
  align-items: center;

  font-size: var(--fret-font-size);
  width: fit-content;
  padding: 0 2px;
  height: 3px;
  /* background-color: rgb(0, 6, 40); */
  background-color: white;
}
note-fret-empty {
  width: 12px;
}
note-fret-stem {
  position: relative;
  height: calc(1 / (var(--string-num) - 1) * var(--row-height));
  width: 12px;
}
note-fret-stem:after {
  position: absolute;
  content: "";
  top: 0;
  left: calc(50% - 1px);
  height: 100%;
  width: 2px;
  /* background-color: #fff; */
  background-color: black;
  border-radius: 2px;
}
note-fret-stem[type="end"]:after {
  height: calc(50% + var(--stem-margin));
}
note-link {
  position: absolute;
  width: 100%;
  left: 50%;
  transform: translateY(-100%);

  display: flex;
  justify-content: center;
  align-items: center;
}
note-link svg {
  width: 100%;
  height: calc(1 / (var(--string-num) - 1) * var(--row-height) * 0.4);
}

note-link-text {
  position: absolute;
  font-size: 12px;
  transform: translateY(-100%);
}
note-stem {
  position: absolute;
  /* background-color: #fff; */
  background-color: black;
  width: 2px;
  border-radius: 2px;
}
note-stem[type="complete"] {
  height: 42px;
  bottom: calc(-1 * var(--stem-margin));
}
note-stem[type="half"] {
  height: 20px;
  width: 2px;
  bottom: calc(-1 * var(--stem-margin));
}
note-stem,
note-stem[type="none"] {
}
note-flag {
  position: absolute;
  width: 100%;
  bottom: calc(-1 * var(--stem-margin));
  height: calc(var(--stem-margin) - 5px);
  padding-top: 5px;

  display: flex;
  flex-direction: column-reverse;
}
note-flag-connect {
  height: 4px;
  margin-top: 5px;
  /* background-color: #fff; */
  background-color: black;
}
note-flag-connect,
note-flag-connect[type="none"] {
  width: 0;
}
note-flag-connect[type="left"] {
  width: 50%;
  align-self: flex-start;
}
note-flag-connect[type="right"] {
  width: 50%;
  align-self: flex-end;
}
note-flag-connect[type="both"] {
  width: 100%;
  align-self: center;
}
/* .note_chord {
  position: absolute;
  bottom: calc(100% + 20px);

  display: flex;
  justify-content: center;
  align-items: center;
}
.note_chord_name {
  font-size: 24px;
  color: white;
  color: black;
}
.note_chord_graph {
  margin-bottom: 5px;
  height: calc(var(--row-height) * 1.5);
  width: calc(var(--row-height) * 1.5 * 0.75);
  color: black;
} */
</style>