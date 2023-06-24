<template>
  <note-stum :direction="direction" :style="getStumStyle()">
    <TabSymbol class="note_stum_arrow flex_hv_center" :svg-name="svgArrowName" />
    <TabSymbol class="note_stum_head flex_hv_center" :svg-name="svgHeadName" />
    <TabSymbol class="note_stum_body flex_hv_center" :svg-name="svgBodyName" v-for="i in (range.end - range.start)" :key="i" />
    <TabSymbol class="note_stum_tail flex_hv_center" :svg-name="svgTailName" />
  </note-stum>
</template>

<script>
import TabSymbol from './symbol.vue'

export default {
  name: "TabStum",
  components: {
    TabSymbol
  },
  data() {
    return {
      svgArrowName: "",
      svgHeadName: "",
      svgBodyName: "",
      svgTailName: "",
      range: {
        start: 0,
        end: 0,
      },
      direction: "up",
    };
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
  created() {
    this.range = this.getRange();

    this.svgArrowName = "StumArrow";
    if (this.note.config.a) {
      this.svgHeadName = "ArpeggioHead";
      this.svgBodyName = "ArpeggioBody";
      this.svgTailName = "ArpeggioTail";
      this.direction = this.mapStumDirection(this.note.config.a);
    } else if (this.note.config.s) {
      this.svgHeadName = "StrokeHead";
      this.svgBodyName = "StrokeBody";
      this.svgTailName = "StrokeTail";
      this.direction = this.mapStumDirection(this.note.config.s);
    } else {
      throw "不支持的扫弦类型";
    }
  },
  methods: {
    mapStumDirection(configDirection) {
      switch (configDirection) {
        case "u":
          return "up";
        case "d":
          return "down";
        default:
          throw "不支持的扫弦方向";
      }
    },
    getRange() {
      let frets = this.note.frets;
      let stumStartIndex = -1;
      for (let i = 0; i < frets.length; ++i) {
        if (frets[i] != "-" && i < frets.length - 1) {
          if (stumStartIndex < 0) {
            stumStartIndex = i;
          }
        } else {
          if (stumStartIndex >= 0) {
            let stumEndIndex = (frets[i] != "-" ? i : i - 1)
            return {
              start: stumStartIndex,
              end: stumEndIndex,
            };
          }
        }
      }
    },
    getStumStyle() {
      let stringNum = this.globalConfig.getInt("stringNum")
      let stumBodyNum = this.range.end - this.range.start
      return {
        top: `${(this.range.start / (stringNum - 1)) * 100}%`,
        height: `${(stumBodyNum / (stringNum - 1)) * 100}%`,
      };
    },
  },
};
</script>

<style scoped>
note-stum {
  position: absolute;
  width: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
note-stum[direction="up"] {
  transform: scaleY(-1);
}

.note_stum_arrow {
  width: 100%;
  position: absolute;
  top: 0;
  transform: translateY(calc(-85% - 6px));
}

.note_stum_head {
  width: 100%;
  position: absolute;
  top: -6px;
  height: 6px;
}

.note_stum_body {
  width: 100%;
  position: relative;
  top: 0;
  flex-grow: 1;
}

.note_stum_tail {
  width: 100%;
  position: absolute;
  bottom: -10px;
  height: 10px;
}
</style>