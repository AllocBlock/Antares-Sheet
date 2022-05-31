// tips模块，用于显示网页中的提示，并管理是否出现提示

const e_TipPosition = {
    OUTSIDE_ABOVE: 0,
    OUTSIDE_BELOW: 1,
    OUTSIDE_LEFT: 2,
    OUTSIDE_RIGHT: 3,
    CENTER: 4,
    SCREEN_CENTER: 5
}

class Tip {
    constructor(element, text, position, focus, buttons) {
        this.element = element
        this.text = text
        this.position = position
        this.focus = focus
        this.buttons = buttons
    }
}

class TipStorage {
    // 设置阅读状态
    setRead(name, state) {
        let tipRecords = this._getTipStorage()
        tipRecords.list[name] = state
        tipRecords.updateTime = new Date()
        this._setTipStorage(tipRecords)
    }

    // 获取阅读状态
    isRead(name) {
        let tipRecords = this._getTipStorage()
        let state = tipRecords.list[name]
        if (state == undefined) {
            this.setRead(name, false)
            return false
        }
        else return state
    }

    // 获取缓存
    _getTipStorage() {
        let tipRecords = JSON.parse(window.localStorage.getItem("tipRecords"))
        return tipRecords ? tipRecords : {list: [], updateTime: new Date()}
    }
    // 设置缓存
    _setTipStorage(data) {
        window.localStorage.setItem("tipRecords", JSON.stringify(data))
    }
}

const g_TipStorage = new TipStorage

class TipAnimator {
    constructor(name, tipSequence) {
        if (!tipSequence) throw "提示序列有误"
        this.name = name
        this.tipSequence = tipSequence
        this.currentTipIndex = 0
        this.$currentTipElements = null
    }

    start() {
        this.next()
    }

    next() {
        this.removeCurrentTip()
        if (this.currentTipIndex >= this.tipSequence.length) {
            g_TipStorage.setRead(this.name)
        }
        else {
            this.$currentTipElements = this.showTip(this.tipSequence[this.currentTipIndex++])
        }
    }

    skip() {
        this.removeCurrentTip()
        g_TipStorage.setRead(this.name)
    }

