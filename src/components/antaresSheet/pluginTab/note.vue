<template>
  <TabNoteSingle v-if="isSingleNote" :note="(note as TabSingleNote)" />
  <TabNoteConnect v-else :note="(note as TabConnectNote)" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import TabNoteSingle from "./noteSingle.vue";
import TabNoteConnect from "./noteConnect.vue";
import { TabConnectNote, TabSingleNote } from "./tabParser";

const props = defineProps({
  note: {
    type: [TabSingleNote, TabConnectNote],
    required: true,
  }
})

const isSingleNote = computed<boolean>(() => {
  return props.note instanceof TabSingleNote
})
</script>