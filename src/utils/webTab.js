/*
![hideFretForStroke:true] 全局默认隐藏扫弦旁边的数字
|区分小节
[ts:4/4] 拍号
[repeat:begin] [repeat:end] 反复符号
(nnnn)[key:value]m.，共有四个n，每个n对应了一根琴弦的品格（从1弦起？待定），n可以是数字，也可以是x（显示x），或是-表示不弹，m代表这是音符是几分音符，后跟一个点表示有附点。key-value用于标记一些属性，如[p:2]表示2弦到下一音符是勾弦，[h:1]1弦击弦，[to:3]3弦延音

[s:u] stroke up
[s:d] stroke down
[a:u] arpeggio up
[a:d] arpeggio down

{}括起来几个音符表示这几个音符符杆连接在一起
*/

// import { drawChord } from "./webChordRender.js"
import ChordManager from "./chordManager.js"

const g_chordManager = new ChordManager

const SvgLink = `<svg viewBox="0 0 100 14.68" preserveAspectRatio="none"><path d="M50,3.42C16.5,3.42,0,14.88,0,14.88S16.53,0,50,0s50,14.88,50,14.88S83.5,3.42,50,3.42Z"/></svg>`
const SvgStumArrow = `<svg class="note-stum-arrow" viewBox="0 0 100 115.19" preserveAspectRatio="none"><path d="M50,0,0,115.29s16.53-14.88,50-14.88,50,14.88,50,14.88Z"/></svg>`
const SvgArpeggioHead = `<svg class="note-stum-head" viewBox="0 0 100 52.66" preserveAspectRatio="none"><path d="M65.21,15.61C50.83-1.25,39.92-4.72,48.35,10.16,54.79,24.54,54.79,28,33.48,52.79H73C80.46,39.79,77.78,30.28,65.21,15.61Z"/></svg>`
const SvgArpeggioBody = `<svg class="note-stum-body" viewBox="0 0 100 127.92" preserveAspectRatio="none"><path d="M78.1,117c0-5.46-8.93-20.33-19.84-33.72C47.36,70.43,38.43,55.06,38.43,50.1c0-5.46,8.93-19.34,19.83-31.24C65,11.52,69.89,5.46,73,0H33.47C22.56,12.41,13.64,26.79,13.64,31.75c0,5.45,8.92,20.83,19.83,34.21C44.38,79.85,53.31,94.72,53.31,99.19c0,4-8.92,17.33-19.81,28.73H73C76,122.94,78.1,118.82,78.1,117Z"/></svg>`
const SvgArpeggioTail = `<svg class="note-stum-tail" viewBox="0 0 100 73.43" preserveAspectRatio="none"><path d="M73,0H33.47C10.17,25.3,8.68,36.71,26,57.53,38.93,72.41,48.35,76.87,48.35,68c0-2.48-2.48-6-5-7.44-9.92-5.95-5-19.34,14.87-40.66A112.26,112.26,0,0,0,73,0Z"/></svg>`

const SvgStrokeHead = `<svg class="note-stum-head" viewBox="0 0 100 52.66" preserveAspectRatio="none"><rect x="45.62" width="8.76" height="52.66"/></svg>`
const SvgStrokeBody = `<svg class="note-stum-body" viewBox="0 0 100 127.92" preserveAspectRatio="none"><rect x="45.62" width="8.76" height="127.92"/></svg>`
const SvgStrokeTail = `<svg class="note-stum-tail" viewBox="0 0 100 71.61" preserveAspectRatio="none"><rect x="45.62" y="62.77" width="8.76" height="8.76" rx="4.38" ry="4.38"/><rect x="45.62" width="8.76" height="67.15"/></svg>`
const SvgRepeat = `<svg class="repeat" viewBox="0 0 10 46.52" preserveAspectRatio="none"><rect y="-0.07" width="2.51" height="46.58"/><rect x="5" width="0.93" height="46.52"/><circle cx="8.24" cy="13.98" r="1.31"/><circle cx="8.24" cy="32.67" r="1.31"/></svg>`

class WebTabConfig {
    set(key, value) {
        this[key] = value
    }

    get(key) {
        return this[key]
    }

