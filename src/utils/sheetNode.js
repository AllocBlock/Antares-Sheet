import { assert } from "@/utils/assert"

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
    if (!this.parent) throw "节点没有父节点，不能获取索引";
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

  isUnderline() {
    return this.type == ENodeType.Underline || this.type == ENodeType.UnderlinePure
  }
  isChord() {
    return this.type == ENodeType.Chord || this.type == ENodeType.ChordPure
  }
  isNewLine() { return this.type == ENodeType.NewLine; }
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

export function validateTree(root) {
  for (let child of root.children) {
    if(child.parent != root) return false; // 树结构有误，子节点未指定父节点/或有错误的父节点

    if (child.type == ENodeType.Underline) { // 下划线的起始/末尾必须是下划线或和弦
      assert(child.children.length >= 1, "下划线节点必须包含两个及以上的节点")
      if (child.children.length == 1)
        assert(child.children[0].isUnderline(), "下划线节点如果只有一个子节点，则这个子节点必定是下划线节点")

      let firstChild = child.children[0]
      let lastChild = child.children[child.children.length - 1]
      assert(firstChild.isChord() || firstChild.isUnderline(), "下划线的第一个子节点必须是和弦或下划线")
      assert(lastChild.isChord() || lastChild.isUnderline(), "下划线的第一个子节点必须是和弦或下划线")
    }

    if (!validateTree(child))
      return false;
  }
  return true;
}