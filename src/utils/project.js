export class ProjectInfo {
    constructor(pid, title) {
        this.pid = pid
        this.title = title
        this.createTime = new Date()
        this.updateTime = this.createTime
        this.sheetText = ""
    }
}