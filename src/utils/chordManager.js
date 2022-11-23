/* 
 * 小科普，scale、key和mode的区别
 * scale=音阶，多个不同音调的音符的组合是一个音阶，任意一个音阶可以代表一个调式
 * key=调性，标记了主音（如C key标记了C为主音tonic)，主音也是自然音阶中的第一个音，是调性的中心音、终止音、最稳定的音。
 * mode=调式，如大调、小调、五声调式、中古调式等
 * key有时可以同时表示调性和调式，如C-major，G-minor
 */

/* 
 * 小科普，有关音级(scale degree)
 * 在一个调式中，每个音都对应了一个音级
 *  级    中文名称    英文名称            意思
 * 1/Ⅰ   主音        Tonic              音阶中最主要的音
 * 2/Ⅱ   上主音      Supertonic         主音之上
 * 3/Ⅲ   中音        Mediant            主音与属音的中间
 * 4/Ⅳ   下属音      Subdominant        属音之下
 * 5/Ⅴ   属音        Dominant           第二重要的音
 * 6/Ⅵ   下中音      Submediant         主音和下属音的中间
 * 7/Ⅶ   导音        Leading tone/note  导向主音的音
 * 使用音级可以方便地表示和弦，称为和弦音级。
 * 半音阶里每个音也有对应的名称，这里不做赘述。
 */

let ChordArrayList = [
  // Major
  ["C", 4, 1, 3, null, [], [[3, 3, 1, null]]],
  ["#C", 4, 1, 4, null, [], [[1, 1, 1, 4], [4, 4, 1, null]]],
  ["bD", 4, 1, 4, null, [], [[1, 1, 1, 4], [4, 4, 1, null]]],
  ["D", 4, 1, 3, null, [], [[1, 2, 4, null], [2, 2, 3, null], [3, 2, 2, null]]],
  ["#D", 4, 1, 3, null, [], [[1, 1, 1, null], [2, 3, 3, null], [3, 3, 2, null]]],
  ["bE", 4, 1, 3, null, [], [[1, 1, 1, null], [2, 3, 3, null], [3, 3, 2, null]]],
  ["E", 4, 1, 4, null, [], [[1, 2, 1, null], [2, 4, 4, null], [3, 4, 3, null], [4, 4, 2, null]]],
  ["F", 4, 1, 3, null, [], [[1, 1, 2, null], [2, 2, 4, null]]],
  ["#F", 4, 1, 3, null, [], [[1, 1, 1, 4], [2, 2, 2, null], [3, 3, 4, null]]],
  ["bG", 4, 1, 3, null, [], [[1, 1, 1, 4], [2, 2, 2, null], [3, 3, 4, null]]],
  ["G", 4, 1, 3, null, [], [[1, 2, 3, null], [2, 2, 1, null], [3, 3, 2, null]]],
  ["#G", 4, 3, 3, null, [], [[1, 3, 1, 4], [2, 4, 2, null], [3, 5, 4, null]]],
  ["bA", 4, 3, 3, null, [], [[1, 3, 1, 4], [2, 4, 2, null], [3, 5, 4, null]]],
  ["A", 4, 1, 3, null, [], [[1, 1, 3, null], [2, 2, 4, null]]],
  ["#A", 4, 1, 3, null, [], [[1, 1, 1, 4], [2, 2, 3, null], [3, 3, 4, null]]],
  ["bB", 4, 1, 3, null, [], [[1, 1, 1, 4], [2, 2, 3, null], [3, 3, 4, null]]],
  ["B", 4, 1, 4, null, [], [[1, 2, 1, 4], [2, 3, 3, null], [3, 4, 4, null]]],

  // Minor
  ["Cm", 4, 1, 3, null, [], [[1, 3, 1, 3]]],
  ["#Cm", 4, 4, 3, null, [], [[1, 4, 1, 4], [3, 6, 4, null]]],
  ["bDm", 4, 4, 3, null, [], [[1, 4, 1, 4], [3, 6, 4, null]]],
  ["Dm", 4, 1, 3, null, [], [[1, 1, 2, null], [2, 2, 3, null], [3, 2, 4, null]]],
  ["#Dm", 4, 1, 3, null, [4], [[1, 1, 1, null], [2, 2, 2, null], [3, 3, 3, null]]],
  ["bEm", 4, 1, 3, null, [4], [[1, 1, 1, null], [2, 2, 2, null], [3, 3, 3, null]]],
  ["Em", 4, 1, 4, null, [], [[1, 2, 1, null], [2, 3, 2, null], [3, 4, 3, null]]],
  ["Fm", 4, 1, 3, null, [], [[1, 1, 4, null], [2, 1, 2, null], [4, 3, 1, null]]],
  ["#Fm", 4, 1, 3, null, [], [[1, 1, 3, null], [2, 2, 4, null], [3, 2, 2, null]]],
  ["bGm", 4, 1, 3, null, [], [[1, 1, 3, null], [2, 2, 4, null], [3, 2, 2, null]]],
  ["Gm", 4, 1, 3, null, [], [[1, 1, 1, null], [2, 2, 3, null], [3, 3, 2, null]]],
  ["#Gm", 4, 2, 3, null, [4], [[1, 2, 1, null], [2, 3, 3, null], [3, 4, 2, null]]],
  ["bAm", 4, 2, 3, null, [4], [[1, 2, 1, null], [2, 3, 3, null], [3, 4, 2, null]]],
  ["Am", 4, 1, 3, null, [], [[2, 2, 4, null]]],
  ["#Am", 4, 1, 3, null, [], [[1, 1, 1, 4], [2, 3, 4, null]]],
  ["bBm", 4, 1, 3, null, [], [[1, 1, 1, 4], [2, 3, 4, null]]],
  ["Bm", 4, 1, 4, null, [], [[1, 2, 1, 4], [2, 4, 4, null]]],

  // 部分7
  ["C7", 4, 1, 3, null, [], [[1, 1, 1, null]]],
  ["D7", 4, 1, 3, null, [], [[1, 2, 1, 4], [2, 3, 1, null]]],
  ["E7", 4, 1, 3, null, [], [[1, 1, 4, null], [2, 2, 3, null], [3, 2, 1, null]]],
  ["F7", 4, 1, 3, null, [], [[1, 1, 2, null], [2, 2, 4, null], [3, 3, 3, null], [4, 3, 1, null]]],
  ["G7", 4, 1, 3, null, [], [[1, 1, 2, null], [2, 2, 3, null], [3, 2, 1, null]]],
  ["A7", 4, 1, 3, null, [], [[1, 1, 3, null]]],
  ["B7", 4, 1, 3, null, [], [[1, 2, 1, 4], [2, 3, 3, null]]],

  // 部分sus4
  ["Csus4", 4, 1, 3, null, [], [[3, 3, 1, null], [1, 1, 2, null]]],
  ["Dsus4", 4, 1, 3, null, [], [[1, 2, 4, null], [2, 2, 3, null], [3, 3, 2, null]]],
  ["Esus4", 4, 2, 4, null, [], [[1, 2, 1, null], [2, 4, 4, null], [3, 4, 3, null], [4, 5, 2, null]]],
  ["Fsus4", 4, 1, 3, null, [], [[1, 1, 1, 2], [3, 3, 4, null]]],
  ["Gsus4", 4, 1, 3, null, [], [[1, 2, 3, null], [3, 3, 1, null], [2, 3, 2, null]]],
  ["Asus4", 4, 1, 3, null, [], [[2, 2, 4, null], [3, 2, 3, null]]],
  ["Bsus4", 4, 1, 4, null, [], [[1, 2, 1, 4], [3, 4, 4, null], [4, 4, 3, null]]],
]

