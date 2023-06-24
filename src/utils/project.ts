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
你可以双击来编辑文字
在左侧的和弦工具栏里添加和弦，然后拖拽到文字上来添加和弦：[C]一  [G]二  [Am]三  [Em]四
右键菜单里可以进行更多操作，比如添加下划线：{[F]五 [C]六} {[F]七 [G]八}
点击和弦可以播放和弦
还能添加标记：!(前奏) !(间奏) !(尾奏)

还有更多快捷操作，比如：
· Shift+鼠标左键：移动和弦
· Ctrl+鼠标左键：移动和弦
· Alt+鼠标左键（左右拖拽）：左右微调偏移和弦
· 在和弦上双击：添加下划线
· Tab/Shift+Tab：添加空格
· Enter/Shift+Enter：添加换行
· Delete：删除
· z键：切换“标注和弦”和“纯和弦”

!(音乐播放器)
界面左下角有“音乐播放器”按钮，点击可以打开音乐播放器
播放器可以加载音频并播放，并且能够调节「音调」、「播放速度」等
此外播放器提供了「标记」和「跳转」的功能，打上标记，然后快速跳转，方便扒谱
播放器也提供了快捷键：

· w：添加标记
· q：跳转到上一个标记
· e：跳转到下一个标记

!(钢琴键盘)
钢琴键盘可以用来验证和弦是否正确
键盘设置了快捷键，仿照了真实钢琴键盘的排布：
· z键为C、s为#C/bD、x键为D、d为#D/bE、c键为E……以此类推
`

export class ProjectInfo {
    pid : string
    createTime : Date
    updateTime : Date

    description : string
    tags : string[]
    sheetMeta : SheetMeta
    sheetData : string
    
    constructor(pid : string, title : string, description : string = "") {
        this.pid = pid
        this.createTime = new Date()
        this.updateTime = this.createTime
        this.description = description
        this.tags = []
        this.sheetMeta = new SheetMeta()
        this.sheetMeta.title = title
        let data = NEW_PROJECT_TEMPLATE
        if (title) {
            data = data.replace("*SHEET_TITLE*", title)
        }
        
        this.sheetData = data
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

export const Project = {
    create(title : string = "未命名项目", description : string = "") : string {
        let projectInfos = loadProjectInfos()
        // generate project id
        let existedPids = projectInfos.map(info => info.pid)
        let pid = generateRandomCode(8)
        do {
            if (existedPids.includes(pid)) {
                pid = generateRandomCode(8);
            }
            else break;
        } while (true);

        // add new project
        let projectInfo = new ProjectInfo(pid, title, description)
        projectInfos.push(projectInfo)

        // save changes to storage
        saveProjectInfos(projectInfos)
        return pid
    },
    get(pid : string) : ProjectInfo {
        assert(pid)
        let projectInfos = loadProjectInfos()
        for (let info of projectInfos) {
            if (info.pid == pid) {
                return info
            }
        }
        return null
    },
    getAll() : ProjectInfo[] {
        return loadProjectInfos()
    },
    update(pid : string, sheetMeta : SheetMeta, sheetRoot : SheetNode, attachedChords : Chord[] = []) : void {
        assert(pid)
        let projectInfos = loadProjectInfos()
        for (let i in projectInfos) {
            if (projectInfos[i].pid == pid) {
                let projectInfo = projectInfos[i]
                projectInfo.updateTime = new Date()
                projectInfo.sheetMeta = sheetMeta
                projectInfo.sheetData = toSheetFileString(sheetRoot, sheetMeta, attachedChords)
                saveProjectInfos(projectInfos)
                return
            }
        }
        console.warn(`未找到pid为${pid}的项目，更新项目失败`)
    },
    remove(pid : string) {
        assert(pid)
        let projectInfos = loadProjectInfos()
        for (let i = 0; i < projectInfos.length; ++i) {
            if (projectInfos[i].pid == pid) {
                projectInfos.splice(i, 1)
                saveProjectInfos(projectInfos)
                return
            }
        }
    }

}