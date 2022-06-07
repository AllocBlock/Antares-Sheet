<template>
  <TabNoteBase 
    v-if="note.type == 'single'" 
    :note="note" 
    :global-config="globalConfig"
  />
  <TabNoteConnect 
    v-else 
    :note="note" 
    :global-config="globalConfig"
  />
</template>

<script>
import TabNoteBase from "./noteBase.vue";
import TabNoteConnect from "./noteConnect.vue";

export default {
  name: "TabNote",
  components: {
    TabNoteBase,
    TabNoteConnect,
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
};
</script>