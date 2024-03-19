<template>
  <component :is="viewerCompName" />
</template>

<script type="module">
import { defineAsyncComponent } from "vue";
import { getEnv } from "@/utils/common";

export default {
  name: "SheetViewer",
  components: {
    "SheetViewerPc" : defineAsyncComponent(() => import('./pc.vue')),
    "SheetViewerMobile" : defineAsyncComponent(() => import('./mobile.vue')),
  },
  computed: {
    viewerCompName: function () {
      let env = getEnv()
      if (env == "pc") return "SheetViewerPc"
      else if (env == "mobile") return "SheetViewerMobile"
      else throw "Unknown device";
    },
  },
}
</script>
