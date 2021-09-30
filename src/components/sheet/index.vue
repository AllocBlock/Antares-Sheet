<template>
  <div class="container" ref="container" :style="globalCssVar">
    <div v-if="sheetTree" ref="sheet">
      <SheetNodeRoot :node="sheetTree" />
    </div>
    <span v-else>曲谱加载中...</span>
  </div>
</template>

<script>
import $ from "jquery";
import Chord from "@/components/chord"
import WebTab from "@/utils/webTab"
import { SheetNode, ENodeType, createUnknownNode } from "./sheetNode.js"
import SheetNodeRoot from "./root"

export default {
  name: "Sheet",
  components: {
    Chord, SheetNodeRoot
  },
  data() {
    return {
      globalCssVar: {
        // "--sheet-theme-color": "black",
        "--sheet-theme-color": "#e9266a",
        "--sheet-font-size": "30px",
        "--sheet-underline-color": "var(--sheet-theme-color)",
        "--sheet-line-height": "calc(var(--sheet-font-size) + 20px)",
        "--sheet-line-thickness": "calc(var(--sheet-font-size) * 0.05)" /* 各种下划线的粗细 */
      },
      sheetTree: null
    };
  },
  props: {
    sheetText: {
      type: String,
      required: true,
      default: "",
    },
  },
  mounted() {
    this.parseSheet();
  },
  methods: {
    parseSheet() {
      let rootNode = new SheetNode(ENodeType.Root)
      let parentNode = rootNode
      let str = this.sheetText;
      if (!str) return;
      // 解析标签信息，标签信息具有通用性，可以自定义标签
      // 如果标签可以是一个值或是数组，数组中的每个值用空格隔开
      // 如果值中有空格则使用""将值括起来，如果值中有"则在前面加一个反斜杠变成\"
      let index = 0,
        line;
      while (true) {
        [line, index] = this.getLine(str, index);
        if (line === null)
          break
        if (line.match(/^\s*$/))
          continue
        else if (line[0] == "$") {
          let splitResult = line.match(/\$([^\s]*)\s(.*)/);
          if (!splitResult) throw "解析标签失败";
          let [key, valueStr] = [splitResult[1], splitResult[2]];
          let matchResult = valueStr.match(/("([^\\]|\\.)*?")|([^\s]+)/g);
          let value;
          if (matchResult) {
            value = matchResult.map((e) => {
              if (!e) return "";
              else {
                let raw;
                if (e[0] == '"') raw = e.substr(1, e.length - 2);
                else raw = e;
                raw = raw.replace(/\\(.)/, "$1"); // 反转义
                return raw;
              }
            });
          } else {
            value = "";
          }

          if (value.length == 1) value = value[0];

          rootNode[key] = value;
        } else break;
      }

      
      let sheetBody = str.substr(index);
      parseNodes(rootNode, sheetBody)
      console.log(rootNode)
      this.sheetTree = rootNode
    },
    getLine(str, offset) {
      if (offset > str) return [null, offset]
      let start = offset;
      let end = offset;
      while (end < str.length && str[end] != "\n") end++;
      return [str.substr(start, end), end + 1];
    },
  },
  watch: {
    sheetText: function () {
      this.$nextTick(() => {
        this.parseSheet();
      });
    },
  },
};


function matchSplit(content, re, createNode) {
  const match = content.match(re)
  if (!match) return false
  const newContent = match[0]
  let splitNodes = []
  if (match.index > 0) {
    splitNodes.push(createUnknownNode(content.substr(0, match.index)))
  }
  splitNodes.push(createNode(match))
  if (match.index + newContent.length < content.length) {
    splitNodes.push(createUnknownNode(content.substr(match.index + newContent.length)))
  }
  return splitNodes
}

const RePlugin = /\*\[([^\]]*)\]\{\{([\S\s]*?)\}\}/ // *[type]{{content}}
const ReUnderline = /(!?)\{([^\}]*)\}/ // !{content} | {content}
const ReChord = /(!?)\[([^\]]*)\]([^{]|(?:\{([^}])*\}))?/ // ![X] | [X] | [X]{word}
const ReInfo = /!\(([^)]*)\)/ // !(content)
const splitMethods = [
  {
    re: RePlugin,
    createNodeFunc: (match) => {
      let pluginNode = new SheetNode(ENodeType.PluginType)
      pluginNode.pluginType = match[1]
      pluginNode.content = match[2]
      return pluginNode
    }
  },
  {
    re: ReUnderline,
    createNodeFunc: (match) => {
      let type = match[1] ? ENodeType.UnderlinePure : ENodeType.Underline
      let underlineNode = new SheetNode(type)
      let underlineContent = match[2]
      parseNodes(underlineNode, underlineContent)
      return underlineNode
    }
  },
  {
    re: ReChord, 
    createNodeFunc: (match) => {
      let type = match[1] ? ENodeType.ChordPure : ENodeType.Chord
      let chordNode = new SheetNode(type)
      chordNode.chord = match[2]
      chordNode.content = match[4] ?? match[3] 
      return chordNode
    }
  },
  {
    re: ReInfo, 
    createNodeFunc: (match) => {
      let infoNode = new SheetNode(ENodeType.Info)
      infoNode.content = match[1]
      return infoNode
    }
  }
]
function parseNodes(parentNode, str) {
  let nodes = [createUnknownNode(str)]
  // 遍历
  for(let i = 0; i < nodes.length; ++i) {
    const node = nodes[i]
    if (node.type != ENodeType.Unknown)
      continue
    const content = node.content

    let hasMatch = false
    for(let splitMethod of splitMethods) {
      let splitNodes = matchSplit(content, splitMethod.re, splitMethod.createNodeFunc)
      if (splitNodes) {
        nodes.splice(i, 1, ...splitNodes)
        hasMatch = true
        break
      }
    }
    if (hasMatch) {
      --i
      continue
    }
    else { // 都不匹配，说明是纯文本
      node.type = ENodeType.Text
    }
  }
  parentNode.children = nodes
}

