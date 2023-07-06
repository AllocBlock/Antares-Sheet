import Storage from "@/utils/storage.js";
import { generateRandomCode } from "@/utils/random.js"
import { assert } from "./assert";
import { parseSheet } from "./sheetParser";
import SheetMeta from "./sheetMeta";
import { SheetNode } from "./sheetNode";
import { toSheetFileString } from "./sheetWriter"
import { Chord } from "./chord";

const NEW_PROJECT_TEMPLATE = `$sheet "*SHEET_TITLE*"

!(欢迎使用星河曲谱！)
· 你可以双击来编辑文字
· 在左侧的和弦工具栏里添加和弦，然后拖拽到文字上来添加和弦：[C]一  [G]二  [Am]三  [Em]四
· 右键菜单里可以进行更多操作，比如添加下划线：{[F]五 [C]六} {[F]七 [G]八}
· 点击和弦可以播放和弦
· 还能添加标记：!(前奏) !(间奏) !(尾奏)

还有更多快捷操作，比如：
· !(Shift+鼠标左键)：移动和弦
· !(Ctrl+鼠标左键)：复制和弦
· !(Alt+鼠标左键)（左右拖拽）：左右微调偏移和弦
· 在和弦上!(双击)：添加下划线
· !(Tab)/!(Shift+Tab)：在前面/后面添加空格
· !(Enter)/!(Shift+Enter)：在前面/后面添加换行
· !(Delete)：删除
· !(Z)键：切换“标注和弦”和“纯和弦”
· !(U)键：添加下划线
· !(J)键：移除下划线
· !(Ctrl+Z)键：撤销
· !(Ctrl+Y)键：重做

!(音乐播放器)
· 界面左下角有“音乐播放器”按钮，点击可以打开音乐播放器
· 播放器可以加载音频并播放，并且能够调节「音调」、「播放速度」等
· 此外播放器提供了「标记」和「跳转」的功能，打上标记，然后快速跳转，方便扒谱

播放器也提供了快捷键：
· !(W)键：添加标记
· !(Q)键：跳转到上一个标记
· !(E)键：跳转到下一个标记

!(钢琴键盘)
钢琴键盘可以用来验证和弦是否正确
键盘设置了快捷键，仿照了真实钢琴键盘的排布：
· !(Z)键为!(C)音、!(S)键为!(#C)/!(bD)音、!(X)键为!(D)音、!(D)键为!(#D)/!(bE)音、!(C)键为!(E)音……以此类推
`

export class ProjectInfo {
    pid : string
    createTime : Date
    updateTime : Date

    sync : boolean
    isPublic : boolean
    sheetMeta : SheetMeta
    sheetData : string
    
    constructor(pid : string, title : string) {
        this.pid = pid
        this.createTime = new Date()
        this.updateTime = this.createTime
        this.sync = false
        this.isPublic = false
        this.sheetMeta = new SheetMeta()
        this.sheetMeta.title = title
        this.sheetData = NEW_PROJECT_TEMPLATE.replace("*SHEET_TITLE*", title ?? "") 
    }
}

const PROJECT_STORAGE_KEY = "project"

function loadProjectInfos() : ProjectInfo[] {
    let jsonInfos =  JSON.parse(Storage.load(PROJECT_STORAGE_KEY)) ?? []
    // json to class
    let infos = []
    for (let jsonInfo of jsonInfos) {
        let info = new ProjectInfo(null, null)
        Object.assign(info, jsonInfo)
        infos.push(info)
    }
    return infos
}

function saveProjectInfos(projectInfos : ProjectInfo[]) {
    Storage.save(PROJECT_STORAGE_KEY, JSON.stringify(projectInfos)) 
}

class ProjectManager {
    projectInfos : ProjectInfo[]

    constructor() {
        this.load()
    }

    save() { saveProjectInfos(this.projectInfos) }
    load() { this.projectInfos = loadProjectInfos() }
    
    has(pid : string) {
        for (let info of this.projectInfos) {
            if (info.pid == pid) {
                return true
            }
        }
        return false
    }

    add(projectInfo : ProjectInfo) {
        assert(!this.has(projectInfo.pid), "项目已存在，不可重复添加")
        this.projectInfos.push(projectInfo)
        this.save()
    }

    create(title : string = "未命名") : string {
        // generate project id
        let existedPids = this.projectInfos.map(info => info.pid)
        let pid = generateRandomCode(8)
        do {
            if (existedPids.includes(pid)) {
                pid = generateRandomCode(8);
            }
            else break;
        } while (true);

        // add new project
        let projectInfo = new ProjectInfo(pid, title)
        this.projectInfos.push(projectInfo)

        // save changes to storage
        this.save()
        return pid
    }

    get(pid : string) : ProjectInfo {
        assert(pid)
        for (let info of this.projectInfos) {
            if (info.pid == pid) {
                return info
            }
        }
        return null
    }
    
    getAll() : ProjectInfo[] {
        return this.projectInfos
    }

    set(pid : string, sheetMeta : SheetMeta, sheetData : string, sync : boolean, isPublic : boolean) {
        let projectInfo = this.get(pid)
        assert(projectInfo, "项目不存在")
        projectInfo.sheetMeta = sheetMeta
        projectInfo.sheetData = sheetData
        projectInfo.sync = sync
        projectInfo.isPublic = isPublic
        this.save()
    }

    update(pid : string, sheetMeta : SheetMeta, sheetData : string, sync : boolean, isPublic : boolean) : void {
        assert(pid)
        let info = this.get(pid)
        assert(info, `未找到pid为${pid}的项目，更新项目失败`)
        info.updateTime = new Date()
        this.set(pid, sheetMeta, sheetData, sync, isPublic)
    }

    remove(pid : string) {
        assert(pid)
        for (let i = 0; i < this.projectInfos.length; ++i) {
            if (this.projectInfos[i].pid == pid) {
                this.projectInfos.splice(i, 1)
                this.save()
                return
            }
        }
    }
}

export const gProjectManager = new ProjectManager()