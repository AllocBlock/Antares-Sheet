export class DeltaTimer {
    lastTime: number

    constructor() {
        this.start()
    }

    start() {
        this.lastTime = new Date().getTime()
    }

    tick(): number {
        let curTime = new Date().getTime()
        let deltaMs = curTime - this.lastTime
        this.lastTime = curTime
        return deltaMs
    }
}


export abstract class Ticker {
    callback: CallableFunction
    timer: number

    constructor(callback: CallableFunction) {
        this.callback = callback
        this.timer = null
    }

    abstract start();
    abstract stop();
}

export class IntervalTicker extends Ticker {
    intervalMs: number

    constructor(callback: CallableFunction, intervalMs = 1000 / 60) {
        super(callback)
        this.intervalMs = intervalMs
    }

    start() {
        this.stop()
        this.timer = setInterval(() => this.callback(), this.intervalMs)
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer)
            this.timer = null
        }
    }
}

export class AnimationFrameTicker extends Ticker {
    tick() {
        this.callback()
        this.timer = window.requestAnimationFrame(() => this.tick())
    }

    start() {
        this.stop()
        this.tick()
    }

    stop() {
        if (this.timer) {
            window.cancelAnimationFrame(this.timer)
            this.timer = null
        }
    }
}

export class DelayTrigger {
    isWaiting: boolean
    lastTriggerTime: number
    minIntervalMs: number
    ticker: AnimationFrameTicker
    callback: CallableFunction

    constructor(callback: CallableFunction, minIntervalMs: number) {
        this.isWaiting = false
        this.minIntervalMs = minIntervalMs
        this.callback = callback
        this.lastTriggerTime = 0
        this.ticker = new AnimationFrameTicker(() => this.tick())
    }

    tick() {
        let curTime = new Date().getTime()
        if (this.isWaiting && curTime > this.lastTriggerTime + this.minIntervalMs) {
            this.callback()
            this.isWaiting = false
            this.lastTriggerTime = curTime
            this.ticker.stop()
        }
    }

    trigger() {
        if (!this.isWaiting) {
            this.ticker.start()
        }
        this.isWaiting = true
    }
}
