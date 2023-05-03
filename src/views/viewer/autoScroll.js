import { assert } from "@/utils/assert"
import { DeltaTimer } from "@/utils/timer.js"
let gStarted = false
let gSpeed = 0
let gLoopTimer = null
let gAccumulate = 0

const gDeltaTimer = new DeltaTimer()
const gScale = 0.01 // scale from delta time(ms) to scroll 

// TIPS: must not directly add delta to scroll, 
// as scroll is clamp to int, which cause accuracy problem

function scroll(amount) {
    document.documentElement.scrollTop += amount
    document.body.scrollTop += amount // 兼容老版chrome，好像小程序也需要用body
}

function loopScroll() {
    let deltaTime = gDeltaTimer.tick()
    gAccumulate += (deltaTime * gSpeed) * gScale

    let amount = Math.floor(gAccumulate)
    gAccumulate -= amount
    console.log("scroll", amount)

    scroll(amount)
    gLoopTimer = window.requestAnimationFrame(loopScroll)
}

export default {
    start: function(speed) {
        assert(speed > 0, "scroll speed muse > 0")
        if (gStarted) {
            this.setSpeed(speed)
            return;
        }

        gStarted = true;
        gSpeed = speed;
        gAccumulate = 0
        gDeltaTimer.start()
        loopScroll()
    },
    getSpeed: () => gSpeed,
    setSpeed: function(speed) {
        if (gStarted) {
            if (speed == 0)
                this.stop()
            else
                gSpeed = speed
        }
        else
            this.start(speed)
    },
    stop: function() {
        gStarted = false
        gSpeed = 0
        gAccumulate = 0
        window.cancelAnimationFrame(gLoopTimer)
        gLoopTimer = null
    }
}