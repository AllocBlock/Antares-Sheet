<template>
<div v-html="svgData" class="svg_container"></div>
</template>

<script>
import Request from "@/utils/request.js";

export default {
  name: "Svg",
  data() {
    return {
      svgData: "",
    }
  },
  props: {
    src: {
      type: String,
      default: "",
    },
    fillColor: {
      type: String,
      default: "white"
    }
  },
  created() {
    let that = this
    Request.get(this.src).then(res => {
      that.svgData = res
    })
  },
  methods: {
  }
};

</script>

<style scoped>
.svg_container svg {
  height: 100%;
  width: 100%;
  fill: inherit;
}
</style>