</script>

<style>
/* 占位标记 */
placeholder {
  display: inline-block;
  border-bottom: var(--sheet-line-thickness) solid var(--sheet-theme-color);
  width: var(--sheet-font-size);
}

/* 和弦 */
chord {
  color: var(--sheet-theme-color);
  user-select: none;
  position: relative;
  cursor: default;
  text-shadow: 0 0 0.5px rgba(0, 0, 0, 0.3);
  white-space: pre;
}
chord:before {
  content: " ";
  position: relative;
  display: inline-block;
  margin-top: var(--sheet-line-height);
  height: 0;
  width: 0;
}
chord::after {
  content: "";
  position: absolute;
  left: -10px;
  top: calc(-8px - var(--sheet-font-size));
  right: -10px;
  bottom: -2px;
  border: 2px solid transparent;
  transition: 0.3s ease-out;
  border-radius: 5px;
  z-index: 1;
  pointer-events: none;
}

chord:hover::after,
chord_pure:hover::after {
  border: 2px solid var(--sheet-theme-color);
  box-shadow: 0 0 5px 2px black;
}

/* 和弦名称 */
chord_name {
  color: var(--sheet-theme-color);
  position: absolute;
  user-select: none;
  transition: 0.5s ease-out;
  text-align: center;
  text-shadow: none;
  width: fit-content;

  left: 50%;
  transform: translateX(-50%);

  display: flex;
  justify-content: center;
  align-items: center;
  bottom: 100%;
}

/* 同行和弦 */
chord_pure {
  color: var(--sheet-theme-color);
  user-select: none;
  position: relative;
  cursor: default;
  transition: 0.5s ease-out;
}
chord_pure::after {
  content: "";
  position: absolute;
  left: -10px;
  top: -2px;
  right: -10px;
  bottom: -2px;
  border: 2px solid transparent;
  transition: 0.3s ease-out;
  border-radius: 5px;
  z-index: 1;
  pointer-events: none;
}

/* 标记信息 */
info {
  padding: 3px 8px;
  border-radius: 5px;
  background-color: var(--sheet-theme-color);
  color: white;
  user-select: none;
  margin: 10px 5px;
  line-height: calc(var(--sheet-font-size) * 2);
}

/* 下划线 */
underline {
  border-top: var(--sheet-line-thickness) solid var(--sheet-underline-color);
}

underline > underline {
  border-top: var(--sheet-line-thickness) solid var(--sheet-underline-color);
  padding-top: calc(var(--sheet-line-thickness) * 3);
}

underline > underline > underline {
  border-top: var(--sheet-line-thickness) solid var(--sheet-underline-color);
  padding-top: calc(var(--sheet-line-thickness) * 6);
}

underline > underline > underline > underline {
  border-top: none;
}

/* 同行下划线 */
underline_pure {
  border-bottom: var(--sheet-line-thickness) solid var(--sheet-underline-color);
}

underline_pure > underline_pure {
  border-bottom: var(--sheet-line-thickness) solid var(--sheet-underline-color);
  padding-bottom: calc(var(--sheet-line-thickness) * 3);
}

underline_pure > underline_pure > underline_pure {
  border-bottom: var(--sheet-line-thickness) solid var(--sheet-underline-color);
  padding-bottom: calc(var(--sheet-line-thickness) * 6);
}

underline_pure > underline_pure > underline_pure > underline_pure {
  border-bottom: none;
}

newline::after {
  content: "\D\A";
}

.container {
  word-wrap: break-word;
  user-select: none;
  letter-spacing: 1px;
  white-space: pre-wrap;
  white-space: break-spaces; /* 优先，如果不支持则退回pre-wrap */
  position: relative;

  font-family: Tahoma, Verdana, Arial, Microsoft YaHei, sans-serif;
}

.container chord {
  letter-spacing: 1px;
}

.container chord_name {
  letter-spacing: 0px;
}

.container chord_pure {
  letter-spacing: 0px;
}
</style>
<style src="@/utils/webTab.css"></style>