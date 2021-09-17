const MinChordGraphHeight = 400, MinChordGraphWidth = 300
const FingerNameList = ["1", "2", "3", "4", "T"]
const TitleRatio = 0.16

document.documentElement.style.setProperty('--chord-renderer-title-ratio', `${TitleRatio * 100}%`)

$(document).on("fit", ".chord-block", (e)=>{ // 缩放事件
    _chordBlockFit($(e.currentTarget))
})

function _chordBlockFit($chordBlock) {
    let $parent = $chordBlock.parent()
    let scaleX = $parent.width() / $chordBlock.width()
    let scaleY = $parent.height() / $chordBlock.height()
    $chordBlock.css({
        "transform": `scale(${scaleX}, ${scaleY})`
    })
}

function drawChord(element, chord) { // 绘制和弦的核心函数
    let $element = $(element) // 确保是jq类型
    if (!chord) {
        _drawError($element)
        return
    }
    chord = _formatChordInfo(chord)
    if (!chord || !_checkChord(chord)) {
        _drawError($element)
        return
    }
    $element.empty() // 清除元素内容

    // 创建和弦
    let [chordWidth, chordHeight] = _getActualChordGraphLayout($element)
    let $chordBlock = _createChord(chord, chordWidth, chordHeight)
    $element.append($chordBlock)
    $chordBlock.css({
        "transform-origin": "left top",
    })
    $chordBlock.trigger("fit")
}

function drawChordNotFound(element, chordName) {
    let $element = $(element)
    let fontSize = 20;
    let $textChord = $(`<div></div>`)
    let $chordName = $(`<div>${chordName}</div>`)
    let $newFoundText = $("<div>未找到</div>")
    $textChord.addClass("chord-block chord-block-not-found")
    $textChord.css("font-size", `${fontSize}px`)
    $textChord.append($chordName)
    $textChord.append($newFoundText)
    $element.empty()
    $element.append($textChord)

    fontSize = (fontSize / $chordName.width()) * $element.width() * 0.8
    $textChord.css("font-size", `${fontSize}px`)
}

function _drawError($element) {
    let fontSize = Math.min($element.width(), $element.height()) * 0.9;

    let $textChord = $("<div>?</div>")
    $textChord.addClass("chord-block chord-block-error")
    $textChord.css("font-size", `${fontSize}px`)
    $element.empty()
    $element.append($textChord)
}

function _createChord(chord, width, height) {
    let $chordBlock = $("<div></div>")
    $chordBlock.width(width)
    $chordBlock.height(height)
    $chordBlock.addClass("chord-block")

    // 添加标题
    // TODO: 为啥获取不到...
    let fontSize = height * TitleRatio * 0.8
    let $chordTitle = _createChordTitle(chord.chordName, fontSize, width * 0.9) 
    $chordBlock.append($chordTitle)
    
    // 添加和弦图
    let $chordGraph = _createGraph(chord, width, height)
    $chordBlock.append($chordGraph)

    // 添加事件
    $chordGraph.on("fit", (e)=>{
        if (e.target.tagName != "CHORD-BLOCK") return;
        _chordBlockFit($(e.target))
    })

    return $chordBlock;
}

function _formatChordInfo(chord) {
    chord.chordName = chord.chordName ? chord.chordName : ""
    if (!chord.stringNum) return null
    chord.startFret = parseInt(chord.startFret)
    if (chord.startFret == NaN) return null
    chord.fretNum = parseInt(chord.fretNum)
    if (chord.fretNum == NaN) return null
    if (chord.rootString) chord.rootString = parseInt(chord.rootString)
    if (chord.rootString == NaN) return null
    chord.disabledStrings = chord.disabledStrings ? chord.disabledStrings : []
    if (!Array.isArray(chord.disabledStrings)) return null
    chord.fingerings = chord.fingerings ? chord.fingerings : []
    if (!Array.isArray(chord.fingerings)) return null
    for(let i in chord.fingerings) {
        chord.fingerings[i].fret = parseInt(chord.fingerings[i].fret)
        if (chord.fingerings[i].fret == NaN) return null
        chord.fingerings[i].startString = parseInt(chord.fingerings[i].startString)
        if (chord.fingerings[i].startString == NaN) return null
        chord.fingerings[i].endString = parseInt(chord.fingerings[i].endString)
        if (chord.fingerings[i].endString == NaN) return null
    }
    return chord
}

