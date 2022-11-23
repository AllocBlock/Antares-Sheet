import { parseSheet } from "@/utils/sheetParser.js"
import { NodeUtils } from "@/utils/sheetEdit.js"
import { ENodeType, SheetNode } from "@/utils/sheetNode.js"

function _toSheetText(xxxText) {
  let xxx = xxxText.replace(/(\r|\n|\r\n)+/g, "\n") // 格式化换行符，并删除空行

  let index = xxx.indexOf("::")

  let info = xxx.slice(index + 2)
  let [chordsStr, rhythmsStr, sheetInfoStr] = info.split("::")
  let chrods = chordsStr.split("/*/")
  let rhythms = rhythmsStr.split("/*/")
  console.log(sheetInfoStr.split("/*/"))
  let [name, singer, fontsize, upper, unknown, originalKey, sheetKey, offsetX, offsetY, page] = sheetInfoStr.split("/*/")

  let sheetBody = xxx.slice(0, index)
  sheetBody = sheetBody.replace(/\/\*\//g, "") // 分页符号，删除
  sheetBody = sheetBody.replace(/\[([^\]]*)\]/g, "!($1)")
  sheetBody = sheetBody.replace(/\<([^>]*)_\>([^<>]*?)\<([^>]*)_\>([^<>])([^<>]*?)\<([^>]*)\>\n/g, "{{<$1>$2<$3>$4}$5<$6>\n}") // <a_>bbbb<c_>dddd<e>\n
  sheetBody = sheetBody.replace(/\<([^>]*)_\>([^<>]*?)\<([^>]*)_\>([^<>])([^<>]*?)\<([^>]*)\>(.)/g, "{{<$1>$2<$3>$4}$5<$6>$7}") // <a_>bbbb<c_>dddd<e>f\n
  sheetBody = sheetBody.replace(/\<([^>]*)_\>([^<>]*?)\<([^>]*)\>\n/g, "{<$1>$2<$3> \n}") // <a_>bbbb<c>\n
  sheetBody = sheetBody.replace(/\<([^>]*)_\>([^<>]*?)\<([^>]*)\>(.)/g, "{<$1>$2<$3>$4}") // <a_>bbb<c>d
  sheetBody = sheetBody.replace(/\<([^>]*)\>\+/g, "![$1]")
  sheetBody = sheetBody.replace(/\<([^>]*)\> /g, "[$1]_")
  sheetBody = sheetBody.replace(/\<([^>]*)\>\n/g, "[$1]_\n")
  sheetBody = sheetBody.replace(/\<([^>]*)\>(.)/g, "[$1]$2")

  let matchResult = null
  while (matchResult = sheetBody.match(/{(([^}]*\!\[[^\]]*]\][^}]*\[[^\]]*\][^}]*)|(([^}]*\[[^\]]*\][^}]*\!\[[^\]]*\][^}]*)))}/)) { // 一个下划线内既有chord又有chord_pure，全部变成chord，并且删除空的chord_pure
    let underlineStr = matchResult[0]
    underlineStr = underlineStr.replace(/\!(\[\])/g, "")
    underlineStr = underlineStr.replace(/\!(\[.*\])/g, "$1 ")
    sheetBody = sheetBody.replace(matchResult[0], underlineStr)
  }
  sheetBody = sheetBody.replace(/({[^}]*\![^}]*})/g, "!$1") // 内部有chord_pure，改成下横线（比较暴力，没有匹配括号，先用着吧

  let sheetChordsStr = ""
  for (let chord of chrods) {
    if (chord.length) sheetChordsStr += chord + " "
  }
  let sheetHead = `$title "${name}"
$singer "${singer}"
$by "${upper}"
$originalKey ${originalKey}
$sheetKey ${sheetKey}
$chords ${sheetChordsStr}
`
  let sheet = sheetHead + sheetBody

  return sheet;
}

const ReMatchChordAtStart = /^\s*((#?b?[A-Ga-g]#?b?)((maj|add|sus|aug|dim|[1-9])*)?[ \t]*)+/
const ReSplitChord = /(#?b?[A-Ga-g]#?b?)((maj|add|sus|aug|dim|[1-9])*)?/g

export function convertXXX2Sheet(xxxText) {
  let sheetText = _toSheetText(xxxText)
  let root = parseSheet(sheetText)

  // TODO: 连成一片的无文本和弦全部转为纯和弦

  // 如果标记后面紧跟文本节点，则可能对应了和弦
  // 尝试匹配，如果都是和弦，则自动转为纯和弦节点
  // 注意和弦的文本可能和歌词文本有重叠，需要处理
  NodeUtils.traverseDFS(root, (n) => {
    if (n.type == ENodeType.Mark) {
      let next = NodeUtils.nextSibling(n);
      if (!next) return
      if (next.type == ENodeType.Text) {
        let res = next.content.match(ReMatchChordAtStart)
        if (!res) return
        console.log(next.content, res)
        let chordListStr = res[0]
        let chords = chordListStr.match(ReSplitChord)
        
        let newNodes = []
        for (let chord of chords) {
          let pureChordNode = new SheetNode(ENodeType.ChordPure)
          pureChordNode.chord = chord
          newNodes.push(pureChordNode)
        }

        let remainText = next.content.slice(chordListStr.length)
        let remainTextNode = new SheetNode(ENodeType.Text)
        remainTextNode.content = remainText
        newNodes.push(remainTextNode)

        NodeUtils.replace(next, newNodes)
      }
    }
  })

  // 以前我习惯标记和间奏放第二行，处理下放到同一行
  NodeUtils.traverseDelete(root, (n) => {
    if (n.type == ENodeType.Text && n.content.trim() == "") { // 空白字符的文本节点
      let prev = NodeUtils.prevSibling(n);
      if (!prev) return false;
      let next = NodeUtils.nextSibling(n);
      if (!next) return false;
      if (prev.type == ENodeType.Mark &&  // 前为标记，后为纯和弦/纯和弦下划线
        (next.type == ENodeType.ChordPure || next.type == ENodeType.UnderlinePure)) {
        return true;
      }
    }
    return false;
  })

  // *在任何生成纯和弦之后执行
  // 删除纯和弦中间的空格
  NodeUtils.traverseDelete(root, (n) => {
    if (n.type == ENodeType.Text && n.content.trim() == "") { // 空白字符的文本节点
      let prev = NodeUtils.prevSibling(n);
      if (!prev) return false;
      let next = NodeUtils.nextSibling(n);
      if (!next) return false;
      if ((prev.type == ENodeType.ChordPure || next.type == ENodeType.UnderlinePure) &&  // 前后都为纯和弦/纯和弦下划线
        (next.type == ENodeType.ChordPure || next.type == ENodeType.UnderlinePure)) {
        return true;
      }
    }
    return false;
  })

  // *在任何生成和弦/纯和弦之后执行
  // 删除和弦名称为空的和弦/和弦
  NodeUtils.traverseDelete(root, (n) => {
    return ((n.type == ENodeType.Chord || n.type == ENodeType.ChordPure) && (!n.chord || n.chord.trim() == ""));
  })

  // 处理特殊情况：<Dm_>至少我<Em_>们中还<F_>有人能<D_>快乐<>+ 
  NodeUtils.traverseDFS(root, (n) => {
    if (n.type == ENodeType.Chord || n.type == ENodeType.ChordPure) {
      while (n.chord.endsWith("_")) {
        n.chord = n.chord.slice(0, -1)
      }
    }
  })

  return root
}