    showTip(tip) {
        let $e = $(tip.element)
        const TipOffset = 20
        const TipPadding = 10

        // 提示背景，阻挡鼠标事件
        let $tipBackground = $("<div class='tip_background'></div>")

        // 添加提示文字
        let $tipText = $("<div class='tip_text'></div>")
        $tipText.text(tip.text)

        switch(tip.position){
            case e_TipPosition.OUTSIDE_ABOVE: { // 提示框在目标元素上方
                $tipText.css({
                    transform: "translate(-50%, -100%)",
                    left: $e.offset().left + $e.innerWidth() / 2,
                    top: $e.offset().top - TipOffset
                })
                break
            }
            case e_TipPosition.OUTSIDE_BELOW:{ // 提示框在目标元素下方
                $tipText.css({
                    transform: "translateX(-50%)",
                    left: $e.offset().left + $e.innerWidth() / 2 ,
                    top: $e.offset().top + $e.innerHeight() + TipOffset
                })
                break
            }
            case e_TipPosition.OUTSIDE_LEFT:{ // 提示框在目标元素左侧
                $tipText.css({
                    transform: "translate(-100%, -50%)",
                    left: $e.offset().left - TipOffset,
                    top: $e.offset().top + $e.innerHeight() / 2,
                })
                break
            }
            case e_TipPosition.OUTSIDE_RIGHT:{ // 提示框在目标元素右侧
                $tipText.css({
                    transform: "translateY(-50%)",
                    left: $e.offset().left + $e.innerWidth() + TipOffset,
                    top: $e.offset().top + $e.innerHeight() / 2,
                })
                break
            }
            case e_TipPosition.CENTER:{ // 提示框在目标元素正中
                $tipText.css({
                    transform: "translate(-50%, -50%)",
                    left: $e.offset().left + $e.innerWidth() / 2,
                    top: $e.offset().top + $e.innerHeight() / 2,
                })
                break
            }
            case e_TipPosition.SCREEN_CENTER: { // 提示框在屏幕正中
                $tipText.css({
                    position: 'fixed',
                    transform: "translate(-50%, -50%)",
                    left: '50%',
                    top: '50%',
                })
                break
            }
        }
        
        // 添加各类按钮
        let $buttonList = $("<div class='tip_button_row'></div>")
        $tipText.append($buttonList)

        for(let button of tip.buttons) {
            let $button = null
            switch (button) {
                case "confirm":
                    $button = $("<div class='tip_button tip_button_confirm'>确认</div>")
                    $button.click(()=>this.next())
                    break;
                case "next":
                    $button = $("<div class='tip_button tip_button_next'>下一个</div>")
                    $button.click(()=>this.next())
                    break;
                case "finish":
                    $button = $("<div class='tip_button tip_button_finish'>完成</div>")
                    $button.click(()=>this.next())
                    break;
                case "skip":
                    $button = $("<div class='tip_button tip_button_skip'>跳过</div>")
                    $button.click(()=>this.skip())
                    break;
                default:
                    throw "不支持的按钮类型"
                    break;
            }
            $buttonList.append($button)
        }
     
        if (tip.position == e_TipPosition.OUTSIDE_ABOVE){
            $buttonList.css({
                top: -70,
                bottom: 'auto'
            })
        }

        // 聚焦黑色背景的显示与隐藏
        let $tipCovers = $()
        if (tip.focus === true){ // 聚焦，周围变暗，只有元素和提示是亮的
            let hasFocusElement = (tip.element && tip.position != e_TipPosition.SCREEN_CENTER)
            if (hasFocusElement) {
                let $e = $(tip.element)
                let $up = $("<div class='tip_cover'></div>")
                let $down = $("<div class='tip_cover'></div>")
                let $left = $("<div class='tip_cover'></div>")
                let $right = $("<div class='tip_cover'></div>")
                $tipCovers = $tipCovers.add($up)
                $tipCovers = $tipCovers.add($down)
                $tipCovers = $tipCovers.add($left)
                $tipCovers = $tipCovers.add($right)
                $up.css({
                    top: 0,
                    height: $e.offset().top - TipPadding,
                    width: "100%"
                })
                $down.css({
                    top: $e.offset().top + $e.height() + TipPadding,
                    height: $(document).height(),
                    width: "100%"
                })
                $left.css({
                    left: 0,
                    width: $e.offset().left - TipPadding,
                    top: $e.offset().top - TipPadding,
                    height: $e.height() + TipPadding * 2,
                })
                $right.css({
                    left:  $e.offset().left + $e.width() + TipPadding,
                    right: 0,
                    top: $e.offset().top - TipPadding,
                    height: $e.height() + TipPadding * 2,
                })
            }
            else {
                $tipCovers = $("<div class='tip_cover'></div>")
                $tipCovers.css({
                    position: "fixed",
                    width: "100%",
                    height: "100%",
                    top: 0,
                    left: 0
                })
            }
        }

        let $tipElements = $()
        $tipElements = $tipElements.add($tipBackground)
        $tipElements = $tipElements.add($tipText)
        $tipElements = $tipElements.add($tipCovers)

        if ($e.css("position") == "fixed") {
            $tipText.css("position", "fixed")
            $tipCovers.css("position", "fixed")
        }

        $("html").append($tipElements)
        return $tipElements
    }

    removeCurrentTip() {
        // // z-index恢复
        // $(this.currentTipInfo.element).css({ // z-index恢复
        //     "z-index": "auto"
        // })

        // // 变量重置
        // this.currentTipInfo = null

        // // 渐隐后删除
        // $(".tip_background").fadeOut(500, () => $(".tip_background").remove())
        // $(".tip_cover").fadeOut(500, () => $(".tip_cover").remove())
        
        if (this.$currentTipElements) {
            this.$currentTipElements.remove()
            this.$currentTipElements = null
        }
    }
}

const g_TipLib = {
    test: [
        new Tip(null, "测试教程\n等待后续完善", e_TipPosition.SCREEN_CENTER, true, ["next"]),
        new Tip("#song_title_input", "修改歌名", e_TipPosition.OUTSIDE_BELOW, true, ["next", "skip"]),
        new Tip("#song_singer_input", "修改歌手", e_TipPosition.OUTSIDE_BELOW, true, ["next", "skip"]),
        new Tip("#sheet_key_block", "修改调式", e_TipPosition.OUTSIDE_RIGHT, true, ["next", "skip"]),
        new Tip("#sheet", "编辑框", e_TipPosition.OUTSIDE_ABOVE, true, ["next", "skip"]),
        new Tip("#tools_block_fix", "工具栏", e_TipPosition.OUTSIDE_RIGHT, true, ["finish"]),
    ]
}

function runPresetTip(name, force = false) {
    let tipSeq = g_TipLib[name]
    if (!tipSeq) throw "未找到该教程：" + name;
    if (!force){
        if (g_TipStorage.isRead(name)) return;
    }
    let animator = new TipAnimator(name, tipSeq)
    animator.start()
}
export {runPresetTip}