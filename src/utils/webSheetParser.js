import { WebTab } from "./webTab.js"

class DigitalSheet {
    constructor(str) { this._parseSheet(str) }

    getSheetElement() {
        if (this.$sheet)
            return this.$sheet
        else
            return ""
    }

    getValue(key) {
        if (this[key])
            return this[key]
        else
            return null
    }

    getUniqueValue(key) {
        if (this[key])
            if (Array.isArray(this[key]))
                return this[key].join(" ")
            else
                return this[key]
        else
            return ""
    }

    getArrayValue(key) {
        if (this[key])
            if (Array.isArray(this[key]))
                return this[key]
            else
                return [this[key]]
        else
            return []
    }

    _parseSheet(str) {
        // 解析标签信息，标签信息具有通用性，可以自定义标签
        // 如果标签可以是一个值或是数组，数组中的每个值用空格隔开
        // 如果值中有空格则使用""将值括起来，如果值中有"则在前面加一个反斜杠变成\"
        let index = 0, line
        while(true) {
            let newIndex
            [line, newIndex] = _getLine(str, index)
            if (line[0] == "$") {
                index = newIndex
                let splitResult = line.match(/\$([^\s]*)\s(.*)/)
                if (!splitResult)
                    throw "解析标签失败"
                let [key, valueStr] = [splitResult[1], splitResult[2]];
                let matchResult = valueStr.match(/("([^\\]|\\.)*?")|([^\s]+)/g)
                let value
                if (matchResult) {
                    value = matchResult.map(e=> {
                        if (!e) return ""
                        else {
                            let raw
                            if (e[0] == '"')
                                raw = e.substr(1, e.length - 2)
                            else
                                raw = e
                            raw = raw.replace(/\\(.)/, "$1") // 反转义
                            return raw
                        }
                    })
                }
                else {
                    value = ""
                }
                
                if (value.length == 1)
                    value = value[0]

                this[key] = value
            }
            else
                break;
        }

        // 解析插件信息，目前只有指法谱插件，后续可能有别的（插入图片，快捷工具啥的？）
        const RePlugin = /\*\[(.*)\]/
        let pluginElements = []
        let res
        let pluginIndex = 0
        while(res = str.match(RePlugin)) {
            let type = res[1]
            let startIndex = str.indexOf(res[0])
            let pluginInfo = _getPlugin(str, startIndex)
            switch(pluginInfo.type) {
                case "tab" : {
                    let tab = new WebTab
                    let $tab = tab.create(pluginInfo.content)
                    pluginElements.push($tab)
                    let pluginPlaceholderHTML = `<sheet-plugin index="${pluginIndex}"></sheet-plugin>`;
                    str = str.replace(pluginInfo.plugin, pluginPlaceholderHTML)
                    ++pluginIndex
                    break;
                }
                default:
                    throw `不支持的插件类型：${type}`
            }
        }
        
        const UnderlineTagName =
        {
            "normal": "underline",
            "pure": "underline_pure"
        }

        // isStart 是否是起始标签，为真是起始标签，为假则是结束标签
        // str 要替换的文本
        // tag 替换成的标签
        // pos 替换起始位置
        // length 替换的长度
        // 返回被替换的字符串，以及新的索引（位于替换字符串的末尾）
        function replaceBracket(isStart, str, tag, pos, length = 1) {
            let replacement = "<" + (isStart ? "" : "/") + tag + ">"
            str = str.slice(0, pos) + replacement + str.slice(pos + length)
            let newPos = pos + replacement.length - 1
            return [str, newPos]
        }

        let newlineMatchRes = str.substr(0, index).match(/\n/g)
        let sheetBody = str.substr(index)
        index = 0
        let typeStack = []
        let curDepth = -1
        let curLine = 1 + (newlineMatchRes ? newlineMatchRes.length : 0)
        let curPos = 0
        while (index < sheetBody.length) {
            if (sheetBody[index] == '{') {
                curDepth++
                if (index > 0 && sheetBody[index - 1] == '!') {
                    typeStack.push("pure");
                    [sheetBody, index] = replaceBracket(true, sheetBody, UnderlineTagName["pure"], index - 1, 2)
                }
                else {
                    typeStack.push("normal");
                    [sheetBody, index] = replaceBracket(true, sheetBody, UnderlineTagName["normal"], index, 1)
                }
            }
            else if (sheetBody[index] == '}') {
                if (typeStack.length == 0) {
                    console.error(`解析曲谱：不应出现}，位于${curLine}行:${curPos}列`)
                    return null
                }
                let type = typeStack.pop()
                if (type == "pure" || type == "normal") {
                    [sheetBody, index] = replaceBracket(false, sheetBody, UnderlineTagName[type], index, 1)
                }
                else {
                    console.error("解析曲谱：未知类型错误")
                    return null
                }
                curDepth--
            }
            else if (sheetBody[index] == "\n") {
                curLine++
                curPos = 0
            }
            curPos++
            index++
        }
        if (curDepth >= 0) {
            console.error("解析曲谱：下划线{}没有成对")
            return null
        }
        sheetBody = sheetBody.replace(/\!\{([^\}]*)\}/g, "<underline_pure>$1</underline_pure>")
        sheetBody = sheetBody.replace(/\{([^\}]*)\}/g, "<underline>$1</underline>")
        sheetBody = sheetBody.replace(/\!\(([^\)]*)\)/g, "<info>$1</info>") // !(xxx)
        sheetBody = sheetBody.replace(/\!\[([^\]]*)\]/g, "<chord_pure>$1</chord_pure>") // ![xxx]
        sheetBody = sheetBody.replace(/\[([^\]]*)\]\(\_\)/g, "<chord><placeholder /><chord_name>$1</chord_name></chord>") // [xxx](_)
        sheetBody = sheetBody.replace(/\[([^\]]*)\]\_/g, "<chord><placeholder /><chord_name>$1</chord_name></chord>") // [xxx]_
        sheetBody = sheetBody.replace(/\[([^\]]*)\]\(([^\)]*)\)/g, "<chord>$2<chord_name>$1</chord_name></chord>") // [xxx](yyy)
        sheetBody = sheetBody.replace(/\[([^\]]*)\](.)/g, "<chord>$2<chord_name>$1</chord_name></chord>") // [xxx]y
        sheetBody = sheetBody.replace(/(\r\n)|(\n)/g, "<newline></newline>") // newline

        // 生成元素
        let $sheet = $($.parseHTML(sheetBody))

        // 替换插件
        for(let i = 0; i < $sheet.length; ++i) {
            if ($sheet[i].tagName == 'SHEET-PLUGIN') {
                let index = parseInt($($sheet[i]).attr("index"))
                if (isNaN(index)) throw "解析遇到未知错误";
                $sheet[i] = pluginElements[index][0]
            }
        }

        this.$sheet = $sheet
    }
}

