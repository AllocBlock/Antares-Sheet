<template>
  <TabNoteBase 
    v-if="note.type == 'single'" 
    :note="note" 
    :tab-config="tabConfig"
  />
  <TabNoteConnect 
    v-else 
    :note="note" 
    :tab-config="tabConfig"
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
    tabConfig: {
      type: Object,
      required: true,
    },
  },
};
</script>