    getInt(key) {
        return parseInt(this[key])
    }

    getFloat(key) {
        return parseFloat(this[key])
    }
    
    getBool(key) {
        if (typeof(this[key]) == "undefined")
            return null
        else if (this[key] == "true")
            return true
        else if (this[key] == "false")
            return false
        else
            throw `设定项错误${key}`
    }

    getStr(key) {   
        if (this[key])
            return `${this[key]}`
        else
            return null
    }

    require(key) {
        if (this[key] != undefined)
            return this[key]
        else 
            throw `指法谱：未找到配置[${key}]`
    }

    requireInt(key) {
        let number = parseInt(this[key])
        if (!isNaN(number))
            return number
        else 
            throw `指法谱：未找到配置或配置有误[${key}]`
    }

    requireFloat(key) {
        let float = parseFloat(this[key])
        if (float)
            return float
        else 
            throw `指法谱：未找到配置或配置有误[${key}]`
    }

    requireBool(key) {
        if (this[key] != undefined)
            return this[key] == "true"
        else 
            throw `指法谱：未找到配置或配置有误[${key}]`
    }

    requireStr(key) {
        if (this[key] != undefined)
            return `${this[key]}`
        else 
            throw `指法谱：未找到配置或配置有误[${key}]`
    }
}

class WebTabConnectNote {
    constructor() {
        this.type = "connect"
        this.notes = []
    }
}

class WebTabSingleNote {
    constructor() {
        this.config = new WebTabConfig
        this.type = "single"
        this.frets = null
        this.duration = null
        this.hasDot = null
    }

    getStemType() {
        switch(this.duration) {
            case 1: return "none";
            case 2: return "half";
            case 4: return "complete";
            default: return "complete";
        }
    }

    getFlagNum() {
        if (!this.duration) return 0;
        else if (this.duration < 4) return 0;
        else return Math.floor(Math.log(this.duration / 4) / Math.log(2));
    }
}

class WebTabBar {
    constructor() {
        this.config = new WebTabConfig
        this.notes = []
    }
    setProperty(key, value) {
        this[key] = value
    }

    appendNote(note) {
        this.notes.push(note)
    }
}

const ReProperty = /^\[([^\]]+):([^\]]+)\]$/
const RePropertyG = /\[([^\]]+):([^\]]+)\]/g
const ReNote = /^\(([^)]+?)\)((?:\[[^\]]+:[^\]]+\])*)(\d+)(\.?)$/
const ReNoteG = /\(([^)]+?)\)((?:\[[^\]]+:[^\]]+\])*)(\d+)(\.?)/g

class WebTab {
    constructor() {
        this.config = new WebTabConfig
        this.bars = []
    }
}

let globalParseParam = {}

export function parseTab(strTab) {
    globalParseParam = {}

    let tab = new WebTab
    let res = strTab.match(/^\s*\$([^]*?)\$([^]*)$/)
    _check(res);
    let strConfig = res[1]
    let strBars = res[2]

    tab.config = _parseConfig(strConfig)
    tab.bars = _parseBars(strBars)
    return tab
}

function _parseConfig(strConfig) {
    let config = new WebTabConfig
    if (!strConfig) return config

    let strProps = strConfig.match(/\[.*\]/g)
    _check(strProps);
    
    for(let strProp of strProps) {
        let [key, value] = _parseProperty(strProp)
        config.set(key, value)
    }

    return config
}

function _parseBars(strBars) {
    let bars = []
    
    strBars = strBars.replace(/\s+/, " ").trim() // 合并空白并移除首位空白
    strBars = strBars.split("|") // 分割小节

    for(let strBar of strBars) {
        if (strBar.length == 0) continue;
        let bar = _parseBar(strBar)
        bars.push(bar)
    }

    return bars;
}