function _chordArrayToObject(chordArray) {
  let chord = {}
  chord.name = chordArray[0]
  chord.stringNum = chordArray[1]
  chord.startFret = chordArray[2]
  chord.fretNum = chordArray[3]
  chord.rootString = chordArray[4]
  chord.disabledStrings = chordArray[5]
  chord.fingerings = []
  for (let fingerArray of chordArray[6]) {
    chord.fingerings.push({
      finger: fingerArray[0],
      fret: fingerArray[1],
      startString: fingerArray[2],
      endString: fingerArray[3]
    })
  }

  return chord
}

class ChordManager {
  constructor() {
    this.chords = []
    for (let chordArray of ChordArrayList) {
      let chord = _chordArrayToObject(chordArray)
      this.chords[chord.name] = chord
    }
  }

  isChord(chordName) {
    return _isChordName(chordName)
  }

  getChord(name, allowAlias) {
    if (this.chords[name])
      return this.chords[name]
    else
      return null
  }

  shiftKey(name, param1 = null, param2 = null) {
    if (param1 === null && param2 === null) throw "参数错误";
    else if (param1 !== null && param2 === null) {
      return this._shiftKeyByOffset(name, param1)
    }
    else if (param1 !== null && param2 !== null) {
      return this._shiftKeyByMode(name, param1, param2)
    }
    else
      throw "参数错误"
  }

  getDistance(chordName1, chordName2) {
    return _getKeyIndexByName(chordName2) - _getKeyIndexByName(chordName1)
  }

  _shiftKeyByOffset(chordName, offset) {
    let [keyName, suffix] = _splitChordSuffix(chordName)
    suffix = suffix ?? ""
    let curKeyIndex = _getKeyIndexByName(chordName)
    let newKeyIndex = (curKeyIndex + offset - 1 + 12) % 12 + 1
    let newKeyName = _getNameByKeyIndex(newKeyIndex)
    let newName = newKeyName + suffix
    return newName
  }

