export class WebTabConfig {
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

export class WebTabConnectNote {
    constructor() {
        this.type = "connect"
        this.notes = []
    }
}

export class WebTabSingleNote {
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

export class WebTabBar {
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

export class WebTab {
    constructor() {
        this.config = new WebTabConfig
        this.bars = []
    }
}

export function parseTab(strTab) {
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

function _check(value) {
    if (!value) throw "解析失败";
}