function _parseBar(strBar) {
    let bar = new WebTabBar
    let strBarUnits = strBar.match(/(\[.*?\]|\{.*?\}|\(.*?\)(?:\[.*?\])*\d+\.?)/g) // 分割出配置、连接小节和独立小节
    _check(strBarUnits);

    for(let strBarUnit of strBarUnits) {
        if (!strBarUnit) continue;

        if (strBarUnit.match(ReProperty)) { // 配置项
            let [key, value] = _parseProperty(strBarUnit)
            bar.config.set(key, value)
        }
        else { // 连接小节，独立小节
            if (strBarUnit.match(/^\{.*?\}$/)) { // 连接小节
                let res = strBarUnit.match(/^\{([^]*?)\}$/)
                let strNotes = res[1].match(ReNoteG)
                _check(strNotes);
                let connectNote = new WebTabConnectNote
                for(let strNote of strNotes) {
                    let note = _parseSingleNote(strNote)
                    connectNote.notes.push(note)
                }
                bar.notes.push(connectNote)
            }
            else if (strBarUnit.match(ReNote)) { // 独立小节
                let note = _parseSingleNote(strBarUnit)
                bar.notes.push(note)
            }
            else
                throw "解析失败"
        }
    }
    return bar
}

function _parseSingleNote(strNote) {
    let res = strNote.match(ReNote)
    _check(res);

    let frets = res[1].split("")
    _check(frets)
    // 格式化
    frets = frets.map(fret=>{
        if (fret == "x" || fret == "X") // 叉号换成unicode叉
            return "×"
        else 
            return fret
    })

    let strNoteProperties = res[2] ? res[2].match(RePropertyG) : []
    let duration = parseInt(res[3])
    if (isNaN(duration))
        throw "指法谱：音符时值错误"
    let hasDot = (res[4] ? true : false) // 还未支持
    if (hasDot)
        throw "指法谱：暂不支持附点"

    let note = new WebTabSingleNote
    note.frets = frets
    note.duration = duration
    note.hasDot = hasDot
    for (let strNoteProperty of strNoteProperties) {
        let [key, value] = _parseProperty(strNoteProperty)
        note.config.set(key, value)
    }

    return note
}

function _parseProperty(strProp) {
    let res = strProp.match(ReProperty)
    _check(res);
    let key = res[1]
    let value = res[2]
    return [key, value]
}

let g_ParseTempParam = {}

function _createTabHTML(tab) {
    g_ParseTempParam = {}

    const TabHeight = 60
    let TabMargin = 30 // 如果出现和弦图，则需要增大额外的margin

    // 曲谱检查，设置支持的参数
    const StringNum = tab.config.requireInt("stringNum")
    g_ParseTempParam.stringNum = StringNum
    g_ParseTempParam.showBarNumber = (tab.config.getBool("showBarNumber") == true)
    g_ParseTempParam.showStumFret = (tab.config.getBool("showStumFret") == true)

    // 创建主元素
    let $tab = $("<tab-box>")
    $tab.attr("string-num", StringNum)

    // 创建第一行
    let $row = _createDefaultRowHTML(StringNum)
    $tab.append($row)

    // 创建小节
    g_ParseTempParam.barNumber = 1
    for(let bar of tab.bars) {
        let showBarNumber = g_ParseTempParam.showBarNumber && (bar.config.getBool("showBarNumber") !== false)
        let $bar = _createBarHTML(bar, g_ParseTempParam.barNumber != 1, showBarNumber)
        $row.children("row-split[type=end]").before($bar)
        g_ParseTempParam.barNumber++
    }

    if (g_ParseTempParam.useChordName)
        TabMargin = Math.max(TabMargin, 60)
    if (g_ParseTempParam.useChordGraph)
        TabMargin = Math.max(TabMargin, 110)
    
    $tab.css({
        "--string-num": StringNum,
        "--row-height": `${TabHeight}px`,
        "--row-margin-top": `${TabMargin}px`
    })

    return $tab;
}

function _createDefaultRowHTML(stringNum) {
    let $row = $("<row>")

    // 创建背景线
    let $bgLines = $("<bg-lines>")
    for(let i = 0; i < stringNum; ++i)
        $bgLines.append($("<bg-line>"))
    $row.append($bgLines)

    // 起始线和TAB符号
    let $rowStartSplit = $("<row-split type='start'></row-split>")
    let $tabSymbol = $("<tab-symbol><div>T</div><div>A</div><div>B</div></tab-symbol>")
    let $rowEndSplit = $("<row-split type='end'></row-split>")
    $row.append($rowStartSplit)
    $row.append($tabSymbol)
    $row.append($rowEndSplit)

    return $row
}

