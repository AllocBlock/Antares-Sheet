export class ElementEvent {
    mouseEnters : Function[] = []
    mouseLeaves : Function[] = []
    mouseDowns : Function[] = []
    doubleClicks : Function[] = []
    contentMenus : Function[] = []

    triggerMouseEnter(...args) { this.mouseEnters.forEach(f => f(...args)); }
    triggerMouseLeave(...args) { this.mouseLeaves.forEach(f => f(...args)); }
    triggerMouseDown(...args) { this.mouseDowns.forEach(f => f(...args)); }
    triggerDoubleClick(...args) { this.doubleClicks.forEach(f => f(...args)); }
    triggerContextMenu(...args) { this.contentMenus.forEach(f => f(...args)); }

    append(elementEvent : ElementEvent) {
        this.mouseEnters = this.mouseEnters.concat(elementEvent.mouseEnters)
        this.mouseLeaves = this.mouseLeaves.concat(elementEvent.mouseLeaves)
        this.mouseDowns = this.mouseDowns.concat(elementEvent.mouseDowns)
        this.doubleClicks = this.doubleClicks.concat(elementEvent.doubleClicks)
        this.contentMenus = this.mouseEnters.concat(elementEvent.contentMenus)
    }
}

export class NodeEventList {
    text: ElementEvent = new ElementEvent()
    chord: ElementEvent = new ElementEvent()
    mark: ElementEvent = new ElementEvent()
    newline: ElementEvent = new ElementEvent()

    append(nodeEventList : NodeEventList) {
        this.text.append(nodeEventList.text)
        this.chord.append(nodeEventList.chord)
        this.mark.append(nodeEventList.mark)
        this.newline.append(nodeEventList.newline)
    }
}

export class ToolChordEvent{
    dragStarts : Function[] = []
    
    append(toolChordEvent : ToolChordEvent) {
        this.dragStarts = this.dragStarts.concat(toolChordEvent.dragStarts)
    }

    trigger(e, node) { this.dragStarts.forEach(f => f(e, node)); }
}