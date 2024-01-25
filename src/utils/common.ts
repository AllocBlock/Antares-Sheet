import $ from "jquery"
import { Time } from "tone"

export function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export const ELoadState = {
  Loading: 0,
  Loaded: 1,
  Failed: 2,
  Empty: 3,
}

export interface LoadCallback {
    onLoadStart?: () => void
    onLoadProgress?: (number) => void
    onFailed?: (string) => void
    onLoaded?: () => void
}

export function getPos(element) {
  // *raw dom implementation
  // var rect = element.getBoundingClientRect();
  // return {
  //   top: (rect.top + (document.documentElement.scrollTop || document.body.scrollTop)) - window.pageYOffset,
  //   left: rect.left - window.pageXOffset,
  // };

  // *jq implementation
  return $(element).offset()
}

export function setPos(element, left, top) {
  // update pos by vue is too slow, so use jquery to update directly
  $(element).css({ left, top })
}

export function getRelativePos(element, pageX, pageY) {
  let $e = $(element)
	let left = pageX - $e.offset().left;
	let top = pageY - $e.offset().top;

  return {
    left, top
  }
}

// 从内到外是element, padding, border, margin
// getInnerSize获取element+padding
export function getInnerSize(element) {
  let $e = $(element)
	let w = $e.innerWidth()
	let h = $e.innerHeight()

  return {
    w, h
  }
}

// getOuterSize获取element+padding+border
export function getOuterSize(element) {
  let $e = $(element)
	let w = $e.outerWidth()
	let h = $e.outerHeight()

  return {
    w, h
  }
}

// 获取窗口大小（浏览器中可以看见页面部分的大小）
export function getWindowSize() {
  return { w: window.innerWidth, h: window.innerHeight }
}

export function getQueryVariable(key) {
  let query = window.location.search.substring(1)
  let vars = query.split("&")
  for (let pairStr of vars) {
    let pair = pairStr.split("=", 2)
    if (pair[0] == key)
      return decodeURI(pair[1])
  }
  return null
}

let g_Env = "pc"

export function getEnv() {
  return g_Env
}

export function setEnv(env) {
  return g_Env = env
}

export function getCursorClientPos(e) {
  if (e.originalEvent) e = e.originalEvent

  if (e.clientX != undefined) { // pc mouse event
    return [e.clientX, e.clientY];
  } else { // mobile touch event
    return [
      e.changedTouches[0].clientX,
      e.changedTouches[0].clientY,
    ];
  }
}

export function startRepeatTimeout(func, timeout = 1000) {
  function loop() {
    func()
    setTimeout(loop, timeout)
  }
  setTimeout(loop, timeout)
}

export function createDownloadTextFile(textData, fileName) {
    let time = new Date().toLocaleDateString().replace(/\//g, "_")
  
    let blob = new Blob([textData], {type: 'text/plain'})
    let download = document.createElement("a");
    download.href = window.URL.createObjectURL(blob)
    download.setAttribute('download', fileName)
    download.click()
    download.remove()
}

export class Ticker {
  intervalMs : number
  callback : CallableFunction
  timer : number

  constructor(intervalMs : number, callback : CallableFunction) {
    this.intervalMs = intervalMs
    this.callback = callback
    this.timer = null
  }

  tick() {
    this.callback()
    this.timer = window.requestAnimationFrame(() => this.tick())
  }

  start() {
    this.stop()
    this.timer = window.requestAnimationFrame(() => this.tick())
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
    ticker: Ticker
    callback : CallableFunction
    
    constructor(callback : CallableFunction, minIntervalMs : number) {
        this.isWaiting = false
        this.minIntervalMs = minIntervalMs
        this.callback = callback
        this.lastTriggerTime = 0
        this.ticker = new Ticker(minIntervalMs, () => this.tick())
        this.ticker.start()
    }

    tick() {
      let curTime = new Date().getTime()
      if (this.isWaiting && curTime > this.lastTriggerTime + this.minIntervalMs) {
        this.callback()
        this.isWaiting = false
        this.lastTriggerTime = curTime
      }
    }

    trigger() {
      this.isWaiting = true
    }
}

export class Position {
  left: number = 0
  top: number = 0
}