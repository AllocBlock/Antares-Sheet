import { getQueryVariable } from "@/utils/common";
import Request from "@/utils/request";
import { ProjectInfo } from "@/utils/project";

export enum ESheetSource {
    UNKNOWN,
    FILE,
    PROJECT
}

async function loadLocalSheets() : Promise<ProjectInfo[]> {
    let jsonInfos = await Request.get("global.json") as object[]
    // json to class
    let infos = []
    for (let jsonInfo of jsonInfos) {
        let info = new ProjectInfo(null, null)
        Object.assign(info, jsonInfo)
        infos.push(info)
    }
    return infos
}


// load sheet data by url, return source type, data and pid (if it's from project)
export async function loadSheetByUrlParam() : Promise<[ESheetSource, any, string]>{
    // load from file
    let sheetName = getQueryVariable("sheet");
    if (sheetName) {
        console.log("从文件加载曲谱...");
        return [ESheetSource.FILE, await Request.get(`sheets/${sheetName}.atrs`), null]
    }
    
    // load by pid
    const localSheets = await loadLocalSheets()
    let pid = getQueryVariable("pid");
    if (pid) {
        for (let projectInfo of localSheets) {
            if (projectInfo.pid == pid) {
                return [ESheetSource.PROJECT, projectInfo.sheetData, pid]
            }
        }
    }

    console.warn(`未找到pid为${pid}的项目`)
    return [ESheetSource.UNKNOWN, "", null]
}