<template>
  <component :is="getTag()"></component>
</template>

<script>
import { getEnv } from "@/utils/webCommon.js";
import SheetEditorPc from "./editorPc.vue";
import SheetEditorMobile from "./editorMobile.vue";

export default {
  name: "SheetEditor",
  components: {
    SheetEditorPc,
    SheetEditorMobile,
  },
  methods: {
    getTag() {
      const env = getEnv()
      if (env == "pc") return "SheetEditorPc"
      else return "SheetEditorMobile"
    }
  },
};
</script>