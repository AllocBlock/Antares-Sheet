import { assert } from "@/utils/assert"

export default class Histroy<T> {
    historys : T[]
    index : number
    maxHistoryNum : number

    constructor(maxHistoryNum : number = Infinity, initHistory : T) {
        this.historys = []
        this.index = -1 // current version position
        this.maxHistoryNum = maxHistoryNum
        this.add(initHistory)
    }

    add(data : T) {
        let exceeded = this.historys.length == this.maxHistoryNum
        this.historys = this.historys.slice(exceeded ? 1 : 0, this.index + 1)
        this.historys.push(data)
        this.index = this.historys.length - 1
    }

    clear(initHistory : T) {
        this.index = -1
        this.add(initHistory)
    }

    hasPrev() : boolean {
        return this.index > 0
    }
    hasNext() : boolean {
        return this.index < this.historys.length - 1
    }
    goPrev() : T {
        assert(this.hasPrev(), "no more prev history")
        return this.historys[--this.index]
    }
    goNext() : T {
        assert(this.hasNext(), "no more next history")
        return this.historys[++this.index]
    }
    getCurrent() : T {
        return this.historys[this.index]
    }
}