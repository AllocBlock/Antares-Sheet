import { NodeEventList, ToolChordEvent } from "@/utils/elementEvent"

export abstract class EditorMode {
    isHotkeyEnable: boolean = true
    nodeEventList: NodeEventList = new NodeEventList()
    toolChordEvents: ToolChordEvent = new ToolChordEvent()

    enableHotkey() {
        this.isHotkeyEnable = true
    }

    disableHotkey() {
        this.isHotkeyEnable = false
    }

    abstract hook();
    abstract release();

    abstract getTip(): string;
}

export class EditorModeCombined extends EditorMode {
    editorModes: EditorMode[]
    tip: string = ''

    constructor(editorModes: EditorMode[], tip = null) {
        super()
        this.editorModes = editorModes

        this.tip = tip ?? editorModes.map(mode => mode.getTip()).join("\n");
        for (let mode of editorModes) {
            this.nodeEventList.append(mode.nodeEventList)
            this.toolChordEvents.append(mode.toolChordEvents)
        }
    }

    enableHotkey() {
        this.isHotkeyEnable = true
        for (let editorMode of this.editorModes) {
            editorMode.isHotkeyEnable = true
        }
    }

    disableHotkey() {
        for (let editorMode of this.editorModes) {
            editorMode.isHotkeyEnable = false
        }
    }

    hook() {
        for (let editorMode of this.editorModes) {
            editorMode.hook()
        }
    }
    release() {
        for (let editorMode of this.editorModes) {
            editorMode.release()
        }
    }
    getTip() { return this.tip; }
}