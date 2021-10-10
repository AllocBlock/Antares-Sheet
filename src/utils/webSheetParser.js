import { SheetNode, ENodeType, createUnknownNode } from "@/utils/sheetNode.js"

const ReChord = /(!?)\[([^\]]*)\]([^{]|(?:\{([^}])*\}))?/ // ![X] | [X] | [X]{word}
const ReMark = /!\(([^)]*)\)/ // !(content)
const splitMethods = [
  {
    matcher: (content) => { // *[type]{content}
      const RePluginStart = /\*\[([^\]]*)\]/ // *[type]
      let tempMatch = content.match(RePluginStart)
      if (!tempMatch) return null

      let pluginType = tempMatch[1]
      let contentStartIndex = tempMatch.index + tempMatch[0].length + 1
      let startIndex = tempMatch.index, endIndex = null
      let depth = 0
      for(let i = startIndex; i < content.length; ++i) {
        if (content[i] == '{') {
          depth++
        }
        else if (content[i] == '}') {
          depth--
          if (depth == 0) {
            endIndex = i
            break
          }
        }
      }

      if (!endIndex) throw "曲谱解析失败，插件格式有误"

      let match = []
      match.index = startIndex
      match[0] = content.substr(startIndex, endIndex - startIndex + 1)
      match[1] = pluginType
      match[2] = content.substr(contentStartIndex, endIndex - contentStartIndex)
      console.log(match)
      return match
    },
    createNodeFunc: (match) => {
      let pluginNode = new SheetNode(ENodeType.PluginType)
      pluginNode.pluginType = match[1]
      pluginNode.content = match[2]
      return pluginNode
    }
  },
  {
    matcher: (content) => { // !{content} | {content}
      let index
      let isPure = false
      let depth = 0
      for(let i = 0; i < content.length; ++i) {
        if (content[i] == '{') {
          if (depth == 0) {
            if (i > 0 && content[i - 1] == '!') {
              index = i - 1
              isPure = true
            }
            else {
              index = i
            }
          }
          depth++
        }
        else if (content[i] == '}') {
          depth--
          if (depth == 0) {
            let match = []
            match.index = index
            match[0] = content.substr(index, i - index + 1)
            match.content = match[0].substr(isPure ? 2 : 1, match[0].length - (isPure ? 3 : 2))
            match.isPure = isPure
            return match
          }
        }
      }
      return null
    },
    createNodeFunc: (match) => {
      let type = match.isPure ? ENodeType.UnderlinePure : ENodeType.Underline
      let underlineNode = new SheetNode(type)
      let underlineContent = match.content
      parseNodes(underlineNode, underlineContent)
      return underlineNode
    }
  },
  {
    matcher: ReChord, 
    createNodeFunc: (match) => {
      let type = match[1] ? ENodeType.ChordPure : ENodeType.Chord
      let chordNode = new SheetNode(type)
      chordNode.chord = match[2]
      if (type == ENodeType.Chord)
        chordNode.content = match[4] ?? match[3] 
      return chordNode
    }
  },
  {
    matcher: ReMark, 
    createNodeFunc: (match) => {
      let markNode = new SheetNode(ENodeType.Mark)
      markNode.content = match[1]
      return markNode
    }
  }
]

function getLine(str, offset) {
  if (offset > str) return [null, offset]
  let start = offset;
  let end = offset;
  while (end < str.length && str[end] != "\n") end++;
  return [str.substr(start, end), end + 1];
}

function matchSplit(content, matcher, createNode) {
  const match = (typeof matcher == "function") ? matcher(content) : content.match(matcher)
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

function parseNodes(parentNode, str) {
  let nodes = [createUnknownNode(str, parentNode)]
  // 遍历
  for(let i = 0; i < nodes.length; ++i) {
    const node = nodes[i]
    if (node.type != ENodeType.Unknown)
      continue
    const content = node.content

    let hasMatch = false
    for(let splitMethod of splitMethods) {
      let splitNodes = matchSplit(content, splitMethod.matcher, splitMethod.createNodeFunc)
      if (splitNodes) {
        for(let node of splitNodes)
          node.parent = parentNode
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

function parse(sheetText) {
  let rootNode = new SheetNode(ENodeType.Root)
  if (!sheetText) return null
  // 解析标签信息，标签信息具有通用性，可以自定义标签
  // 如果标签可以是一个值或是数组，数组中的每个值用空格隔开
  // 如果值中有空格则使用""将值括起来，如果值中有"则在前面加一个反斜杠变成\"
  let index = 0,
    line;
  while (true) {
    [line, index] = getLine(sheetText, index);
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

  let sheetBody = sheetText.substr(index);
  parseNodes(rootNode, sheetBody)
  return rootNode
}

export default {
  parse,
}