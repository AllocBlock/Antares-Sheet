import { assert } from "@/utils/assert.js"

const VariableType = {
  Object: 0,
  Function: 1,
  Other: 2
}

function getVariableType(v) {
  if (v.constructor === Object) return VariableType.Object;
  else if (typeof v == 'function') return VariableType.Function;
  else return VariableType.Other;
}

function mergeFunctions(first, second) {
  if (!first && !second) return () => {};
  else if (first && !second) return first;
  else if (!first && second) return second;

  assert(typeof first == 'function', "合并的目标需要是函数")
  assert(typeof second == 'function', "合并的目标需要是函数")
  return function (...args) {
    first(...args)
    second(...args)
  }
}

function mergeObjects(first, second) {
  assert(first.constructor === Object, "合并的目标需要是对象")
  assert(second.constructor === Object, "合并的目标需要是对象")

  let obj = {}

  let keys = new Set()
  for (let key of Object.keys(first))
    keys.add(key)
  for (let key of Object.keys(second))
    keys.add(key)

  for (let key of keys) {
    let o1 = first[key]
    let o2 = second[key]
    if (o1 != undefined && o2 != undefined)
      obj[key] = mergeHelper(o1, o2)
    else if (o1 != undefined)
      obj[key] = o1
    else if (o2 != undefined)
      obj[key] = o2
    else
      throw "不应到达的分支"
  }

  return obj
}

function mergeHelper(first, second) {
  const type1 = getVariableType(first)
  const type2 = getVariableType(second)
  if (type1 != type2)
    throw "不能合并不同类型的变量";
  
  const type = type1
  if (type == VariableType.Object)
    return mergeObjects(first, second)
  else if (type == VariableType.Function)
    return mergeFunctions(first, second)
  else
    throw "不支持合并该变量";
}

function mergeCallbacks(first, second) {
  if (!first && !second) return {};
  else if (first && !second) return first;
  else if (!first && second) return second;

  assert(first.constructor === Object, "合并的目标需要是对象")
  assert(second.constructor === Object, "合并的目标需要是对象")
  return mergeHelper(first, second)
}

export function mergeEditorModes(mode1, mode2, tip = null) {
  let editorMode = {}
  editorMode.tip = tip ?? mode1.tip + "\n" + mode2.tip;
  editorMode.componentEvents = mergeCallbacks(mode1.componentEvents, mode2.componentEvents);
  editorMode.documentEvents = mergeCallbacks(mode1.documentEvents, mode2.documentEvents);
  editorMode.toolChordEvents = mergeCallbacks(mode1.toolChordEvents, mode2.toolChordEvents);
  editorMode.init = mergeFunctions(mode1.init, mode2.init);
  editorMode.release = mergeFunctions(mode1.release, mode2.release);

  return editorMode;
}

// FIXME: bad design as many wrap are created, fix later
export function mergeEditorModeArray(array, tip = null) {
  let cur = array[0]
  for (let i = 1; i < array.length; ++i) {
    cur = mergeEditorModes(cur, array[i], tip)
  }
  return cur
}