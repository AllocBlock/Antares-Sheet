import { assert } from "@/utils/assert"
import { Chord } from "./chord";

let gNextId = 1

export enum ENodeType {
  Unknown = "未知",
  Root = "根",
  Text = "文本",
  Chord = "和弦标注",
  ChordPure = "纯和弦",
  Mark = "标记",
  Underline = "下划线",
  UnderlinePure = "纯下划线",
  NewLine = "换行",
  Plugin = "插件"
}

export enum EPluginType {
  Unknown = "未知",
  Tab = "指法谱"
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
  id: number
  type : ENodeType
  parent : SheetNode
  children : SheetNode[]
  content : string
  chord? : Chord
  style: {
    opacity?: number,
    color?: string,
    background?: string
  }
  valid?: boolean
  pluginType ?: EPluginType

  constructor(type, parent = null) {
    this.id = gNextId++
    this.type = type
    this.parent = parent
    this.children = []
    this.content = ''

    this.style = {}
  }

  hasParent() : boolean { return this.parent != null; }

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

  isFirstChild() : boolean { return this.prevSibling() == null; }
  isLastChild() : boolean { return this.nextSibling() == null; }

  // by tree
  nextNode() {
    if (!this.parent) return null;

    let nextSibling = this.nextSibling()
    if (nextSibling) return nextSibling;
    
    return this.parent.nextNode()
  }

  // by tree
  prevNode() {
    if (!this.parent) return null;

    let prevSibling = this.prevSibling()
    if (prevSibling) return prevSibling;
    
    return this.parent.prevNode()
  }

  isUnderline() {
    return this.type == ENodeType.Underline || this.type == ENodeType.UnderlinePure
  }
  isChord() {
    return this.type == ENodeType.Chord || this.type == ENodeType.ChordPure
  }
  isText() { return this.type == ENodeType.Text }
  isNewLine() { return this.type == ENodeType.NewLine; }

  clone() : SheetNode{
    let newRoot = new SheetNode(this.type, this.parent)
    newRoot.content = this.content
    if (this.chord)
      newRoot.chord = this.chord

    for (let child of this.children) {
      let newChild = child.clone()
      newChild.parent = newRoot
      newRoot.children.push(newChild)
    }
    return newRoot
  }
}

function _traverseForwardHelper(node, index, callback) {
  // if index == 0, this node's all descendants will be tranversed, not considering parent
  // else, only children after this index will be tranversed
  if (callback(node))
    return true;

  for (let i = index; i < node.children.length; ++i)
    if (_traverseForwardHelper(node.children[i], 0, callback))
      return true;
  
  if (index > 0 && node.parent)
    if (_traverseForwardHelper(node.parent, node.getSelfIndex() + 1, callback))
      return true;
  return false;
}

function _traverseNext(node, index, callback) {
  if (callback(node)) return node;
  // 继续向后遍历
  // 已知当前节点、起始索引
  // 递归调用索引>起始索引的子节点，传入索引=-1，表示该节点需要被完整遍历，不再遍历回父节点
  // 如果起始索引>-1，且有父节点，递归调用父节点，传入索引=自身索引
  for (let i = index + 1; i < node.children.length; ++i) {
    let res = _traverseNext(node.children[i], -1, callback);
    if (res) return res;
  }
  if (index > -1 && node.parent)
    return _traverseNext(node.parent, node.getSelfIndex(), callback);
  else return null;
}

function _traversePrev(node : SheetNode, index, callback) {
  if (callback(node)) return node;
  // 继续向前遍历
  // 已知当前节点、结束索引
  // 递归倒序调用索引<结束索引的子节点，传入索引=其孩子数量，表示该节点需要被完整遍历，不再遍历回父节点
  // 如果起始索引<其孩子数量，且有父节点，递归调用父节点，传入索引=自身索引
  for (let i = index - 1; i >= 0; --i) {
    let res = _traversePrev(node.children[i], node.children[i].children.length, callback);
    if (res) return res;
  }
  if (index < node.children.length && node.parent)
    return _traversePrev(node.parent, node.getSelfIndex(), callback);
  else return null;
}

function forceArray(data) {
  if (!Array.isArray(data)) return [data]
  return data
}

