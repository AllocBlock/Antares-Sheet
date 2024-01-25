

import SheetMeta from "@/utils/sheetMeta";
import { SheetEditor } from "./editor";
import { ENodeType, NodeUtils, SheetNode } from "@/utils/sheetNode";
import { reactive, ref } from "vue";
import { assert } from "@/utils/assert";



const toolChord = ref({
  showPanel: false,
  attachedChords: [],
  events: {}
})

export function useEditor(sheetMeta : SheetMeta, sheetRoot : SheetNode) {
  assert(sheetRoot.type == ENodeType.Root, `editor: sheet root must be typed ROOT, rather than ${sheetRoot.type}`)
  const editor = new SheetEditor(sheetMeta, sheetRoot)
  return {
    toolChord,
    editor
  }
}