function _checkChord(chord) {
    if (chord.chordName.length == 0)
        console.warn("和弦渲染：和弦没有指定名称")
    if (chord.stringNum <= 0) {
        console.error(`和弦渲染：琴弦数量需要大于0，而当前的值为${chord.stringNum}`)
        return false
    }
    if (chord.startFret <= 0) {
        if (chord.startFret == 0)
            console.warn(`和弦渲染：起始品格不能为0，已自动修正为1`)
        else {
            console.error(`和弦渲染：起始品格需要大于0，而当前的值为${chord.startFret}`)
            return false
        }
    }
    if (chord.fretNum <= 0) {
        console.error(`和弦渲染：品格数需要大于0，而当前的值为${chord.fretNum}`)
        return false
    }
    if (chord.rootString != null && (chord.rootString <= 0 || chord.rootString > chord.stringNum)) {
        console.error(`和弦渲染：根音弦为null或取[1-${chord.stringNum}]，而当前的值为${chord.rootString}`)
        return false
    }
    for(let disabledString of chord.disabledStrings) {
        if (disabledString <= 0 || disabledString > chord.stringNum) {
            console.error(`和弦渲染：禁用弦的范围是[1-${chord.stringNum}]，而存在禁用弦的值为${disabledString}`)
            return false
        }
    }
    for(let fingering of chord.fingerings) {
        // 指法检查
        let fingerIndex = FingerNameList.findIndex((f) => f == fingering.finger)
        if (fingerIndex < 0 || fingerIndex > FingerNameList.length){
            console.error(`和弦渲染：指法存在错误，手指标号可选的值为`, FingerNameList, `，而当前值为${fingering.finger}`)
            return false
        }
        if (fingering.fret < chord.startFret || fingering.fret >= chord.fretNum + chord.startFret){
            console.error(`和弦渲染：指法存在错误，品位标号的范围是[${chord.startFret}-${chord.startFret + chord.fretNum}]，而存在值为${fingering.fret}`)
            return false
        }
        if (fingering.startString < 1 || fingering.startString > chord.stringNum){
            console.error(`和弦渲染：指法存在错误，起始琴弦标号的范围是[1-${chord.stringNum}]，而存在值为${fingering.startString}`)
            return false
        }
        if (fingering.endString && (fingering.startString > fingering.endString || fingering.endString > chord.stringNum)){
            console.error(`和弦渲染：指法存在错误，结束琴弦标号可以为null或取[${fingering.startString}（起始）-${chord.stringNum}]，而存在值为${fingering.endString}`)
            return false
        }
    }

    return true
}

function _createChordTitle(chordName, fontSize, maxWidth) {
    let $chordName = $("<div></div>")
    $chordName.addClass("chord-name")

    $chordName.text(chordName)
    $chordName.css("font-size", fontSize)

    let curWidth = _textLen($chordName.val(), $chordName)
    if (curWidth > maxWidth) { // 如果过长则减小字体
        $chordName.css("font-size", fontSize * (maxWidth / curWidth))
    }

    return $chordName;
}

function _getActualChordGraphLayout($element) {
    // 获取父元素长宽
    let parentWidth = $element.width()
    let parentHeight = $element.height()

    let actualWidth = parentWidth
    let actualHeight = parentHeight

    // 限制最低长宽，更小的使用缩放实现，避免chrome字体不能小于12px的限制
    if (parentWidth < MinChordGraphWidth)
        actualWidth = MinChordGraphWidth
    if (parentHeight < MinChordGraphHeight)
        actualHeight = MinChordGraphHeight
    return [actualWidth, actualHeight]
}

