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
    return _traverseNext(node.parent, Editor.indexOf(node), callback);
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
    return _traversePrev(node.parent, Editor.indexOf(node), callback);
  else return null;
}

export const Editor = {
  isChord(node) {
    return node
      ? node.type == ENodeType.Chord || node.type == ENodeType.ChordPure
      : false;
  },
  isNewLine(node) {
    return node &&node.type == ENodeType.NewLine;
  },
  isUnderline(node) {
    return node
      ? node.type == ENodeType.Underline || node.type == ENodeType.UnderlinePure
      : false;
  },
  indexOf(node) {
    if (!node.parent) throw "该节点是根节点";
    return node.parent.children.findIndex((e) => e === node);
  },
  prevSibling(node) {
    let i = Editor.indexOf(node)
    if (i == 0) return null
    else return node.parent.children[i - 1]
  },
  nextSibling(node) {
    let i = Editor.indexOf(node)
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
  nextUntil(node1, node2, containStart = false, containEnd = false) {
    if (node1.parent != node2.parent) throw "元素不同级";
    return node1.parent.children.slice(
      this.indexOf(node1) + (containStart ? 0 : 1),
      this.indexOf(node2) + (containEnd ? 1 : 0)
    );
  },
  parentsOf(node) {
    let list = [];
    while (node.parent) {
      list.push(node.parent);
      node = node.parent;
    }
    return list;
  },
  parentUntil(node, target) {
    // 找到以target为父节点的祖先节点
    while (node.parent != target) {
      if (!node.parent) return null;
      node = node.parent;
    }
    return node;
  },
  traverseDFS(root, callback) {
    for (let i = 0; i < root.children.length; ++i) {
      this.traverseDFS(root.children[i], callback);
    }
    callback(root);
  },
  // node: 搜寻起始节点
  // isTargetCallback: 经过每个节点时调用，返回true则停止搜寻
  findNext(node, isTargetCallback) {
    return _traverseNext(node, node.children.length, isTargetCallback);
  },
  // node: 搜寻起始节点
  // isTargetCallback: 经过每个节点时调用，返回true则停止搜寻
  findPrev(node, isTargetCallback) {
    return _traversePrev(node, -1, isTargetCallback);
  },
  findNextNodeByType(node, type) {
    return this.findNext(node, (n) => n != node && n.type == type);
  },
  findPrevNodeByType(node, type) {
    return this.findPrev(node, (n) => n != node && n.type == type);
  },
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
  replace(node, data) {
    this.insert(node.parent, this.indexOf(node), data, 1);
  },
  insertAfter(node, data) {
    this.insert(node.parent, this.indexOf(node) + 1, data, 0);
  },
  insertBefore(node, data) {
    this.insert(node.parent, this.indexOf(node), data, 0);
  },
  remove(data) { // 无检查直接删除
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
  append(parent, data) {
    this.insert(parent, parent.children.length, data, 0);
  },
  prepend(parent, data) {
    this.insert(parent, 0, data, 0);
  },

  isFirstNode(node) {
    return node.parent && node.parent.type == ENodeType.Root && Editor.prevSibling(node) == null;
  },

  isLastNode(node) {
    return node.parent && node.parent.type == ENodeType.Root && Editor.nextSibling(node) == null;
  },

  createRootNode() {
    return reactive(new SheetNode(ENodeType.Root));
  },

  createChordNode(content, chordName) {
    let node = reactive(new SheetNode(ENodeType.Chord));
    node.content = content;
    node.chord = chordName;
    return node;
  },

  createTextNode(char) {
    if (!char) throw "不能创建空文本节点";
    if (char.length > 1) throw "编辑器中文本节点仅包含一个文字，请使用其他接口创建多个文本节点"; 
    if (char == "\n") throw "文本节点不应该包含换行符";

    let node = reactive(new SheetNode(ENodeType.Text));
    node.content = char;
    return node;
  },
  
  // per char per node
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

  createMarkNode(text) {
    if (!text) throw "不能创建空的标记节点";
    if (text.indexOf("\n") >= 0) throw "文本节点不应该包含换行符";

    let node = reactive(new SheetNode(ENodeType.Mark));
    node.content = text;
    return node;
  },

  createNewLineNode() {
    return reactive(new SheetNode(ENodeType.NewLine));
  },

  hasUnderlineToNextChord(chordNode) {
    if (!Editor.isChord(chordNode)) throw "类型错误";
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

    let nextChordNode = Editor.findNextNodeByType(chordNode, chordType);
    if (!nextChordNode) return false

    let commonAncestorNode = Editor.commonAncestor(chordNode, nextChordNode);
    return commonAncestorNode.type == underlineType;
  },

  isInUnderline(chordNode) {
    if (!Editor.isChord(chordNode)) throw "类型错误";
    let cur = chordNode
    while (cur) {
      if (Editor.isUnderline(cur)) return true;
      cur = cur.parent
    }
    return false
  },

  // insert($base, $inserted, pos) {
  //     switch (pos) {
  //         case "before":
  //             while(true) {
  //                 if ($base.is("char")) break; // 文字前面必定可以插入
  //                 else if ($base.parent().is("underline") && $base.index() == 0) {
  //                     // 如果非文字，且是下划线的第一个元素，那么移到上一级检测
  //                     $base = $base.parent();
  //                     continue;
  //                 }
  //                 break;
  //             }
  //             $base.before($inserted)
  //             break;
  //         case "after":
  //             while(true) {
  //                 if ($base.is("char")) break; // 文字后面必定可以插入
  //                 else if ($base.parent().is("underline") && $base.index() == $base.parent().children().length - 1) {
  //                     // 如果非文字，且是下划线的最后一个元素，那么移到上一级检测
  //                     $base = $base.parent();
  //                     continue;
  //                 }
  //                 break;
  //             }
  //             $base.after($inserted)
  //             break;
  //         default:
  //             throw "插入位置类型错误"
  //             break;
  //     }
  // },

  isPlaceholder(str) {
    return !str || str == "" || str == " " || str == "_"
  },

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
        this.replace(n, Editor.createTextNodes(n.content));
      }
      // 和弦内容拆分
      else if (n.type == ENodeType.Chord && n.content.length > 1) {
        EditorAction.updateContent(n, n.content);
      }
    });
  },
};
  
