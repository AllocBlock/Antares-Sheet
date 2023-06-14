import { assert } from "./assert";

export class LineReader {
    data : string;
    lines: string[];
    index: number;

    constructor(data : string) {
        this.data = data
        this.index = 0
        this.lines = data.split("\n")
    }

    isEnd() {
        return this.index >= this.lines.length
    }

    pop() : string {
        assert(!this.isEnd(), "already at end of file");
        let line = this.lines[this.index]
        this.index++
        console.log(line)
        return line
    }

    pop_all_remaining(merge : boolean = true) : string | string[] {
        let remainingLines = this.lines.slice(this.index)
        this.index = this.lines.length
        return merge ? remainingLines.join("\n") : remainingLines
    }

    reverse() {
        assert(this.index > 0, "already at first line");
        this.index--
    }
}