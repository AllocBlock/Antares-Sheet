let gNextId = 1

export const ENodeType = {
  Unknown: "未知",
  Root: "根",
  Text: "文本",
  Chord: "和弦标注",
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

export function toPluginTypeEnum(str) {
  str = str.toLowerCase()
  switch(str) {
    case "tab": return EPluginType.Tab;
    default: return EPluginType.Unknown;
  }
}

export function toPluginTypeString(pluginTypeEnum) {
  switch(pluginTypeEnum) {
    case EPluginType.Tab: return "tab";
    default: throw "未知的类型"
  }
}

export class SheetNode {
  constructor(type, parent = null) {
    this.id = gNextId++
    this.type = type
    this.parent = parent
    this.children = []
    this.style = {}
    this.index = 0
    this.content = ''
  }

  getSelfIndex() {
    if (!this.parent) return null;
    let index = this.parent.children.indexOf(this)
    if (index < 0) throw "wrong tree structure, parent dont contain this child";
    return index
  }

  deleteSelf() {
    if (!this.parent) return;
    let index = this.getSelfIndex()
    this.parent.children.splice(index, 1)
  }

  prevSibling() {
    let index = this.getSelfIndex()
    if (index == 0) return null;
    else return this.parent.children[index - 1];
  }

  nextSibling() {
    let index = this.getSelfIndex()
    if (index == this.parent.children.length - 1) return null;
    else return this.parent.children[index + 1];
  }
}

export var createUnknownNode = function(content, parent = null) {
  let node = new SheetNode(ENodeType.Unknown, parent)
  node.content = content
  return node
}

// DFS / child first
export function traverseNode(node, callback) {
  for(let childNode of node.children)
    traverseNode(childNode, callback)
  callback(node)
}

export function isTreeStructureCorrect(root) {
  try {
    traverseNode(root, (n) => {
      if (n != root) {
        if (n.parent == null)
          throw "tree structure error";
      }
    })
    return true;
  } catch {
    console.error("tree structure error")
    return false;
  }
}