export const EditorAction = {
  remove(node) {
    // 非和弦，直接删除即可
    if (Editor.isChord(node)) { 
      this.removeAllUnderlineOnChord(node)
    }
    Editor.remove(node) 
  },
  updateTextContent(node, newContent) {
    if (node.type != ENodeType.Text) throw "类型错误，要求文本节点";
    Editor.replace(node, Editor.createTextNodes(newContent));
  },
  updateMarkContent(node, newContent) {
    if (node.type != ENodeType.Mark) throw "类型错误，要求标记节点";
    node.content = newContent;
  },
  updateChordContent(node, newContent) {
    if (!Editor.isChord(node)) throw "类型错误，要求和弦节点";
    if (newContent.length == 0) throw "内容错误，不能为空";
    node.content = newContent[0];
    // 找到最近的父节点下划线，要求和弦不在该下划线的末尾
    let targetNode = node;
    while (
      targetNode.parent &&
      Editor.indexOf(targetNode) == targetNode.parent.children.length - 1
    ) {
      targetNode = targetNode.parent;
    }
    if (newContent.length > 1) {
      // TODO: 可能要验证一下目标节点是否正确
      let textNodes = Editor.createTextNodes(newContent.substr(1));
      Editor.insertAfter(targetNode, textNodes);
    }
  },
  addUnderlineForChord(chordNode) {
    if (!Editor.isChord(chordNode)) throw "类型错误";
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

    let nextChordNode = Editor.findNextNodeByType(chordNode, chordType);
    if (!nextChordNode) throw "未找到下一个和弦";

    if (chordNode.parent == nextChordNode.parent) {
      // 同一层，那么将起始到结束之间的所有元素都放入一个下划线
      // console.log("s e");
      let coveredNodes = Editor.nextUntil(chordNode, nextChordNode, true, true);
      let newUnderlineNode = reactive(new SheetNode(underlineType));
      Editor.insertBefore(chordNode, newUnderlineNode);
      Editor.remove(coveredNodes);
      Editor.append(newUnderlineNode, coveredNodes);
    } else if (Editor.parentsOf(chordNode).includes(nextChordNode.parent)) {
      // 起始在内层，结束在外层，则把起始元素的同级下划线（和结束同层）向后扩展到包围结束和弦
      // console.log("[s] e");
      let startUnderlineNode = Editor.parentUntil(
        chordNode,
        nextChordNode.parent
      );
      let coveredNodes = Editor.nextUntil(
        startUnderlineNode,
        nextChordNode,
        false,
        true
      );
      Editor.remove(coveredNodes);
      Editor.append(startUnderlineNode, coveredNodes);
    } else if (Editor.parentsOf(nextChordNode).includes(chordNode.parent)) {
      // 起始在外层，结束在内层，则把结束元素的同级下划线（和起始同层）向前扩展到包围起始和弦
      // console.log("s [e]");
      let endUnderlineNode = Editor.parentUntil(nextChordNode, chordNode.parent);
      let coveredNodes = Editor.nextUntil(
        chordNode,
        endUnderlineNode,
        true,
        false
      );
      Editor.remove(coveredNodes);
      Editor.prepend(endUnderlineNode, coveredNodes);
    } else {
      // 起始结束都在内层（且不是同一个下划线），则把他们的同级下划线以及中间的元素合并到一个下划线
      // console.log("[s] [e]");
      let commonAncestorNode = Editor.commonAncestor(chordNode, nextChordNode);
      let startUnderlineNode = Editor.parentUntil(chordNode, commonAncestorNode);
      let endUnderlineNode = Editor.parentUntil(
        nextChordNode,
        commonAncestorNode
      );
      let coveredNodes = Editor.nextUntil(
        startUnderlineNode,
        endUnderlineNode,
        false,
        false
      );
      Editor.remove(coveredNodes);
      Editor.append(startUnderlineNode, coveredNodes);
      let endUnderlineChildrenNodes = endUnderlineNode.children.map((n) => n); // map创建新数组
      Editor.remove(endUnderlineChildrenNodes);
      Editor.append(startUnderlineNode, endUnderlineChildrenNodes);
      Editor.remove(endUnderlineNode);
    }
  },
  removeUnderlineOfChord(chordNode) {
    if (!Editor.isChord(chordNode)) throw "类型错误";
    if (!Editor.isUnderline(chordNode.parent)) throw "和弦不在下划线下，无需删除";

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

    let nextChordNode = Editor.findNextNodeByType(chordNode, chordType);
    if (!nextChordNode) throw "未找到下一个和弦";

    let commonAncestorNode = Editor.commonAncestor(chordNode, nextChordNode);
    if (!commonAncestorNode || !Editor.isUnderline(commonAncestorNode))
      throw "不在下划线下";
    // 起始节点是一个包含（或等于）起始和弦的元素，终止节点同理
    // 起始节点和终止节点一定是兄弟节点
    let startNode = Editor.parentUntil(chordNode, commonAncestorNode);
    let endNode = Editor.parentUntil(nextChordNode, commonAncestorNode);

    // 如果和弦在下划线内，起始和弦其前定有和弦，终止和弦则其后定有和弦
    // 否则就要看兄弟节点其前其后是否有和弦节点
    let beforeStartNodes = startNode.parent.children.slice(
      0,
      Editor.indexOf(startNode)
    );
    let afterStartNodes = startNode.parent.children.slice(
      Editor.indexOf(startNode) + 1
    );
    let beforeEndNodes = endNode.parent.children.slice(
      0,
      Editor.indexOf(endNode)
    );
    let afterEndNodes = endNode.parent.children.slice(
      Editor.indexOf(endNode) + 1
    );
    let hasPrev =
      Editor.isUnderline(startNode) ||
      beforeStartNodes.filter((n) => n.type == chordType).length > 0;
    let hasNextNext =
      Editor.isUnderline(endNode) ||
      afterEndNodes.filter((n) => n.type == chordType).length > 0;

    if (!hasPrev && !hasNextNext) {
      // 下划线只有这两个和弦，则删除整个下划线，内容放到外面
      // console.log("_s e_");
      Editor.replace(commonAncestorNode, commonAncestorNode.children);
    } else if (hasPrev && !hasNextNext) {
      // 起始和弦前面还有元素，但结束和弦后面没有，需要把起始和弦之后的所有元素移出
      // console.log("_xxx s e_");
      Editor.remove(afterStartNodes);
      Editor.insertAfter(commonAncestorNode, afterStartNodes);
    } else if (!hasPrev && hasNextNext) {
      // 起始和弦前面没有，但结束和弦后面有元素，需要把结束和弦之前的所有元素移出
      // console.log("_s e xxx_");
      Editor.remove(beforeEndNodes);
      Editor.insertBefore(commonAncestorNode, beforeEndNodes);
    } else {
      // 前后都有元素，需要从中间断开
      // console.log("_xxx s e yyy_");
      let newUnderlineNode = reactive(new SheetNode(underlineType));
      Editor.insertAfter(commonAncestorNode, newUnderlineNode);
      Editor.remove(afterStartNodes);
      Editor.append(newUnderlineNode, afterStartNodes);
      beforeEndNodes = endNode.parent.children.slice(0, Editor.indexOf(endNode)); // 这一堆被放到新位置的，需要更新，这里实际获取到的是之前after和before的交集
      Editor.remove(beforeEndNodes);
      Editor.insertBefore(newUnderlineNode, beforeEndNodes);
    }
  },

  removeAllUnderlineOnChord(chordNode) {
    // 首先对自己进行下划线删除操作，移除自己到后面和弦的下划线
    while(Editor.hasUnderlineToNextChord(chordNode)) {
      EditorAction.removeUnderlineOfChord(chordNode)
    }
    // 如果还在下划线下，则要删除前面和弦的所有下划线
    let prevChordNode = Editor.findPrevNodeByType(chordNode, chordNode.type)
    if (prevChordNode) {
      while(Editor.hasUnderlineToNextChord(prevChordNode)) {
        EditorAction.removeUnderlineOfChord(prevChordNode)
      }
    }
  },

  convertToText(node, removeEmptyNode = true) {
    if (node.type == ENodeType.Text) return node;
    else if (Editor.isChord(node)) {
      this.removeAllUnderlineOnChord(node) // 删除和弦下划线

      let content = node.content
      if (Editor.isPlaceholder(content)) { // 空和弦
        if (removeEmptyNode) { // 删除
          Editor.remove(node)
          return null
        }
        else { // 全部标记为空格
          content = " "
        }
      }

      let textNodes = Editor.createTextNodes(content)
      Editor.replace(node, textNodes);
      return textNodes
    }
    else {
      throw "类型错误，无法转换该节点为文本节点";
    }
  },

  updateChord(node, chordName) {
    node.chord = chordName
  },

  convertToChord(node, chordName) {
    if (Editor.isChord(node)) {
      this.updateChord(node, chordName);
      return node
    }
    else if (node.type == ENodeType.Text) {
      let chordNode = Editor.createChordNode(node.content, chordName)
      Editor.replace(node, chordNode)
      EditorAction.updateChordContent(chordNode, chordNode.content);
      return chordNode
    }
    else {
      throw "类型错误，无法转换该节点为和弦节点"
    }
  },

  updateContent(node, content) {
    switch (node.type) {
      case ENodeType.Text: {
        EditorAction.updateTextContent(node, content);
        break;
      }
      case ENodeType.Mark: {
        EditorAction.updateMarkContent(node, content);
        break;
      }
      case ENodeType.Chord: {
        EditorAction.updateChordContent(node, content);
        break;
      }
      default: {
        console.warn("无法编辑该节点的内容", node);
        break;
      }
    }
  },

  editContent(node) {
    if (!node) throw "节点为空"

    let newContent = _getInputText("编辑内容", node.content);
    if (!newContent) return;
    this.updateContent(node, newContent)
  },

  editTextWithNeighbor(node) {
    if (!node) throw "节点为空"

    let text = node.content
    let textNodes = [node]
    // 向前
    let cur = Editor.prevSibling(node)
    while(cur) {
      if (cur.type != ENodeType.Text) break;
      textNodes.splice(0, 0, cur)
      text = cur.content + text
      cur = Editor.prevSibling(cur)
    }

    // 向后
    cur = Editor.nextSibling(node)
    while(cur) {
      if (cur.type != ENodeType.Text) break;
      textNodes.push(cur)
      text += cur.content
      cur = Editor.nextSibling(cur)
    }

    let newText = _getInputText("编辑文本", text);

    Editor.insertAfter(node, Editor.createTextNodes(newText))
    Editor.remove(textNodes)
  },

  highlightNode(node) {
    node.style.opacity = 0.5
    if (node.type == ENodeType.Text && Editor.isPlaceholder(node.content)) {
      node.style.background = "var(--theme-color)"
    }
  },

  unhighlightNode(node) {
    if (node && node.style && node.style.opacity !== undefined) {
      delete node.style.opacity
      if (node.style.background) delete node.style.background
    }
  },
};