function _createBarHTML(bar, useSplitLine, showBarNumber) {
    let $bar = $("<bar>")
    if (showBarNumber) {
        $bar.append($(`<bar-number>${g_ParseTempParam.barNumber}</bar-number>`))
    }

    // 分割线
    if (useSplitLine && !g_ParseTempParam.lastBarHasEndRepeat) {
        $bar.append($("<bar-split>"))
    }

    // 检查配置项
    let timeSignature = bar.config.getStr("ts")
    let repeat = bar.config.getStr("repeat")
    let repeatStart = (repeat == "start")
    let repeatEnd = (repeat == "end")

    // 拍号
    if (timeSignature) {
        let reTimeSignature = /(\d+)\/(\d+)/
        let res = timeSignature.match(reTimeSignature)
        if (!res)
            throw `指法谱：拍号配置项有误[ts:${timeSignature}]`
        let tapPerBar = res[1]
        let notePerTap = res[2]
        let $timeSignature = _createTimeSignatureHTML(tapPerBar, notePerTap)
        $bar.append($timeSignature)
    }

    // 重复起始
    if (repeatStart) {
        let $repeatStart = _createRepeatMarkHTML("start")
        $bar.append($repeatStart)
    }

    // 音符
    for(let note of bar.notes) {
        let notes = _createNoteHTML(note)
        for(let $note of notes)
            $bar.append($note)
    }

    // 重复结束
    if (repeatEnd) {
        g_ParseTempParam.lastBarHasEndRepeat = true
        let $repeatEnd = _createRepeatMarkHTML("end")
        $bar.append($repeatEnd)
    }

    return $bar
}

function _createTimeSignatureHTML(tapPerBar, notePerTap) {
    return $(`<time-signature><div>${tapPerBar}</div><div>${notePerTap}</div></time-signature>`)
}

function _createRepeatMarkHTML(type) {
    if (type != "start" && type != "end")
        throw "重复符号类型有误"
    return $(`<repeat type=${type}>${SvgRepeat}</repeat>`)
}

function _createNoteHTML(note) {
    let notes = []
    if (note.type == "single") {
        let $note = _createNoteHTMLHelper(note, false)
        notes.push($note)
    }
    else if (note.type == "connect") {
        for(let i = 0; i < note.notes.length; ++i) {
            let lastFlagNum = (i == 0 ? null : note.notes[i-1].getFlagNum())
            let nextFlagNum = (i == note.notes.length - 1 ? null : note.notes[i+1].getFlagNum())
                    
            let $note = _createNoteHTMLHelper(note.notes[i], true, lastFlagNum, nextFlagNum)

            notes.push($note)
        }
    }
    else
        throw "类型错误"

    return notes
}

