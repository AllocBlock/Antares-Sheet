export class DeltaTimer {
    lastTime : number

    constructor() {
        this.lastTime = null
    }

    start() {
        this.lastTime = new Date().getTime()
    }

    // return delta millseconds
    tick() {
        let curTime = new Date().getTime()
        let delta = curTime - this.lastTime
        this.lastTime = curTime
        return delta
    }
}