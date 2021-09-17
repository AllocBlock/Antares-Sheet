const ResourceDir = "../resources/"

function getQueryVariable(key) {
    var query = window.location.search.substring(1)
    var vars = query.split("&")
    for (var pairStr of vars) {
        var pair = pairStr.split("=", 2)
        if (pair[0] == key)
            return decodeURI(pair[1])
    }
    return null
}

export {ResourceDir, getQueryVariable}