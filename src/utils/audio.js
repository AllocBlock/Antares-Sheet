export function loadFileBuffer(url) {
    return new Promise(function(resolve, reject){
        fetch(url).then(result => result.blob()).then(blob => {
            var reader = new FileReader()
            reader.onloadend = ()=>{
                resolve(reader.result)
            }
            reader.readAsArrayBuffer(blob)
        }).catch((e) => reject(e))
    })
}