function _createNoteHTMLHelper(note, isConnect, lastFlagNum, nextFlagNum) {
    let stemType = note.getStemType()
    let hasMiddleStem = (stemType == "complete")
    let showFret = true

    let $note = $("<note>") 

    // 配置项元素
    for(let key in note.config) {
        let $noteConfigElement = _createNoteConfigElementHTML(key, note.config[key])
        if ($noteConfigElement)
            $note.append($noteConfigElement)
    }

    // 音符主要部分
    if (note.config.a || note.config.s) { // 扫弦，琶音
        if (g_ParseTempParam.showStumFret && (note.config.getBool("showStumFret") !== false))
            showFret = true
        else
            showFret = false

        let SvgHead, SvgBody, SvgTail
        let stumDirection

        if (note.config.a && note.config.s)
            throw "指法谱：不能同时设置扫弦和琶音"
        else if (note.config.a) {
            SvgHead = SvgArpeggioHead
            SvgBody = SvgArpeggioBody
            SvgTail = SvgArpeggioTail
            switch(note.config.a) {
                case "u": stumDirection = "up"; break;
                case "d": stumDirection = "down"; break;
            }
        }
        else {
            SvgHead = SvgStrokeHead
            SvgBody = SvgStrokeBody
            SvgTail = SvgStrokeTail
            switch(note.config.s) {
                case "u": stumDirection = "up"; break;
                case "d": stumDirection = "down"; break;
            }
        }

        let stumRanges = []
        let stumStartIndex = -1
        for(let i = 0; i < note.frets.length; ++i) {
            if (note.frets[i] != "-" && i < note.frets.length - 1) {
                if (stumStartIndex < 0) {
                    stumStartIndex = i
                }
            }
            else {
                if (stumStartIndex >= 0) {
                    let stumEndIndex = (note.frets[i] != "-" ? i : i - 1)
                    stumRanges.push({
                        start: stumStartIndex,
                        end: stumEndIndex
                    })
                }
            }
        }

        for(let range of stumRanges) {
            let stumBodyNum = range.end - range.start

            let $noteStum = $(`<note-stum direction="${stumDirection}"></note-stum>`)
            $noteStum.css({
                top: `${range.start / (g_ParseTempParam.stringNum - 1) * 100}%`,
                height: `${stumBodyNum / (g_ParseTempParam.stringNum - 1) * 100}%`
            })
            $noteStum.append($(SvgStumArrow))
            $noteStum.append($(SvgHead))
            for(let i = 0; i < stumBodyNum; ++i)
                $noteStum.append($(SvgBody))
            $noteStum.append($(SvgTail))

            if (showFret)
                $noteStum.css("transform", "translate(-100%)")

            $note.append($noteStum)
        }
    }

    if (showFret) {
        let emptyState = true // 遇到第一音符之前无需音符线
        for(let i = 0; i < note.frets.length; ++i) {
            let fret = note.frets[i]
            let $noteElement = $("<note-element>")
            if (fret == "-") {
                if (emptyState || !hasMiddleStem) 
                    $noteElement.append($("<note-fret-empty>"))
                else 
                    $noteElement.append($(`<note-fret-stem type="${i == note.frets.length - 1 ? "end" : "normal"}">`))
            }
            else {
                emptyState = false;
                $noteElement.append($(`<note-fret>${fret}</note-fret>`))
            }
            $note.append($noteElement)
        }
    }
    else {
        if (hasMiddleStem) {
            let lastNonEmptyString = -1
            for(let i = 0; i < note.frets.length; ++i) {
                if (note.frets[i] != "-")
                    lastNonEmptyString = i
            }

            for(let i = 0; i < note.frets.length; ++i) {
                if (i <= lastNonEmptyString)
                    $note.append($("<note-fret-empty>"))
                else
                    $note.append($(`<note-fret-stem type="${i == note.frets.length - 1 ? 'end' : 'normal'}">`))
            }
        }
    }

    // 小节线
    $note.append(`<note-stem type="${stemType}"></note-stem>`)

    // flag
    let $flag = $("<note-flag>")
    let flagNum = note.getFlagNum()
    
    if (flagNum){
        if (isConnect) {
            let flagTypes = []
            
            if (!lastFlagNum) { // 第一个
                for(let i = 0; i < flagNum; ++i)
                    flagTypes[i] = "right"
            }
            else if (!nextFlagNum) { // 最后一个
                for(let i = 0; i < flagNum; ++i)
                    flagTypes[i] = "left"
            }
            else { // 中间
                // 如果和上一个flag相同，则向左连接，右侧顺应下一个音符
                // 如果不同，依旧向左连接，右侧使用自己的flag数
                let isEqualToLast = (lastFlagNum == flagNum)
                for(let i = 0; i < Math.max(flagNum, lastFlagNum, nextFlagNum); ++i) {
                    if (isEqualToLast) {
                        if (i < lastFlagNum && i < nextFlagNum)
                            flagTypes[i] = "both"
                        else if (i < lastFlagNum)
                            flagTypes[i] = "left"
                        else if (i < nextFlagNum)
                            flagTypes[i] = "right"
                    }
                    else {
                        if (i < lastFlagNum && i < flagNum)
                            flagTypes[i] = "both"
                        else if (i < lastFlagNum)
                            flagTypes[i] = "left"
                        else if (i < flagNum)
                            flagTypes[i] = "right"
                    }
                }
            }
            for(let flagType of flagTypes)
                $flag.append(`<note-flag-connect type="${flagType}"></note-flag-connect>`)
        }
        else {
            // TODO
        }
    }
    $note.append($flag)

    return $note
}

