function convertXXX(xxx) {
    xxx = xxx.replace(/(\r|\n|\r\n)+/g, "\n") // 格式化换行符，并删除空行

    let index = xxx.indexOf("::")

    let info = xxx.slice(index + 2)
    let [chordsStr, rhythmsStr, sheetInfoStr] = info.split("::")
    let chrods = chordsStr.split("/*/")
    let rhythms = rhythmsStr.split("/*/")
    let [name, singer, fontsize, upper, originalKey, sheetKey, unknown, offsetX, offsetY, page] = sheetInfoStr.split("/*/")

    let sheetBody = xxx.slice(0, index)
    sheetBody = sheetBody.replace(/\/\*\//g, "") // 分页符号，删除
    sheetBody = sheetBody.replace(/\[([^\]]*)\]/g, "!($1)")
    sheetBody = sheetBody.replace(/\<([^>]*)_\>([^<>]*?)\<([^>]*)_\>([^<>])([^<>]*?)\<([^>]*)\>\n/g, "{{<$1>$2<$3>$4}$5<$6>\n}") // <a_>bbbb<c_>dddd<e>\n
    sheetBody = sheetBody.replace(/\<([^>]*)_\>([^<>]*?)\<([^>]*)_\>([^<>])([^<>]*?)\<([^>]*)\>(.)/g, "{{<$1>$2<$3>$4}$5<$6>$7}") // <a_>bbbb<c_>dddd<e>f\n
    sheetBody = sheetBody.replace(/\<([^>]*)_\>([^<>]*?)\<([^>]*)\>\n/g, "{<$1>$2<$3> \n}") // <a_>bbbb<c>\n
    sheetBody = sheetBody.replace(/\<([^>]*)_\>([^<>]*?)\<([^>]*)\>(.)/g, "{<$1>$2<$3>$4}") // <a_>bbb<c>d
    sheetBody = sheetBody.replace(/\<([^>]*)\>\+/g, "![$1]")
    sheetBody = sheetBody.replace(/\<([^>]*)\> /g, "[$1]_")
    sheetBody = sheetBody.replace(/\<([^>]*)\>\n/g, "[$1]_\n")
    sheetBody = sheetBody.replace(/\<([^>]*)\>(.)/g, "[$1]$2")

    let matchResult = null
    while(matchResult = sheetBody.match(/{(([^}]*\!\[[^\]]*]\][^}]*\[[^\]]*\][^}]*)|(([^}]*\[[^\]]*\][^}]*\!\[[^\]]*\][^}]*)))}/)) { // 一个下划线内既有chord又有chord_pure，全部变成chord，并且删除空的chord_pure
        let underlineStr = matchResult[0]
        underlineStr = underlineStr.replace(/\!(\[\])/g, "")
        underlineStr = underlineStr.replace(/\!(\[.*\])/g, "$1 ")
        sheetBody = sheetBody.replace(matchResult[0], underlineStr)
    }
    sheetBody = sheetBody.replace(/({[^}]*\![^}]*})/g, "!$1") // 内部有chord_pure，改成下横线（比较暴力，没有匹配括号，先用着吧

    let sheetChordsStr = ""
    for(let chord of chrods) {
        if (chord.length) sheetChordsStr += chord + " "
    }
    let sheetHead = `$title ${name}
$singer ${singer}
$by ${upper}
$originalKey ${originalKey}
$sheetKey ${sheetKey}
$chords ${sheetChordsStr}
`
    let sheet = sheetHead + sheetBody

    return sheet;
}

export {convertXXX}