function _createGraph(chord, width, height) {
    const PaddingLeft= 0.1
    const PaddingRight = 0.1
    const PaddingTop = 0.05
    const PaddingBottom = 0.1
    const StartFretMarkWidth = 0.14 // 起始品格占比
    const DisableStringMarkHeight = 0.05 // 禁用弦占比
    
    const predictButtonSize = 0.1; // 预测的指法大小，当执法在1弦和最后一弦时会突出一部分，需要预留空间
    
    let startFretReserve = (chord.startFret > 1)
    let buttonReserveLeft = false, buttonReserveRight = false
    for(let fingering of chord.fingerings){
        if (fingering.startString == 1) // 如果1弦有指法，右边需要预留
            buttonReserveRight = true
        if (fingering.startString == 4 || fingering.endString == 4) // 如果最后弦有指法
        {
            if (chord.startFret == 1 || 
                (chord.startFret > 1 && fingering.fret === chord.startFret)){ // 如果没有起始标记，需要留；如果有标记，但标记挨着指法，也需要留；
                buttonReserveLeft = true
            }
        }
    }

    // 计算琴弦范围
    let stringStart = 0.0, stringEnd = 1.0
    if (PaddingLeft) 
        stringStart += PaddingLeft
    if (PaddingRight) 
        stringEnd -= PaddingRight
    if (startFretReserve)
        stringStart += StartFretMarkWidth
    if (buttonReserveLeft)
        stringStart += predictButtonSize / 2
    if (buttonReserveRight)
        stringEnd -= predictButtonSize / 2

    let fretStart = 0.0, fretEnd = 1.0
    if (PaddingTop) 
        fretStart += PaddingTop
    if (PaddingBottom) 
        fretEnd -= PaddingBottom
    let disableStringReserve = (chord.disabledStrings.length > 0)

    if (disableStringReserve)
        fretStart += DisableStringMarkHeight

    let fretInterval = 1 / chord.fretNum
    let stringInterval = 1 / (chord.stringNum - 1)

    // 添加指板，存放琴弦和品丝
    let $chordGraph = $("<div></div>")
    $chordGraph.addClass("chord-graph")

    // 添加起始品位
    if (chord.startFret > 1){
        let startFretWidth = StartFretMarkWidth
        let startFretHeight = fretInterval * (fretEnd - fretStart)
        let fontSize = Math.min(width * startFretWidth, height * startFretHeight) * 0.8;
        let $startFretMark = _createStartFret(chord.startFret)
        $startFretMark.css({
            left: 0,
            top: `${fretStart * 100}%`,
            width: `${startFretWidth * 100}%`,
            height: `${startFretHeight * 100}%`,
            "font-size": `${fontSize}px`,
            "z-index": 1 // 保证在最上层
        })
        $chordGraph.append($startFretMark)
    }

    // 添加指板
    let boardWidthPx = width * (stringEnd - stringStart)
    let boardHeightPx = height * (fretEnd - fretStart)
    let buttonSize = Math.min(boardWidthPx * stringInterval * 1.2, boardHeightPx * fretInterval * 0.6)

    let $chordBoard = _createBoard(chord, buttonSize)
    $chordBoard.css({
        left: `${stringStart * 100}%`,
        right: `${(1 - stringEnd) * 100}%`,
        top: `${fretStart * 100}%`,
        bottom: `${(1 - fretEnd) * 100}%`,
    })
    $chordGraph.append($chordBoard)

    return $chordGraph;
}

function _createStartFret(fretName) {
    let $startFretMark = $("<div></div>")
    $startFretMark.addClass("chord-start-fret")
    $startFretMark.addClass("flex-center")
    $startFretMark.text(fretName)

    return $startFretMark
}

function _createBoard(chord, buttonSize) {
    let $chordBoard = $("<div></div>")
    $chordBoard.addClass("chord-board")
    
    // 品丝
    let frets = _createFrets(chord.fretNum)
    for(let $fret of frets)
        $chordBoard.append($fret)

    // 琴弦
    let strings = _createStrings(chord.stringNum, chord.rootString)
    for(let $string of strings)
        $chordBoard.append($string)

    // 添加禁用弦
    let crossSize = 30
    let crossThick = crossSize / 8
    let disableMarks = _createDsiableStringMarks(chord.disabledStrings, chord.stringNum, crossSize, crossThick)
    for(let $mark of disableMarks)
        $chordBoard.append($mark)

    // 添加指法层
    let $fingerings = _createFingerings(chord.chordName, chord.fingerings, chord.stringNum, chord.startFret, chord.fretNum, buttonSize)
    $chordBoard.append($fingerings)

    return $chordBoard;
}

