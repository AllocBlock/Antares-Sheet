let gListeners = {}
let gHookId = 1;
// let gDebug = true

function addListener(key, ctrl, shift, alt, callback, customData = null) {
  if (!gListeners[key]) gListeners[key] = []
  gListeners[key].push({
    id: gHookId, ctrl, shift, alt, callback, customData
  })
  return gHookId++;
}

function removeListener(id) {
  for (let key in gListeners) {
    let index = gListeners[key].findIndex(e => e.id == id)
    if (index != -1) {
      gListeners[key].splice(index, 1)
      return;
    }
  }
}

document.addEventListener("keydown", (e) => {
  const key = e.key
  const ctrl = e.ctrlKey
  const shift = e.shiftKey
  const alt = e.altKey
  // if (gDebug)
  //   console.log(`key=${key}, ctrl=${ctrl}, shift=${shift}, alt=${alt}`)
  for(let entry of gListeners[key] ?? []) {
    if (ctrl == entry.ctrl && shift == entry.shift && alt == entry.alt) {
      entry.callback(e, entry.customData)
    }
  }
})

export default {
  addListener, removeListener
}