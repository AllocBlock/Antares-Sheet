import Storage from "@/utils/storage.js";
import { generateRandomCode } from "@/utils/random.js"
import { assert } from "./assert";
import { parseSheet } from "./sheetParser";
import { SheetInfo, SheetMeta } from "./sheetInfo";

export class ProjectInfo {
    pid : string
    createTime : Date
    updateTime : Date

    title : string
    description : string
    tags : string[]
    sheetMeta : SheetMeta
    sheetData : string
    
    constructor(pid : string, title : string, description : string = "") {
        this.pid = pid
        this.createTime = new Date()
        this.updateTime = this.createTime
        this.title = title
        this.description = description
        this.tags = []
        this.sheetMeta = new SheetMeta()
        this.sheetData = ''
    }
}

const PROJECT_STORAGE_KEY = "project"

function loadProjectInfos() : ProjectInfo[] {
    return JSON.parse(Storage.load(PROJECT_STORAGE_KEY)) ?? []
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
    // TODO: update parameter passing
    update(pid : string, sheetInfo : SheetInfo, attachedChords : string[] = []) : void {
        assert(pid)
        let projectInfos = loadProjectInfos()
        for (let i in projectInfos) {
            if (projectInfos[i].pid == pid) {
                let projectInfo = projectInfos[i]
                projectInfo.updateTime = new Date()
                projectInfo.sheetMeta = sheetInfo.meta
                projectInfo.sheetData = sheetInfo.toText(attachedChords)
                saveProjectInfos(projectInfos)
                return
            }
        }
        console.warn(`未找到pid为${pid}的项目，更新项目失败`)
    }

}