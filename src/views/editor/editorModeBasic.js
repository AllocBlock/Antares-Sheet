import { Editor, EditorAction } from "./editor.js";
import ChordManager from "@/utils/chordManager.js";

let gThis = null

export default {
  tip: `【基础编辑模式】双击可以编辑文字/添加下划线\n右键可以打开菜单`,
  componentEvents: {
    text: {
      dblclick: (e, node) => {
        EditorAction.editContent(node);
      },
      contextmenu: (e, node) => {
        gThis.openContext(e, node)
      },
    },
    chord: {
      click: (e, node) => {
        gThis.playChord(ChordManager.getChord(node.chord));
      },
      dblclick: (e, node) => {
        if (!e.shiftKey) {
          EditorAction.addUnderlineForChord(node);
        }
        else if (Editor.hasUnderlineToNextChord(node)){
          EditorAction.removeUnderlineOfChord(node);
        }
      },
      contextmenu: (e, node) => gThis.openContext(e, node),
    },
    mark: {
      dblclick: (e, node) => {
        EditorAction.editContent(node);
      },
      contextmenu: (e, node) => gThis.openContext(e, node),
    },
    newline: {
      contextmenu: (e, node) => gThis.openContext(e, node),
    },
  },
  documentEvents: {
  },
  toolChordEvents: {},
  init: function(instance) {
    gThis = instance
  },
  release: function() {}
}