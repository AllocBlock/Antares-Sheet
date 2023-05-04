import { assert } from "@/utils/assert.js"

export abstract class SheetEditCommand {
    executed : boolean = false

    execute(): void {
        assert(!this.executed);
        this._executeV();
        this.executed = true
    }

    withdraw(): void {
        assert(this.executed);
        this._withdrawV();
        this.executed = false
    }

    abstract _executeV(): void;
    abstract _withdrawV(): void;
}

export class SheetCommandPool {
    commands : SheetEditCommand[] = []
    pos : number = 0 // indicate the index for next inserted command

    execute(command : SheetEditCommand): void {
        command.execute()
        // override previous undoable commands
        if (this.canRedo())
            this.commands.splice(this.pos, this.commands.length - this.pos)
        this.commands.push(command)
        this.pos++
    }

    canUndo(): boolean {
        return this.pos > 0
    }
    canRedo(): boolean {
        return this.pos < this.commands.length
    }

    undo(): void {
        assert(this.canUndo(), "无可撤销的操作")
        this.pos--
        this.commands[this.pos].withdraw()
    }
    redo(): void {
        assert(this.canRedo(), "无可重做的操作")
        this.commands[this.pos].execute()
        this.pos++
    }
}