import { getQueryVariable } from "@/utils/common";
import Request from "@/utils/request";
import { gProjectManager } from "@/utils/project";

export enum ESheetSource {
    UNKNOWN,
    FILE,
    PROJECT
}

// load sheet data by url, return source type, data and pid (if it's from project)
export async function loadSheetFromUrlParam() : Promise<[ESheetSource, string, string]>{
    // load from file
    let sheetName = getQueryVariable("sheet");
    if (sheetName) {
        console.log("从文件加载曲谱...");
        return [ESheetSource.FILE, await Request.get(`sheets/${sheetName}.atrs`), null]
    }
    
    // load by pid
    let pid = getQueryVariable("pid");
    if (pid) {
        let projectInfo = gProjectManager.get(pid)
        if (projectInfo) {
            return [ESheetSource.PROJECT, projectInfo.sheetData, pid]
        }
        else {
            console.warn(`未找到pid为${pid}的项目`)
        }
    }

    // load default
    return [ESheetSource.UNKNOWN, "", null]
}