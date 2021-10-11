let g_Listeners = {}

function addListener(key, ctrl, shift, alt, callback) {
  if (!g_Listeners[key]) g_Listeners[key] = []
  g_Listeners[key].push({
    ctrl, shift, alt, callback
  })
}

function removeListener(key, ctrl, shift, alt, callback) {
  if (!g_Listeners[key]) return;

  let index = g_Listeners[key].findIndex((e) => e.ctrl == ctrl && e.shift == shift && e.alt == alt && e.callback == callback)
  if (index > 0)
    g_Listeners[key].splice(index, 1)
}

document.addEventListener("keydown", (e) => {
  const key = e.key
  const ctrl = e.ctrlKey
  const shift = e.shiftKey
  const alt = e.altKey
  for(let entry of g_Listeners[key] ?? []) {
    if (ctrl == entry.ctrl && shift == entry.shift && alt == entry.alt) {
      entry.callback(e)
    }
  }
})

export default {
  addListener, removeListener
}