  _shiftKeyByMode(chordName, originalMode, targetMode) {
    let originalKeyIndex = _getKeyIndexByName(originalMode)
    let newKeyIndex = _getKeyIndexByName(targetMode)
    let offset = newKeyIndex - originalKeyIndex
    if (offset == 0) return chordName;

    let newName = this._shiftKeyByOffset(chordName, offset)
    return newName
  }

  traverse(func) {
    for (let key in this.chords) {
      func(this.chords[key])
    }
  }

  isAlias(name1, name2) {
    if (!_isChordName(name1) || !_isChordName(name2)) return false;

    let [key1, suffix1] = _splitChordSuffix(name1)
    let keyIndex1 = _getKeyIndexByName(name1)
    let [key2, suffix2] = _splitChordSuffix(name2)
    let keyIndex2 = _getKeyIndexByName(name2)
    return keyIndex1 == keyIndex2 && suffix1 == suffix2
  }

  isMinor(chordName) {
    const ReHasMinor = /m(?!aj)/
    let found = (chordName.search(ReHasMinor) >= 0)
    return found
  }

  isMajor(chordName) {
    return !this.isMinor(chordName)
  }

  // 拆分和弦，将根音和后缀分离，如：
  // C -> [C, null]
  // Gm -> [G, m]
  // #Fmsus4add11 -> [#F, msus4add11]
  splitChordSuffix(chordName) {
    return _splitChordSuffix(chordName)
  }

  // 拆分和弦，将主和弦和装饰音分离，如：
  // C -> [C, null]
  // Gm -> [Gm, null]
  // #Fmsus4add11 -> [#Fm, sus4add11]
  splitChordDecoration(chordName) {
    return _splitChord(chordName, ReSplitChordDecoration)
  }
}

const ReSplitChordSuffix = /^(#?b?[A-Ga-g]#?b?)((maj|add|sus|aug|dim|[1-9])*)?$/
const ReSplitChordDecoration = /^(#?b?[A-Ga-g]#?b?m?)((maj|add|sus|aug|dim|[1-9])*)?$/

function _getNumOfChar(str, char) {
  let n = 0;
  for (let c of str)
    if (c == char)
      n++;
  return n;
}

function _isChordName(str) {
  let res = str.match(ReSplitChordSuffix)
  if (!res) return false
  let keyName = res[1]
  if (!keyName) return false // 需要有主音
  if (keyName == "#" || keyName == "b") return false // 不能只有#/b
  if (_getNumOfChar(keyName, '#') > 1 || _getNumOfChar(keyName, 'b') > 1 > 1) return false // 不能有多个#/b
  if (keyName.indexOf('#') != -1 && keyName.indexOf('b') != -1) return false // 不能有多个#/b
  return true
}

function _splitChord(str, re) {
  let res = str.match(re)
  if (!res)
    throw "拆解和弦失败：" + str
  let keyName = res[1]
  let suffix = res[2] ?? null

  // 检查主音格式
  let hasSharp = false, hasFlat = false
  res = keyName.match(/#/g)
  if (res) {
    hasSharp = true;
    if (res.length > 2) throw "和弦格式错误，不应有多个#";
  }
  res = keyName.match(/b/g)
  if (res) {
    hasFlat = true;
    if (res.length > 2) throw "和弦格式错误，不应有多个b";
  }
  if (hasSharp && hasFlat) throw "和弦格式错误，不应同时拥有#和b";

  // TODO: 检查后缀格式

  return [keyName, suffix]
}

function _splitChordSuffix(str) {
  return _splitChord(str, ReSplitChordSuffix)
}

const g_KeyMap = {
  "C": 1,
  "D": 3,
  "E": 5,
  "F": 6,
  "G": 8,
  "A": 10,
  "B": 12,
}

function _getKeyIndexByName(name) {
  let [keyName, suffix] = _splitChordSuffix(name)

  let res = keyName.match(/[^b#]+/)
  if (!res) throw "未知错误";
  let keyWithoutDecoration = res[0].toUpperCase()
  let mode = g_KeyMap[keyWithoutDecoration]
  if (!mode) throw "未知错误";

  let hasSharp = false, hasFlat = false
  res = keyName.match(/#/)
  if (res) hasSharp = true;
  res = keyName.match(/b/)
  if (res) hasFlat = true;

  if (hasSharp) mode++;
  else if (hasFlat) mode--;

  return mode
}

function _getNameByKeyIndex(mode) {
  if (mode <= 0 || mode > 12) throw "未知错误";

  let keyName = null
  for (let key in g_KeyMap) {
    if (g_KeyMap[key] == mode) {
      keyName = key
      break
    }
  }

  if (!keyName) {
    for (let key in g_KeyMap) {
      if (g_KeyMap[key] == mode - 1) {
        keyName = "#" + key
        break
      }
    }
  }

  return keyName
}

export default new ChordManager