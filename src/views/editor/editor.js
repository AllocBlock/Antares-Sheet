import { SheetNode, ENodeType } from "@/utils/sheetNode.js";
import { reactive } from "vue";

function _getInputText(tips, defaultText = "") {
  return prompt(tips, defaultText);
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
    return _traverseNext(node.parent, NodeUtils.indexOf(node), callback);
  else return null;
}

function _traversePrev(node, index, callback) {
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
    return _traversePrev(node.parent, NodeUtils.indexOf(node), callback);
  else return null;
}

export const NodeUtils = {
  isChord(node) { return node && (node.type == ENodeType.Chord || node.type == ENodeType.ChordPure); },
  isNewLine(node) { return node && node.type == ENodeType.NewLine; },
  isUnderline(node) { return node && (node.type == ENodeType.Underline || node.type == ENodeType.UnderlinePure); },
  indexOf(node) {
    if (!node.parent) throw "该节点是根节点";
    return node.parent.children.findIndex((e) => e === node);
  },
  prevSibling(node) {
    let i = NodeUtils.indexOf(node)
    if (i == 0) return null
    else return node.parent.children[i - 1]
  },
  nextSibling(node) {
    let i = NodeUtils.indexOf(node)
    if (i == node.parent.children.length - 1) return null
    else return node.parent.children[i + 1]
  },
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
    if (node1.parent != node2.parent) throw "元素不同级";
    return node1.parent.children.slice(
      this.indexOf(node1) + (containStart ? 0 : 1),
      this.indexOf(node2) + (containEnd ? 1 : 0)
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
  /** 深度优先+后序遍历树 */
  traverseDFS(root, callback) {
    for (let i = 0; i < root.children.length; ++i) {
      this.traverseDFS(root.children[i], callback);
    }
    callback(root);
  },
  /**
   * 向后寻找节点
   * @param {SheetNode} node - 搜索起始节点，搜索时 包括 自己.
   * @param {ENodeType} isTargetCallback - 自定义回调，经过每个节点时调用，如果返回true则停止搜寻
   */
  findNext(node, isTargetCallback) {
    return _traverseNext(node, node.children.length, isTargetCallback);
  },
  /**
   * 向前寻找节点
   * @param {SheetNode} node - 搜索起始节点，搜索时 包括 自己.
   * @param {ENodeType} isTargetCallback - 自定义回调，经过每个节点时调用，如果返回true则停止搜寻
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

    if (Array.isArray(data)) {
      for (let newNode of data) newNode.parent = parent;
      parent.children.splice(index, replace, ...data);
    } else {
      data.parent = parent;
      parent.children.splice(index, replace, data);
    }
  },
  /**
   * 替换节点
   * @param {SheetNode} node - 目标节点
   * @param {SheetNode/Array} data - 替换成的数据，可以是单个节点，也可以是节点数组
   */
  replace(node, data) {
    this.insert(node.parent, this.indexOf(node), data, 1);
  },
  /** 在后方插入节点，可以是数组 */
  insertAfter(node, data) {
    this.insert(node.parent, this.indexOf(node) + 1, data, 0);
  },
  /** 在前方插入节点，可以是数组 */
  insertBefore(node, data) {
    this.insert(node.parent, this.indexOf(node), data, 0);
  },
  /** 移除节点，可以是数组（没有树结构检查） */
  remove(data) {
    if (Array.isArray(data)) {
      for (let node of data) {
        this.replace(node, []);
        node.parent = null;
      }
    } else {
      this.replace(data, []);
      data.parent = null;
    }
  },
  /** 在末尾插入节点，可以是数组 */
  append(parent, data) {
    this.insert(parent, parent.children.length, data, 0);
  },
  /** 在起始插入节点，可以是数组 */
  prepend(parent, data) {
    this.insert(parent, 0, data, 0);
  },
  /** 判断是否是第一个子节点 */
  isFirstNode(node) {
    return node.parent && node.parent.type == ENodeType.Root && NodeUtils.prevSibling(node) == null;
  },
  /** 判断是否是最后一个子节点 */
  isLastNode(node) {
    return node.parent && node.parent.type == ENodeType.Root && NodeUtils.nextSibling(node) == null;
  },
  /** 创建一个根节点 */
  createRootNode() {
    return reactive(new SheetNode(ENodeType.Root));
  },
  /** 创建一个和弦节点 */
  createChordNode(content, chordName) {
    let node = reactive(new SheetNode(ENodeType.Chord));
    node.content = content;
    node.chord = chordName;
    return node;
  },
  /** 创建一个文本节点，只能是单个字符 */
  createTextNode(char) {
    if (!char) throw "不能创建空文本节点";
    if (char.length > 1) throw "编辑器中文本节点仅包含一个文字，请使用其他接口创建多个文本节点"; 
    if (char == "\n") throw "文本节点不应该包含换行符";

    let node = reactive(new SheetNode(ENodeType.Text));
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
        node = reactive(new SheetNode(ENodeType.NewLine));
      } else {
        node = reactive(new SheetNode(ENodeType.Text));
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

    let node = reactive(new SheetNode(ENodeType.Mark));
    node.content = text;
    return node;
  },
  /** 创建一个换行节点 */
  createNewLineNode() {
    return reactive(new SheetNode(ENodeType.NewLine));
  },
  /** 判断是否有连向后方的下划线 */
  hasUnderlineToNextChord(chordNode) {
    if (!NodeUtils.isChord(chordNode)) throw "类型错误";
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

    let nextChordNode = NodeUtils.findNextNodeByType(chordNode, chordType);
    if (!nextChordNode) return false

    let commonAncestorNode = NodeUtils.commonAncestor(chordNode, nextChordNode);
    return commonAncestorNode.type == underlineType;
  },
  /** 判断是否在下划线内 */
  isInUnderline(chordNode) {
    if (!NodeUtils.isChord(chordNode)) throw "类型错误";
    let cur = chordNode
    while (cur) {
      if (NodeUtils.isUnderline(cur)) return true;
      cur = cur.parent
    }
    return false
  },
  /** 判断文本是否是占位符 */
  isPlaceholder(str) {
    return !str || str == "" || str == " " || str == "_"
  },
  /** 将节点转为字符串，用于提取纯歌词，可选是否递归转换 */
  toString(node, recursive = false) {
    if (!recursive) {
      switch(node.type) {
        case ENodeType.Text: return node.content ?? "";
        case ENodeType.Chord: return this.isPlaceholder(node.content) ? "" : (node.content ?? "");
        case ENodeType.NewLine: return "\n";
        default: return "";
      }
    }
    else {
      let lyric = ""
      this.traverseDFS(node, (n) => {
          lyric += this.toString(n, false)
      })
      return lyric
    }
  },
  // 规范化曲谱树为编辑模式
  normalizeSheetTree(node) {
    this.traverseDFS(node, (n) => {
      // 文本拆分
      if (n.type == ENodeType.Text && n.content.length > 1) {
        this.replace(n, NodeUtils.createTextNodes(n.content));
      }
      // 和弦内容拆分
      else if (n.type == ENodeType.Chord && n.content.length > 1) {
        EditAction.updateContent(n, n.content);
      }
    });
  },
};
  
export const EditAction = {
  /** 安全删除节点 */
  removeSafely(node) {
    // 非和弦，直接删除即可
    if (NodeUtils.isChord(node)) { 
      this.removeAllUnderlineOnChord(node)
    }
    NodeUtils.remove(node) 
  },
  /** 更新文本内容，自动拆分 */
  updateTextContent(node, newContent) {
    if (node.type != ENodeType.Text) throw "类型错误，要求文本节点";
    NodeUtils.replace(node, NodeUtils.createTextNodes(newContent));
  },
  /** 更新标记内容 */
  updateMarkContent(node, newContent) {
    if (node.type != ENodeType.Mark) throw "类型错误，要求标记节点";
    node.content = newContent;
  },
  /** 更新和弦内容，多余文本自动放到后面 */
  updateChordContent(node, newContent) {
    if (!NodeUtils.isChord(node)) throw "类型错误，要求和弦节点";
    if (newContent.length == 0) throw "内容错误，不能为空";
    node.content = newContent[0];
    // 如果在下划线内，则找到最近的一个祖先下划线节点，要求和弦不在该下划线的末尾
    let targetNode = node;
    while (
      targetNode.parent &&
      NodeUtils.indexOf(targetNode) == targetNode.parent.children.length - 1
    ) {
      targetNode = targetNode.parent;
    }
    if (newContent.length > 1) {
      // TODO: 可能要验证一下目标节点是否正确
      let textNodes = NodeUtils.createTextNodes(newContent.substr(1));
      NodeUtils.insertAfter(targetNode, textNodes);
    }
  },
  /** 添加一层下划线，即增加一层当前和弦和下一个和弦的连接 */
  addUnderlineForChord(chordNode) {
    if (!NodeUtils.isChord(chordNode)) throw "类型错误";
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
        console.error("非和弦不能添加下划线");
        return;
    }

    let nextChordNode = NodeUtils.findNextNodeByType(chordNode, chordType);
    if (!nextChordNode) throw "未找到下一个和弦";

    if (chordNode.parent == nextChordNode.parent) {
      // 同一层，那么将起始到结束之间的所有元素都放入一个下划线
      // console.log("s e");
      let coveredNodes = NodeUtils.getSiblingBetween(chordNode, nextChordNode, true, true);
      let newUnderlineNode = reactive(new SheetNode(underlineType));
      NodeUtils.insertBefore(chordNode, newUnderlineNode);
      NodeUtils.remove(coveredNodes);
      NodeUtils.append(newUnderlineNode, coveredNodes);
    } else if (NodeUtils.parentsOf(chordNode).includes(nextChordNode.parent)) {
      // 起始在内层，结束在外层，则把起始元素的同级下划线（和结束同层）向后扩展到包围结束和弦
      // console.log("[s] e");
      let startUnderlineNode = NodeUtils.parentUntil(
        chordNode,
        nextChordNode.parent
      );
      let coveredNodes = NodeUtils.getSiblingBetween(
        startUnderlineNode,
        nextChordNode,
        false,
        true
      );
      NodeUtils.remove(coveredNodes);
      NodeUtils.append(startUnderlineNode, coveredNodes);
    } else if (NodeUtils.parentsOf(nextChordNode).includes(chordNode.parent)) {
      // 起始在外层，结束在内层，则把结束元素的同级下划线（和起始同层）向前扩展到包围起始和弦
      // console.log("s [e]");
      let endUnderlineNode = NodeUtils.parentUntil(nextChordNode, chordNode.parent);
      let coveredNodes = NodeUtils.getSiblingBetween(
        chordNode,
        endUnderlineNode,
        true,
        false
      );
      NodeUtils.remove(coveredNodes);
      NodeUtils.prepend(endUnderlineNode, coveredNodes);
    } else {
      // 起始结束都在内层（且不是同一个下划线），则把他们的同级下划线以及中间的元素合并到一个下划线
      // console.log("[s] [e]");
      let commonAncestorNode = NodeUtils.commonAncestor(chordNode, nextChordNode);
      let startUnderlineNode = NodeUtils.parentUntil(chordNode, commonAncestorNode);
      let endUnderlineNode = NodeUtils.parentUntil(
        nextChordNode,
        commonAncestorNode
      );
      let coveredNodes = NodeUtils.getSiblingBetween(
        startUnderlineNode,
        endUnderlineNode,
        false,
        false
      );
      NodeUtils.remove(coveredNodes);
      NodeUtils.append(startUnderlineNode, coveredNodes);
      let endUnderlineChildrenNodes = endUnderlineNode.children.map((n) => n); // map创建新数组
      NodeUtils.remove(endUnderlineChildrenNodes);
      NodeUtils.append(startUnderlineNode, endUnderlineChildrenNodes);
      NodeUtils.remove(endUnderlineNode);
    }
  },
  /** 删除一层下划线，即删除一层当前和弦和下一个和弦的连接 */
  removeUnderlineOfChord(chordNode) {
    if (!NodeUtils.isChord(chordNode)) throw "类型错误";
    if (!NodeUtils.isUnderline(chordNode.parent)) throw "和弦不在下划线下，无需删除";

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
        console.error("非和弦不能添加下划线");
        return;
    }

    let nextChordNode = NodeUtils.findNextNodeByType(chordNode, chordType);
    if (!nextChordNode) throw "未找到下一个和弦";

    let commonAncestorNode = NodeUtils.commonAncestor(chordNode, nextChordNode);
    if (!commonAncestorNode || !NodeUtils.isUnderline(commonAncestorNode))
      throw "不在下划线下";
    // 起始节点是一个包含（或等于）起始和弦的元素，终止节点同理
    // 起始节点和终止节点一定是兄弟节点
    let startNode = NodeUtils.parentUntil(chordNode, commonAncestorNode);
    let endNode = NodeUtils.parentUntil(nextChordNode, commonAncestorNode);

    // 如果和弦在下划线内，起始和弦其前定有和弦，终止和弦则其后定有和弦
    // 否则就要看兄弟节点其前其后是否有和弦节点
    let beforeStartNodes = startNode.parent.children.slice(
      0,
      NodeUtils.indexOf(startNode)
    );
    let afterStartNodes = startNode.parent.children.slice(
      NodeUtils.indexOf(startNode) + 1
    );
    let beforeEndNodes = endNode.parent.children.slice(
      0,
      NodeUtils.indexOf(endNode)
    );
    let afterEndNodes = endNode.parent.children.slice(
      NodeUtils.indexOf(endNode) + 1
    );
    let hasPrev =
      NodeUtils.isUnderline(startNode) ||
      beforeStartNodes.filter((n) => n.type == chordType).length > 0;
    let hasNextNext =
      NodeUtils.isUnderline(endNode) ||
      afterEndNodes.filter((n) => n.type == chordType).length > 0;

    if (!hasPrev && !hasNextNext) {
      // 下划线只有这两个和弦，则删除整个下划线，内容放到外面
      // console.log("_s e_");
      NodeUtils.replace(commonAncestorNode, commonAncestorNode.children);
    } else if (hasPrev && !hasNextNext) {
      // 起始和弦前面还有元素，但结束和弦后面没有，需要把起始和弦之后的所有元素移出
      // console.log("_xxx s e_");
      NodeUtils.remove(afterStartNodes);
      NodeUtils.insertAfter(commonAncestorNode, afterStartNodes);
    } else if (!hasPrev && hasNextNext) {
      // 起始和弦前面没有，但结束和弦后面有元素，需要把结束和弦之前的所有元素移出
      // console.log("_s e xxx_");
      NodeUtils.remove(beforeEndNodes);
      NodeUtils.insertBefore(commonAncestorNode, beforeEndNodes);
    } else {
      // 前后都有元素，需要从中间断开
      // console.log("_xxx s e yyy_");
      let newUnderlineNode = reactive(new SheetNode(underlineType));
      NodeUtils.insertAfter(commonAncestorNode, newUnderlineNode);
      NodeUtils.remove(afterStartNodes);
      NodeUtils.append(newUnderlineNode, afterStartNodes);
      beforeEndNodes = endNode.parent.children.slice(0, NodeUtils.indexOf(endNode)); // 这一堆被放到新位置的，需要更新，这里实际获取到的是之前after和before的交集
      NodeUtils.remove(beforeEndNodes);
      NodeUtils.insertBefore(newUnderlineNode, beforeEndNodes);
    }
  },
  /** 删除所处的所有下划线 */
  removeAllUnderlineOnChord(chordNode) {
    // 首先对自己进行下划线删除操作，移除自己到后面和弦的下划线
    while(NodeUtils.hasUnderlineToNextChord(chordNode)) {
      EditAction.removeUnderlineOfChord(chordNode)
    }
    // 如果还在下划线下，则要删除前面和弦的所有下划线
    let prevChordNode = NodeUtils.findPrevNodeByType(chordNode, chordNode.type)
    if (prevChordNode) {
      while(NodeUtils.hasUnderlineToNextChord(prevChordNode)) {
        EditAction.removeUnderlineOfChord(prevChordNode)
      }
    }
  },
  /** 将节点转换为文本节点 */
  convertToText(node, removeEmptyNode = true) {
    if (node.type == ENodeType.Text) return node;
    else if (NodeUtils.isChord(node)) {
      this.removeAllUnderlineOnChord(node) // 删除和弦下划线

      let content = node.content
      if (NodeUtils.isPlaceholder(content)) { // 空和弦
        if (removeEmptyNode) { // 删除
          NodeUtils.remove(node)
          return null
        }
        else { // 全部标记为空格
          content = " "
        }
      }

      let textNodes = NodeUtils.createTextNodes(content)
      NodeUtils.replace(node, textNodes);
      return textNodes
    }
    else {
      throw "类型错误，无法转换该节点为文本节点";
    }
  },
  /** 更新和弦节点的和弦 */
  updateChord(node, chordName) {
    node.chord = chordName
  },
  /** 文本节点转为和弦节点 */
  convertToChord(node, chordName) {
    if (NodeUtils.isChord(node)) {
      this.updateChord(node, chordName);
      return node
    }
    else if (node.type == ENodeType.Text) {
      let chordNode = NodeUtils.createChordNode(node.content, chordName)
      NodeUtils.replace(node, chordNode)
      EditAction.updateChordContent(chordNode, chordNode.content);
      return chordNode
    }
    else {
      throw "类型错误，无法转换该节点为和弦节点"
    }
  },
  /** 安全更新节点的内容 */
  updateContent(node, content) {
    switch (node.type) {
      case ENodeType.Text: {
        EditAction.updateTextContent(node, content);
        break;
      }
      case ENodeType.Mark: {
        EditAction.updateMarkContent(node, content);
        break;
      }
      case ENodeType.Chord: {
        EditAction.updateChordContent(node, content);
        break;
      }
      default: {
        console.warn("无法编辑该节点的内容", node);
        break;
      }
    }
  },
  /** 安全输入任意节点的内容 */
  editContent(node) {
    if (!node) throw "节点为空"

    let newContent = _getInputText("编辑内容", node.content);
    if (!newContent) return;
    this.updateContent(node, newContent)
  },
  /** 对连接的文本节点统一编辑输入 */
  editTextWithNeighbor(node) {
    if (!node) throw "节点为空"

    let text = node.content
    let textNodes = [node]
    // 向前
    let cur = NodeUtils.prevSibling(node)
    while(cur) {
      if (cur.type != ENodeType.Text) break;
      textNodes.splice(0, 0, cur)
      text = cur.content + text
      cur = NodeUtils.prevSibling(cur)
    }

    // 向后
    cur = NodeUtils.nextSibling(node)
    while(cur) {
      if (cur.type != ENodeType.Text) break;
      textNodes.push(cur)
      text += cur.content
      cur = NodeUtils.nextSibling(cur)
    }

    let newText = _getInputText("编辑文本", text);

    NodeUtils.insertAfter(node, NodeUtils.createTextNodes(newText))
    NodeUtils.remove(textNodes)
  },
  /** 高亮节点 */
  highlightNode(node) {
    node.style.opacity = 0.5
    if (node.type == ENodeType.Text && NodeUtils.isPlaceholder(node.content)) {
      node.style.background = "var(--theme-color)"
    }
  },
  /** 取消高亮节点 */
  unhighlightNode(node) {
    if (node && node.style && node.style.opacity !== undefined) {
      delete node.style.opacity
      if (node.style.background) delete node.style.background
    }
  },
};