// provide raw unsafe action on tree and node
export const NodeUtils = {
  commonAncestor(node1, node2) {
    let node1Ancestors = [];
    let tempNode = node1;
    while (tempNode.parent) {
      node1Ancestors.push(tempNode.parent);
      tempNode = tempNode.parent;
    }
    tempNode = node2;
    while (tempNode.parent) {
      if (node1Ancestors.includes(tempNode.parent)) return tempNode.parent;
      tempNode = tempNode.parent;
    }
    return null;
  },
  /** 获取同级元素之间的所有元素 */
  getSiblingBetween(node1, node2, containStart = false, containEnd = false) {
    if (node1.parent != node2.parent) throw "节点不同级";
    return node1.parent.children.slice(
      node1.getSelfIndex() + (containStart ? 0 : 1),
      node2.getSelfIndex() + (containEnd ? 1 : 0)
    );
  },
  /** 获取所有祖先节点，从近到远 */
  parentsOf(node) {
    let list = [];
    while (node.parent) {
      list.push(node.parent);
      node = node.parent;
    }
    return list;
  },
  /** 找到以target为父节点的祖先节点（即target下一层的祖先节点），如果没找到则返回null */
  parentUntil(node, target) {
    while (node.parent != target) {
      if (!node.parent) return null;
      node = node.parent;
    }
    return node;
  },
  /** 深度优先+后序遍历树 
   * FIXME: 遍历中添加/删除的情况如何处理？
  */
  traverseDFS(root, callback) {
    for (let i = 0; i < root.children.length; ++i) {
      this.traverseDFS(root.children[i], callback);
    }
    callback(root);
  },
  /** 深度优先+后序遍历树，用于删除节点
   * 返回true删除该节点
   */
   traverseDelete(root, callback) {
    for (let i = 0; i < root.children.length; ++i) {
      let child = root.children[i];
      let needDelete = callback(child);
      if (needDelete) {
        this.removeFromParent(child)
        i--;
      }
      else {
        this.traverseDelete(child, callback);
      }
    }
  },
  /**
   * 向后寻找节点
   * @param {SheetNode} node - 搜索起始节点，搜索时 包括 自己.
   * @param {(SheetNode) => boolean | void} isTargetCallback - 自定义回调，经过每个节点时调用，如果返回true则停止搜寻
   */
  findNext(node, isTargetCallback) {
    return _traverseNext(node, node.children.length, isTargetCallback);
  },
  /**
   * 向前寻找节点
   * @param {SheetNode} node - 搜索起始节点，搜索时 包括 自己.
   * @param {(SheetNode) => boolean | void} isTargetCallback - 自定义回调，经过每个节点时调用，如果返回true则停止搜寻
   */
  findPrev(node, isTargetCallback) {
    return _traversePrev(node, -1, isTargetCallback);
  },
  /**
   * 寻找下一个节点（指定类型）
   * @param {SheetNode} node - 搜索起始节点，搜索时 不包括 自己.
   * @param {ENodeType} type - 节点类型
   */
  findNextNodeByType(node, type) {
    return this.findNext(node, (n) => n != node && n.type == type);
  },
  /**
   * 寻找上一个节点（指定类型）
   * @param {SheetNode} node - 搜索起始节点，搜索时 不包括 自己.
   * @param {ENodeType} type - 节点类型
   */
  findPrevNodeByType(node, type) {
    return this.findPrev(node, (n) => n != node && n.type == type);
  },
  /**
   * 插入子节点
   * @param {SheetNode} parent - 目标节点
   * @param {Int} index - 插入位置索引，在该索引前方插入
   * @param {SheetNode/Array} data - 插入数据，可以是单个节点，也可以是节点数组
   * @param {Int} replace - 替换数目，参考splice的replace参数
   */
  insert(parent, index, data, replace = 0) {
    if (index < 0) throw "索引错误";
    data = forceArray(data)
    for (let n of data)
      n.parent = parent;
    parent.children.splice(index, replace, ...data);
  },
  /**
   * 替换节点
   * @param {SheetNode} node - 目标节点
   * @param {SheetNode/Array} data - 替换成的数据，可以是单个节点，也可以是节点数组
   */
  replace(node, data) {
    this.insert(node.parent, node.getSelfIndex(), data, 1);
  },
  /** 在后方插入节点，可以是数组，自动更新父节点 */
  insertAfter(node, data) {
    this.insert(node.parent, node.getSelfIndex() + 1, data, 0);
  },
  /** 在前方插入节点，可以是数组，自动更新父节点 */
  insertBefore(node, data) {
    this.insert(node.parent, node.getSelfIndex(), data, 0);
  },
  /** 移除节点，使其成为游离节点，可以是数组（没有树结构检查），自动更新父节点 */
  removeFromParent(data) {
    data = forceArray(data)
    for (let node of data) {
      assert(node.parent, "节点早已游离，无需再操作")
      this.replace(node, []);
      node.parent = null;
    }
  },
  /** 在末尾插入节点，可以是数组，自动更新父节点 */
  append(parent, data) {
    this.insert(parent, parent.children.length, data, 0);
  },
  /** 在起始插入节点，可以是数组，自动更新父节点 */
  prepend(parent, data) {
    this.insert(parent, 0, data, 0);
  },
  /** 判断是否是第一个子节点 */
  isFirstNode(node) {
    return node.parent && node.parent.type == ENodeType.Root && node.prevSibling() == null;
  },
  /** 判断是否是最后一个子节点 */
  isLastNode(node) {
    return node.parent && node.parent.type == ENodeType.Root && node.nextSibling() == null;
  },
  /** 创建一个根节点 */
  createRootNode() {
    return new SheetNode(ENodeType.Root);
  },
  /** 创建一个和弦节点 */
  createChordNode(content,  chord : Chord) : SheetNode {
    let node = new SheetNode(ENodeType.Chord);
    node.content = content;
    node.chord = chord;
    return node;
  },
  /** 创建一个文本节点，只能是单个字符 */
  createTextNode(char) {
    if (!char) throw "不能创建空文本节点";
    if (char.length > 1) throw "编辑器中文本节点仅包含一个文字，请使用其他接口创建多个文本节点"; 
    if (char == "\n") throw "文本节点不应该包含换行符";

    let node = new SheetNode(ENodeType.Text);
    node.content = char;
    return node;
  },
  /** 创建一组文本节点，每个字符对应一个节点，返回数组 */
  createTextNodes(content) {
    if (!content) throw "不能创建空文本节点";
    let nodes = [];
    for (let char of content) {
      let node
      if (char == "\n") {
        node = new SheetNode(ENodeType.NewLine);
      } else {
        node = new SheetNode(ENodeType.Text);
        node.content = char;
      }
      nodes.push(node);
    }
    return nodes;
  },
  /** 创建一个标记节点 */
  createMarkNode(text) {
    if (!text) throw "不能创建空的标记节点";
    if (text.indexOf("\n") >= 0) throw "文本节点不应该包含换行符";

    let node = new SheetNode(ENodeType.Mark);
    node.content = text;
    return node;
  },
  /** 创建一个换行节点 */
  createNewLineNode() {
    return new SheetNode(ENodeType.NewLine);
  },
  /** 创建一个下划线节点 */
  createUnderlineNode(isPure) {
    return new SheetNode(isPure ? ENodeType.UnderlinePure : ENodeType.Underline);
  },
  createUnknownNode(content) {
    let node = new SheetNode(ENodeType.Unknown)
    node.content = content
    return node
  },
  /** 判断是否有连向后方的下划线 */
  hasUnderlineToNextChord(chordNode) {
    if (!chordNode.isChord()) throw "类型错误";
    let chordType = chordNode.type;
    let underlineType;
    switch (chordType) {
      case ENodeType.Chord:
        underlineType = ENodeType.Underline;
        break;
      case ENodeType.ChordPure:
        underlineType = ENodeType.UnderlinePure;
        break;
      default:
        throw "类型错误";
    }

    let nextChordNode = this.findNextNodeByType(chordNode, chordType);
    if (!nextChordNode) return false

    let commonAncestorNode = this.commonAncestor(chordNode, nextChordNode);
    return commonAncestorNode.type == underlineType;
  },
  /** 判断是否在下划线内 */
  isInUnderline(chordNode) {
    if (!chordNode.isChord()) throw "类型错误";
    let cur = chordNode
    while (cur) {
      if (cur.isUnderline()) return true;
      cur = cur.parent
    }
    return false
  },
  /** 判断文本是否是占位符 */
  isPlaceholder(str) {
    return !str || str == "" || str == " " || str == "_"
  },
  // 深度优先，向前（右/末尾）继续遍历
  // callback：回调函数，遍历到每个节点时会触发，返回true表示停止遍历，否则将继续遍历
  traverseForward(startNode, includeSelfChildren, callback) {
    _traverseForwardHelper(startNode, includeSelfChildren ? 0 : startNode.children.length, callback)
  },
  // 规范化曲谱树为编辑模式
  toEditingSheetTree(node) {
    this.traverseDFS(node, (n) => {
      // 文本拆分
      if (n.type == ENodeType.Text && n.content.length > 0) {
        this.replace(n, this.createTextNodes(n.content));
      }
    });
  },
  // 检查树是否有效
  validateSheetTree(root : SheetNode) : boolean {
    for (let child of root.children) {
      if(child.parent != root) return false; // 树结构有误，子节点未指定父节点/或有错误的父节点
  
      if (child.type == ENodeType.Underline) { // 下划线的起始/末尾必须是下划线或和弦
        assert(child.children.length >= 1, "下划线节点必须拥有子节点")
        if (child.children.length == 1)
          assert(child.children[0].isUnderline(), "下划线节点如果只有一个子节点，则这个子节点必定是下划线节点")
  
        let firstChild = child.children[0]
        let lastChild = child.children[child.children.length - 1]
        assert(firstChild.isChord() || firstChild.isUnderline(), "下划线的第一个子节点必须是和弦或下划线")
        assert(lastChild.isChord() || lastChild.isUnderline(), "下划线的第一个子节点必须是和弦或下划线")
      }
  
      if (!this.validateSheetTree(child))
        return false;
    }
    return true;
  }
};