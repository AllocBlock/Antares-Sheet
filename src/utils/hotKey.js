// 使用js标准的keyCode
// KeyboardEvent.code，https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code 

class KeyListener {
  constructor(eventName, allowRepeat = true) {
    this.hookId = 1
    this.listeners = {}
    this.allowRepeat = allowRepeat

    document.addEventListener(eventName, (e) => {
      if (!this.allowRepeat && e.repeat) return
      const keyCode = e.code
      const ctrl = e.ctrlKey
      const shift = e.shiftKey
      const alt = e.altKey
      
      // debug
      // console.log(`${eventName}: keyCode=${keyCode}, ctrl=${ctrl}, shift=${shift}, alt=${alt}`, e)

      for(let entry of this.listeners[keyCode] ?? []) {
        if (this.isMatch(ctrl, entry.ctrl) && this.isMatch(shift, entry.shift) && this.isMatch(alt, entry.alt)) {
          entry.callback(e, entry.customData)
        }
      }
    })
  }

  isMatch(assistKeyState, requireState) {
    if (requireState == null) return true;
    else return assistKeyState == requireState
  }

  // ctrl/shift/alt为null代表不关心（都可触发）
  addListener(keyCode, callback, ctrl = null, shift = null, alt = null, customData = null) {
    if (!this.listeners[keyCode]) this.listeners[keyCode] = []
    this.listeners[keyCode].push({
      id: this.hookId, callback, ctrl, shift, alt, customData
    })
    return this.hookId++;
  }
  
  removeListener(id) {
    for (let key in this.listeners) {
      let index = this.listeners[key].findIndex(e => e.id == id)
      if (index != -1) {
        this.listeners[key].splice(index, 1)
        return;
      }
    }
  }
}

const gKeyDownNormalListener = new KeyListener("keydown", true)
const gKeyDownNoRepeatListener = new KeyListener("keydown", false)
const gKeyUpListener = new KeyListener("keyup")

function addListener(keyCode, callback, ctrl = null, shift = null, alt = null, customData = null) {
  return gKeyDownNormalListener.addListener(keyCode, callback, ctrl, shift, alt, customData)
}

function removeListener(id) {
  return gKeyDownNormalListener.removeListener(id)
}

function addKeyDownListener(keyCode, callback, ctrl = null, shift = null, alt = null, customData = null) {
  return gKeyDownNoRepeatListener.addListener(keyCode, callback, ctrl, shift, alt, customData)
}

function removeKeyDownListener(id) {
  return gKeyDownNoRepeatListener.removeListener(id)
}

function addKeyUpListener(keyCode, callback, ctrl = null, shift = null, alt = null, customData = null) {
  return gKeyUpListener.addListener(keyCode, callback, ctrl, shift, alt, customData)
}

function removeKeyUpListener(id) {
  return gKeyUpListener.removeListener(id)
}

export default {
  addListener, removeListener,
  addKeyDownListener, removeKeyDownListener,
  addKeyUpListener, removeKeyUpListener,
}