function _createFrets(fretNum) {
    let frets = []

    let fretInterval = 1 / fretNum
    for(let i = 0; i <= fretNum; i++) {
        let $fret = $("<div></div>")
        if (i == 0)
            $fret.addClass("chord-fret-bold")
        else
            $fret.addClass("chord-fret")
        
        $fret.css("top", `${i * fretInterval * 100}%`)
        frets.push($fret)
    }

    return frets
}

function _createStrings(stringNum, rootString = null) {
    let strings = []

    let stringInterval = 1 / (stringNum - 1)
    for(let i = 0; i < stringNum; i++){
        let string = stringNum - i
        let $string = $("<div></div>")
        if (rootString && string == rootString){
            $string.addClass("chord-string-root")
        }
        else{
            $string.addClass("chord-string")
        }

        $string.css("left", `${i * stringInterval * 100}%`)
        strings.push($string)
    }
    return strings
}

function _createDsiableStringMarks(disabledStrings, stringNum, markSize, markThickness) {
    let marks = []

    let stringInterval = 1 / (stringNum - 1)
    for(let string of disabledStrings){
        let $mark = $("<div></div>")
        $mark.addClass("chord-cross")
        $mark.css({
            width: `${markSize}px`,
            height: `${markThickness}px`,
            top: `${-markSize * 0.7}px`,
            left: `${(stringNum - string) * stringInterval * 100}%`
        })
        marks.push($mark)
    }

    return marks
}

function _createFingerings(chordName, fingerings, stringNum, startFret, fretNum, buttonSize) {
    let fretInterval = 1 / fretNum
    let stringInterval = 1 / (stringNum - 1)
    
    let $fingerings = $("<div></div>")
    $fingerings.addClass("chord-fingerings")

    for(let fingering of fingerings){
        let finger = fingering.finger
        let fret = fingering.fret
        let startString = fingering.startString
        let endString = fingering.endString
        let fingeringStringNum = endString ? endString - startString + 1 : 1;

        // 创建指法
        let $fingering = $("<div></div>")
        $fingering.addClass("chord-fingering")
        let fingeringWidth, fingeringHeight
        let flexMethod
        if (fingeringStringNum == 1){ // 无横按
            fingeringWidth = `${buttonSize}px`
            fingeringHeight = `${buttonSize}px`
            flexMethod = "center"
            $fingering.text(finger)
        }
        else{
            fingeringWidth = `calc(${buttonSize}px + ${(fingeringStringNum - 1) * stringInterval * 100}%)`
            fingeringHeight = `${buttonSize}px`
            flexMethod = "space-between"
            let number = `<div class='flex-center' style='width:${buttonSize}px;'>${finger}<div>`
            $fingering.append(number)
            $fingering.append(number)
        }
        $fingering.css({
            top: `calc(${(fret - startFret + 0.5) * fretInterval * 100}% - ${buttonSize / 2}px)`,
            right: `calc(${(startString - 1) * stringInterval * 100}% - ${buttonSize / 2}px)`,
            width: fingeringWidth,
            height: fingeringHeight,
            "justify-content": flexMethod,
            "font-size": buttonSize*0.7,
        })
        
        $fingerings.append($fingering)
    }

    return $fingerings
}

/* 计算文本实际长度 */
function _textLen(text, element) {
    let fontSize = $(element).css('font-size')
    let fontFamily = $(element).css('font-family')
        
    let font = fontSize + ' ' + fontFamily
    let tempElement = $('<div>' + text + '</div>')
        .css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': font})
        .appendTo($('body'))
    let width = tempElement.width()

    tempElement.remove()
    return width
}

export {drawChord, drawChordNotFound}