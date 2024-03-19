import { assert } from "@/utils/assert";
import { Chord } from "@/utils/chord";

function assertMatched(result) {
    if (!result) throw "解析失败";
}

function parseBool(value : string) {
    if (value.toLowerCase() == "true")
        return true
    else if(value.toLowerCase() == "false")
        return false
    else
        throw "not a bool"
}

abstract class IConfig {
    protected abstract _set(key, value : string) : boolean;
    
    set(key, value : string) {
        if (!this._set(key, value)) 
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

export class TabConfig extends IConfig {
    stringNum: number = null
    showBarNumber: boolean = false
    showStumFret: boolean = false

    protected _set(key, value : string) : boolean {
        switch(key) {
            case "stringNum": { this.stringNum = parseInt(value); return true; }
            case "showBarNumber": { this.showBarNumber = parseBool(value); return true; }
            case "showStumFret": { this.showStumFret = parseBool(value); return true; }
            default: return false;
        }
    }
}

export class BarConfig extends IConfig {
    timeSignature?: [number, number]
    repeat?: string
    showBarNumber?: boolean

    protected _set(key, value : string) : boolean {
        switch(key) {
            case "ts":
            case "timeSignature": { 
                let [num, divide] = value.split("/")
                this.timeSignature = [parseInt(num), parseInt(divide)]
                return true; 
            }
            case "repeat": { 
                assert(value == "start" || value == "end", "反复记号只能是start或者end")
                this.repeat = value;
                return true; 
            }
            case "showBarNumber": { this.showBarNumber = parseBool(value); return true; }
            default: return false;
        }
    }
}

enum EPlayDirection {
    Down,
    Up
}

function parsePlayDirection(str : string) {
    if (str == "d" || str == "down") {
        return EPlayDirection.Down
    } else if (str == "u" || str == "up") {
        return EPlayDirection.Up
    } else {
        throw "琶音只能是d、down、u或up"
    }
}

export class NoteConfig extends IConfig {
    chordGraph?: Chord
    arpeggio?: EPlayDirection // 琶音
    strum?: EPlayDirection // 扫弦
    showStumFret?: boolean // 琶音或扫弦时，是否显示指法

    protected _set(key, value : string) : boolean {
        switch(key) {
            case "chordGraph": {
                this.chordGraph = Chord.createFromString(value)
                return true; 
            }
            case "a":
            case "arpeggio": { 
                this.arpeggio = parsePlayDirection(value)
                return true; 
            }
            case "s":
            case "strum": { 
                this.strum = parsePlayDirection(value)
                return true; 
            }
            case "showStumFret": { this.showStumFret = parseBool(value); return true; }
            default: return false;
        }
    }
}

export class TabConnectNote {
    type: string
    notes: TabSingleNote[]

    constructor() {
        this.type = "connect"
        this.notes = []
    }
}

export class TabSingleNote {
    config: NoteConfig
    type: string
    frets: string[]
    duration: number
    hasDot: boolean

    constructor() {
        this.config = new NoteConfig()
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

export class TabBar {
    config: BarConfig
    notes: (TabSingleNote|TabConnectNote)[]
    number?: number

    constructor() {
        this.config = new BarConfig()
        this.notes = []
    }

    setProperty(key, value) {
        this[key] = value
    }

    appendNote(note) {
        this.notes.push(note)
    }
}

const ReSetting = /^\[([^\]]+):([^\]]+)\]$/
const RePropertyG = /\[([^\]]+):([^\]]+)\]/g
const ReNote = /^\(([^)]+?)\)((?:\[[^\]]+:[^\]]+\])*)(\d+)(\.?)$/
const ReNoteG = /\(([^)]+?)\)((?:\[[^\]]+:[^\]]+\])*)(\d+)(\.?)/g

export class Tab {
    config: TabConfig
    bars: TabBar[]
    
    constructor() {
        this.config = new TabConfig()
        this.bars = []
    }
}

export function parseTab(strTab : string) : Tab {
    let tab = new Tab()
    let res = strTab.match(/^\s*\$([^]*?)\$([^]*)$/) // $ ... $ ...
    assertMatched(res);
    let strConfig = res[1]
    let strBars = res[2]

    tab.config = parseConfig(strConfig)
    tab.bars = parseTabContent(strBars)
    return tab
}

function parseConfig(strConfig : string) : TabConfig {
    let config = new TabConfig()
    if (!strConfig) return config

    let strSettings = strConfig.match(/\[.*\]/g) ?? []
    for(let strSetting of strSettings) {
        let [key, value] = parseSetting(strSetting)
        config.set(key, value)
    }

    return config
}

function parseTabContent(strTabContent : string) : TabBar[] {
    let bars : TabBar[] = []
    
    strTabContent = strTabContent.replace(/\s+/, " ").trim() // 合并空白并移除首位空白
    let strBars = strTabContent.split("|") // 分割小节

    for(let strBar of strBars) {
        if (strBar.length == 0) continue;
        let bar = parseBar(strBar)
        bars.push(bar)
    }

    return bars;
}

function parseBar(strBar : string) : TabBar {
    let bar = new TabBar()
    let strBarUnits = strBar.match(/(\[.*?\]|\{.*?\}|\(.*?\)(?:\[.*?\])*\d+\.?)/g) // 分割出配置、连接拍和独立拍
    assertMatched(strBarUnits);

    for(let strBarUnit of strBarUnits) {
        if (!strBarUnit) continue;

        if (strBarUnit.match(ReSetting)) { // 配置项
            let [key, value] = parseSetting(strBarUnit)
            bar.config.set(key, value)
        }
        else { // 连接拍，独立拍
            if (strBarUnit.match(/^\{.*?\}$/)) { // 连接拍
                let res = strBarUnit.match(/^\{([^]*?)\}$/)
                let strNotes = res[1].match(ReNoteG)
                assertMatched(strNotes);
                let connectNote = new TabConnectNote()
                for(let strNote of strNotes) {
                    let note = parseSingleNote(strNote)
                    connectNote.notes.push(note)
                }
                bar.notes.push(connectNote)
            }
            else if (strBarUnit.match(ReNote)) { // 独立拍
                let note = parseSingleNote(strBarUnit)
                bar.notes.push(note)
            }
            else
                throw "指法谱解析失败"
        }
    }
    return bar
}

function parseSingleNote(strNote : string) {
    let res = strNote.match(ReNote)
    assertMatched(res);

    let frets = res[1].split("")
    assertMatched(frets)
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

    let note = new TabSingleNote
    note.frets = frets
    note.duration = duration
    note.hasDot = hasDot
    for (let strNoteProperty of strNoteProperties) {
        let [key, value] = parseSetting(strNoteProperty)
        note.config.set(key, value)
    }

    return note
}

function parseSetting(strProp) : [string, string] {
    let res = strProp.match(ReSetting)
    assertMatched(res);
    let key = res[1]
    let value = res[2]
    return [key, value]
}