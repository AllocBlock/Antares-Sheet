<template>
  <div id="raw_editor_panel" class="panel" v-show="props.show">
    <div id="raw_editor_container">
      <div id="raw_editor_title">在下方编辑原始曲谱，可以直接粘贴歌词~</div>
      <textarea id="raw_editor_textarea" v-model="localSheetText"></textarea>
      <div v-if="!isValid" class="flex" style="color: red">
        曲谱格式格式有误，请检查：「{{ invalidReason }}」
      </div>
      <div class="flex">
        <div v-if="isValid" id="raw_editor_button_confirm" class="button" @click="confirmRawSheet">确认</div>
        <div id="raw_editor_button_cancel" class="button" @click="cancel">取消</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DelayTrigger } from "@/utils/timer";
import { NodeUtils } from "@/utils/sheetNode";
import { parseSheet } from "@/utils/sheetParser";
import { watch, ref, onMounted } from "vue";

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  sheetText: {
    type: String,
    default: ""
  }
})

const localSheetText = ref("")
const isValid = ref(false)
const invalidReason = ref("")

const emits = defineEmits([
  "confirm",
  "cancel",
])

function confirmRawSheet() {
  if (!confirm("是否确认修改？将会覆盖原本的曲谱")) return;
  let [meta, root] = parseSheet(localSheetText.value)
  emits("confirm", root)
}

function cancel() {
  localSheetText.value = props.sheetText
  emits("cancel")
}

watch(() => [props.sheetText, props.show], () => {
  localSheetText.value = props.sheetText
})

function validateSheetText() {
  isValid.value = false
  try {
    let [meta, root] = parseSheet(localSheetText.value)
    NodeUtils.toEditingSheetTree(root);
    NodeUtils.validateSheetTree(root);
    isValid.value = true
  }
  catch (e) { 
    invalidReason.value = e.toString()
  }
}

const VALIDATE_INTERVAL_MS = 100
const delayTrigger = new DelayTrigger(validateSheetText, VALIDATE_INTERVAL_MS)

watch(localSheetText, () => {
  if (!props.show) return;
  delayTrigger.trigger()
  // validateSheetText()
})

onMounted(() => {
  localSheetText.value = props.sheetText
})
</script>

<style scoped src="@/components/editorCommon.css" />
<style scoped lang="scss">
.panel {
  z-index: 30;

  position: fixed;
  height: 100%;
  width: 100%;
  left: 0;
  top: 0;
}

#raw_editor_panel {
  #raw_editor_container {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.8);
  }

  #raw_editor_title {
    font-size: 20px;
    padding: 20px 0;
    color: white;
  }

  #raw_editor_textarea {
    font-family: inherit;
    color: black;
    font-size: var(--base-font-size);
    height: 60%;
    width: 60%;
  }

  #raw_editor_button_confirm {
    background: var(--sheet-theme-color);
    color: white;
  }

  #raw_editor_button_cancel {
    background: grey;
    color: white;
  }
}
</style>