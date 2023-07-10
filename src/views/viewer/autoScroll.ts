import { assert } from "@/utils/assert"
import { DeltaTimer } from "@/utils/timer"

const gScale = 0.01 // scale from delta time(ms) to scroll 

// TIPS: must not directly add delta to scroll, 
// as scroll is clamp to int, which cause accuracy problem
class AutoScroll {
    started = false
    speed = 0
    loopTimer: number = null
    accumulate = 0
    deltaTimer = new DeltaTimer()

    scroll(amount) {
        document.documentElement.scrollTop += amount
        document.body.scrollTop += amount // 兼容老版chrome
    }
    
    loopScroll() {
        let deltaTime = this.deltaTimer.tick()
        this.accumulate += (deltaTime * this.speed) * gScale

        let amount = Math.floor(this.accumulate)
        this.accumulate -= amount

        this.scroll(amount)
        this.loopTimer = window.requestAnimationFrame(this.loopScroll.bind(this))
    }

    start(speed) {
        assert(speed > 0, "scroll speed must > 0")
        if (this.started) {
            this.setSpeed(speed)
            return;
        }

        this.started = true;
        this.speed = speed;
        this.accumulate = 0
        this.deltaTimer.start()
        this.loopScroll()
    }

    getSpeed() { return this.speed }

    setSpeed(speed) {
        this.speed = speed
        if (this.started && this.speed == 0)
            this.stop()
        else if (!this.started && this.speed > 0)
            this.start(speed)
    }

    stop() {
        this.started = false
        this.speed = 0
        this.accumulate = 0
        window.cancelAnimationFrame(this.loopTimer)
        this.loopTimer = null
    }

}

export default new AutoScroll()