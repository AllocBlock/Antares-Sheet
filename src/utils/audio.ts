import { LoadCallback } from "./common"

export function loadFileBuffer(url) : Promise<ArrayBuffer> {
    return new Promise(function (resolve, reject) {
        fetch(url).then(result => result.blob()).then(blob => {
            let reader = new FileReader()
            reader.onloadend = () => {
                resolve(reader.result as ArrayBuffer)
            }
            reader.readAsArrayBuffer(blob)
        }).catch((e) => reject(e))
    })
}

export async function loadAudioFile(url, audioContext : AudioContext= null) : Promise<AudioBuffer> {
    if (!audioContext)
        audioContext = new AudioContext()

    let buffer = await loadFileBuffer(url)
    let audioBuffer = await audioContext.decodeAudioData(buffer)
    return audioBuffer
}