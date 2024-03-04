import { ENodeType, SheetNode, toPluginTypeString } from "@/utils/sheetNode"
import { parseSheet } from "@/utils/sheetParser";
import SheetMeta from "@/utils/sheetMeta";
import { Chord } from "./chord";

function generateNodeText(node) {
    switch (node.type) {
        case ENodeType.Root: {
            return node.children.map(n => generateNodeText(n)).join('');
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
            return "{" + node.children.map(n => generateNodeText(n)).join('') + "}";
        }
        case ENodeType.UnderlinePure: {
            return "!{" + node.children.map(n => generateNodeText(n)).join('') + "}";
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

export function generateSheetText(root: SheetNode, meta: SheetMeta = null, attachedChords: Chord[] = []) {
    // generate
    let data = ""

    if (meta) {
        let title = meta.title.replace(/"/g, "") // restriction
        data += "$title \"" + title + "\"\n"
        data += "$singer " + meta.singer + "\n"
        data += "$by " + meta.by + "\n"
        data += "$originalKey " + meta.originalKey + "\n"
        data += "$sheetKey " + meta.sheetKey + "\n"
        data += "$capo " + meta.capo + "\n"
        if (attachedChords.length > 0)
            data += "$chords " + attachedChords.map(c => c.toString()).join(" ") + "\n"
        data += "$rhythms \n"
        data += "$createTime " + new Date().toLocaleString() + "\n"
        data += "\n"
    }

    data += generateNodeText(root)

    // 测试能否解析
    try {
        parseSheet(data)
    }
    catch (e) {
        throw "生成曲谱文件失败：" + e
    }

    return data
}

export function toRawLyricString(root: SheetNode, recursive = true) {
    if (!recursive) {
        switch (root.type) {
            case ENodeType.Text: return root.content ?? "";
            case ENodeType.Chord: return this.isPlaceholder(root.content) ? "" : (root.content ?? "");
            case ENodeType.NewLine: return "\n";
            default: return "";
        }
    }
    else {
        let lyric = ""
        this.traverseDFS(root, (n) => {
            lyric += this.toString(n, false)
        })
        return lyric
    }
}
