export const ENodeType = {
  Unknown: "未知",
  Root: "根",
  Text: "文本",
  Chord: "和弦",
  ChordPure: "纯和弦",
  Mark: "标记",
  Underline: "下划线",
  UnderlinePure: "纯下划线",
  NewLine: "换行",
  Plugin: "插件"
}

export const EPluginType = {
  Unknown: 0,
  Tab: 1,
}

export class SheetNode {
  constructor(type) {
    this.type = type
    this.children = []
    this.style = {}
  }
}

export var createUnknownNode = function(content, parent = null) {
  let node = new SheetNode(ENodeType.Unknown)
  node.content = content
  node.parent = parent
  return node
}

export function traverseNode(node, callback) {
  for(let childNode of node.children)
    traverseNode(childNode, callback)
  callback(node)
}