function _createNoteConfigElementHTML(key, value) {
    switch(key) {
        case "link": // 连音
        case "hammer":  // 击弦
        case "pick": { // 勾弦
            let $link = $("<note-link>")
            $link.css("top", `${(parseInt(value) - 1) / g_ParseTempParam.stringNum * 100}%`)
            $link.append($(SvgLink))
            if (key != "link") {
                let markText = ""
                switch(key){
                    case "hammer": markText = "H"; break;
                    case "pick": markText = "P"; break;
                }
                let $mark = $(`<note-link-text>${markText}</note-link-text>`)
                $link.append($mark)
            }
            return $link
        }
        case "chordName":  // 和弦名
        case "chordGraph": { // 和弦图
            let $chord = $("<note-chord>")
            switch(key) {
                case "chordName": {
                    let $chordName = $(`<note-chord-name>${value}</note-chord-name>`)
                    $chord.append($chordName)
                    g_ParseTempParam.useChordName = true
                    break;
                }
                case "chordGraph": {
                    let $chordGraph = $("<note-chord-graph>")
                    // TODO
                    // drawChord($chordGraph, g_chordManager.getChord(value))
                    $chord.append($chordGraph)
                    g_ParseTempParam.useChordGraph = true
                    break;
                }
            }
            return $chord
        }
        case "a": // 琶音
        case "s": // 扫弦
        case "showStumFret": { // 是否显示品格
            return null
        }
        default: {
            throw `指法谱：不支持的音符配置项[${key}:${value}]`
        }
    }
}

function _check(value) {
    if (!value) throw "解析失败";
}

$(window).resize(()=>{
    let $tabs = $("tab-box")
    $tabs.trigger("fit")
})

function _tabFit($tab) {
    const MinBarWidth = 300;
    const MaxBarWidth = 500;
    if ($tab.width() == 0 || $tab.height() == 0) return;
    else if ($tab.width() < MinBarWidth) return; // 本身就小于，无需调整了

    const StringNum = parseInt($tab.attr("string-num"))
    if (isNaN(StringNum))
        throw "曲谱元素有误，不包含琴弦数量信息"

    let $tempContainer = $("<div>")
    let $bars = $tab.find("bar")
    $tempContainer.append($bars)

    $tab.find("row").remove()

    let $curRow = _createDefaultRowHTML(StringNum)
    let rowFirstElement = true
    $tab.append($curRow)
    $bars.each((i, e)=>{
        let $rowBars = $curRow.find("bar")
        let barWidth = $rowBars.length == 0 ? Infinity : $($rowBars[0]).width()
        if (barWidth < MaxBarWidth) { // 达到限制，换行
            $curRow = _createDefaultRowHTML(StringNum)
            $tab.append($curRow)
            rowFirstElement = true
        }

        let $bar = $(e)
        let $barStartSplit = $bar.children("bar-split")
        if (rowFirstElement) {
            $bar.children("bar-split").remove()
            rowFirstElement = false
        }
        else {
            if ($barStartSplit.length == 0)
                $bar.prepend(`<bar-split>`)
        }
        $curRow.children("row-split[type=end]").before($bar)
    })

    // 检查行内元素以确认间距
    let $rows = $tab.find("row")
    $rows.each((i, e)=>{
        let $row = $(e)
        let TabMargin = 30
        if ($row.find("note-chord-name").length > 0) {
            TabMargin = 70
        }
        if ($row.find("note-chord-graph").length > 0) {
            TabMargin = 120
        }
        $row.css({
            "--row-margin-top": `${TabMargin}px`
        })
    })

    // 如果行内最后一个小节有结束重复符，则行尾的分隔符需要去掉
    $rows.each((i, e)=>{
        let $row = $(e)
        let $bar = $row.children("bar:last")
        if ($bar.find("repeat[type=end]").length > 0) {
            $row.children("row-split[type=end]").remove()
        }
    })

    // 适配和弦
    let $chordGraphs = $tab.find(".chord-block")
    $chordGraphs.trigger("fit")
}

export default WebTab