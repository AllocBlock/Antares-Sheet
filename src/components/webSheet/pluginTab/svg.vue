<template>
  <span v-html="svg" class="svg_container"/>
</template>

<script>
const SvgStumArrow = `<svg viewBox="0 0 100 115.19" preserveAspectRatio="none"><path d="M50,0,0,115.29s16.53-14.88,50-14.88,50,14.88,50,14.88Z"/></svg>`;
const SvgArpeggioHead = `<svg viewBox="0 0 100 52.66" preserveAspectRatio="none"><path d="M65.21,15.61C50.83-1.25,39.92-4.72,48.35,10.16,54.79,24.54,54.79,28,33.48,52.79H73C80.46,39.79,77.78,30.28,65.21,15.61Z"/></svg>`;
const SvgArpeggioBody = `<svg viewBox="0 0 100 127.92" preserveAspectRatio="none"><path d="M78.1,117c0-5.46-8.93-20.33-19.84-33.72C47.36,70.43,38.43,55.06,38.43,50.1c0-5.46,8.93-19.34,19.83-31.24C65,11.52,69.89,5.46,73,0H33.47C22.56,12.41,13.64,26.79,13.64,31.75c0,5.45,8.92,20.83,19.83,34.21C44.38,79.85,53.31,94.72,53.31,99.19c0,4-8.92,17.33-19.81,28.73H73C76,122.94,78.1,118.82,78.1,117Z"/></svg>`;
const SvgArpeggioTail = `<svg viewBox="0 0 100 73.43" preserveAspectRatio="none"><path d="M73,0H33.47C10.17,25.3,8.68,36.71,26,57.53,38.93,72.41,48.35,76.87,48.35,68c0-2.48-2.48-6-5-7.44-9.92-5.95-5-19.34,14.87-40.66A112.26,112.26,0,0,0,73,0Z"/></svg>`;

const SvgStrokeHead = `<svg viewBox="0 0 100 52.66" preserveAspectRatio="none"><rect x="45.62" width="8.76" height="52.66"/></svg>`;
const SvgStrokeBody = `<svg viewBox="0 0 100 127.92" preserveAspectRatio="none"><rect x="45.62" width="8.76" height="127.92"/></svg>`;
const SvgStrokeTail = `<svg viewBox="0 0 100 71.61" preserveAspectRatio="none"><rect x="45.62" y="62.77" width="8.76" height="8.76" rx="4.38" ry="4.38"/><rect x="45.62" width="8.76" height="67.15"/></svg>`;

export default {
  name: "TabSvg",
  data() {
    return {
      svg: "<svg></svg>",
    };
  },
  props: {
    svgName: {
      type: String,
      required: true,
    },
  },
  created() {
    this.svg = this.getSvg(this.svgName)
  },
  methods: {
    getSvg(name){
      switch(name) {
        case "StumArrow": return SvgStumArrow;
        case "ArpeggioHead": return SvgArpeggioHead;
        case "ArpeggioBody": return SvgArpeggioBody;
        case "ArpeggioTail": return SvgArpeggioTail;
        case "StrokeHead": return SvgStrokeHead;
        case "StrokeBody": return SvgStrokeBody;
        case "StrokeTail": return SvgStrokeTail;
        default: throw "未知SVG图标" + name
      }
    }
  }
};
</script>

<style>
.svg_container svg {
  width: 100%;
  height: 100%;
  display: flex;
}
</style>