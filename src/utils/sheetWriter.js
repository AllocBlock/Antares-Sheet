import { ENodeType, toPluginTypeString } from "@/utils/sheetNode.js"
import { parseSheet } from "@/utils/sheetParser";

function _toSheetFileString(node) {
  switch (node.type) {
    case ENodeType.Root: {
      return node.children.map(n => _toSheetFileString(n)).join('');
    }
    case ENodeType.Text: return node.content;
    case ENodeType.NewLine: return "\n";
    case ENodeType.Chord: {
      let char = node.content
      if (char == "" || char == " ") char = "_"
      let chordName = node.chord
      return `[${chordName}]${char}`
    }
    case ENodeType.ChordPure: return `![${node.chord}]`;
    case ENodeType.Mark: return `!(${node.content})`;
    case ENodeType.Underline: {
      return "{" + node.children.map(n => _toSheetFileString(n)).join('') + "}";
    }
    case ENodeType.UnderlinePure: {
      return "!{" + node.children.map(n => _toSheetFileString(n)).join('') + "}";
    }
    case ENodeType.Plugin: {
      let pluginTypeString = toPluginTypeString(node.pluginType)
      return `*[${pluginTypeString}]{${node.content}}`
    }
    default: {
      console.warn("不支持的节点，已忽略：", node)
    }
  }
}

export function toSheetFileString(root, title, singer, by, originalKey, sheetKey, attachedChords = null) {

  // restriction
  title = title.replace(/"/g, "")

  // generate
  let data = ""
  data += "$title \"" + title + "\"\n"
  data += "$singer " + singer + "\n"
  data += "$by " + by + "\n"
  data += "$originalKey " + originalKey + "\n"
  data += "$sheetKey " + sheetKey + "\n"
  if (attachedChords !== null)
    data += "$chords " + attachedChords.join(" ") + "\n"
  data += "$rhythms \n"
  data += "$createTime " + new Date().toLocaleString() + "\n"
  data += "\n"

  data += _toSheetFileString(root)

  // 测试能否解析
  try {
    parseSheet(data)
  }
  catch (e) {
    throw "生成曲谱文件失败：" + e
  }

  return data
}