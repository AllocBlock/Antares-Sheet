<template>
  <component :is="tag"></component>
</template>

<script>
import { getEnv } from "@/utils/common.js";
import SheetEditorPc from "./editorPc.vue";
import SheetEditorMobile from "./editorMobile.vue";

export default {
  name: "SheetEditor",
  components: {
    SheetEditorPc,
    SheetEditorMobile,
  },
  computed: {
    tag() {
      const env = getEnv()
      return env == "pc" ? "SheetEditorPc" : "SheetEditorMobile"
    }
  },
};
</script>