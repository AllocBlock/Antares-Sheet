import { getCursorClientPos } from '@/utils/common.js';

export class MouseDelta {
    constructor() {
        this.lastPos = [0, 0]
    }

    start(mouseEvent) {
        this.lastPos = getCursorClientPos(mouseEvent)
    }

    tick(mouseEvent) {
        let curPos = getCursorClientPos(mouseEvent)
        let dx = curPos[0] - this.lastPos[0]
        let dy = curPos[1] - this.lastPos[1]
        this.lastPos = curPos
        return [dx, dy]
    }
}