function _getLine(str, offset)  {
    let start = offset
    let end = offset
    while(end < str.length && str[end] != "\n")
        end++;
    return [str.substr(start, end), end + 1];
}

function _getPlugin(str, startIndex) {
    let pluginInfo = {}

    let i = startIndex
    if (str[i] != "*") throw "插件格式有误";
    ++i;
    if (str[i] != "[") throw "插件格式有误";
    ++i;

    let typeStartIndex = i
    while(true) {
        if (i >= str.length) throw "插件格式有误，未找到插件类型的结束符号]";
        else if (str[i] == "]") {
            pluginInfo.type = str.slice(typeStartIndex, i)
            ++i
            break
        }
        ++i
    }

    if (str[i] != "{") throw "插件格式有误";
    ++i;
    let contentStartIndex = i
    let depth = 0
    while(true) {
        if (i >= str.length) throw "插件格式有误，未找到插件内容的结束符号}或符号不匹配";

        if (str[i] == "{")
            ++depth
        else if (str[i] == "}") {
            if (depth == 0) {
                pluginInfo.content = str.slice(contentStartIndex, i)
                break
            }
            else 
                --depth
        }
        ++i;
    }

    let endIndex = i + 1
    pluginInfo.plugin = str.slice(startIndex, endIndex)

    return pluginInfo
}

export {DigitalSheet};