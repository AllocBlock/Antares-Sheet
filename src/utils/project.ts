import Storage from "@/utils/storage.js";
import { generateRandomCode } from "@/utils/random.js"
import { assert } from "./assert";

export class ProjectInfo {
    pid : string
    title : string
    createTime : Date
    updateTime : Date
    sheetData : string
    
    constructor(pid : string, title : string, sheetData : string = "") {
        this.pid = pid
        this.title = title
        this.createTime = new Date()
        this.updateTime = this.createTime
        this.sheetData = sheetData
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
    create(title : string = "未命名项目", sheetData : string = "") : string {
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
        let projectInfo = new ProjectInfo(pid, title, sheetData)
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
    update(pid : string, sheetData : string) : void {
        assert(pid)
        let projectInfos = loadProjectInfos()
        for (let i in projectInfos) {
            if (projectInfos[i].pid == pid) {
                projectInfos[i].updateTime = new Date()
                projectInfos[i].sheetData = sheetData
                saveProjectInfos(projectInfos)
                return
            }
        }
        console.warn(`未找到pid为${pid}的项目，更新项目失败`)
    }

}