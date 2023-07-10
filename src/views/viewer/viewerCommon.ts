
import { reactive, ref, computed } from "vue";
import { StringInstrument } from "@/utils/instrument.js";
import FretChordManager from "@/utils/fretChordManager";
import { ENodeType, EPluginType, NodeUtils } from "@/utils/sheetNode"
import { ELoadState } from "@/utils/common"
import AutoScroll from "./autoScroll.js"

import SheetViewContext from "./sheetViewContext";
import { Chord, FretChord, Key } from "@/utils/chord";

export function useGlobalCss() {
    return reactive({
        "--sheet-font-size": "var(--base-font-size)",
        "--title-base-font-size": "30px",
        "--title-scale": "1",
        "--chord-renderer-theme-color": "white",
        "--chord-renderer-font-color": "black",
        "--sheet-theme-color": "var(--theme-color)",
        "--page-size": "100%",
    })
}

export function useIntrument() {
    let gIntrument = null
    const instrumentConfig = reactive({
        enable: true,
        instrument: {
            type: "Ukulele",
            audioSource: "Oscillator",
            needUpdate: true,
            capo: 0,
        },
        bpm: 120,
        loadState: ELoadState.Loading,
    })

    const intrumentLoadingText = computed(() => {
        switch (instrumentConfig.loadState) {
            case ELoadState.Loading: return "加载中...";
            case ELoadState.Loaded: return "加载完成";
            case ELoadState.Failed: return "音源加载失败，请重试";
            default: return "未知错误：播放器遁入了虚空...";
        }
    })

    const showPlayerLoadCover = computed(() => {
        return instrumentConfig.loadState != ELoadState.Loaded;
    })
    
    const capoName = computed(() => {
        let capo = instrumentConfig.instrument.capo
        if (capo == 0) return "无"
        else return `${capo}品`
    })

    function loadInstrument() {
        if (instrumentConfig.instrument.needUpdate) {
            let callbacks = {
                onLoadStart: function () {
                    instrumentConfig.loadState = ELoadState.Loading
                },
                onLoaded: function () {
                    instrumentConfig.loadState = ELoadState.Loaded
                },
                onFailed: function () {
                    instrumentConfig.loadState = ELoadState.Failed
                }
            }

            gIntrument = new StringInstrument(instrumentConfig.instrument.type, instrumentConfig.instrument.audioSource, callbacks)

            instrumentConfig.instrument.needUpdate = false;
        }
    }

    function playChord(chord) {
        const capo = Math.trunc(instrumentConfig.instrument.capo) ?? 0

        const bpm = instrumentConfig.bpm;
        let volume = 1.0;

        // play chord
        let duration = (1 / bpm) * 60 * 4;
        if (gIntrument && gIntrument.audioSource.loaded) {
            gIntrument.setCapo(capo);
            gIntrument.playChord(chord, volume, duration);
        }
    }

    return {
        instrumentConfig,
        intrumentLoadingText,
        showPlayerLoadCover,
        capoName,
        loadInstrument,
        playChord
    }
}

export function useSheetLayout() {
    const sheetLayoutConfig = reactive({
        enable: true,
        scale: 1.0,
        autoScrollSpeed: 0.0
    })

    const autoScrollSpeedText = computed(() => {
        let speed = sheetLayoutConfig.autoScrollSpeed
        return speed > 0 ? `x${speed.toFixed(1)}` : "停止"
    })

    function updateAutoScrollSpeed() {
        let speed = sheetLayoutConfig.autoScrollSpeed
        AutoScroll.setSpeed(speed)
    }

    return {
        sheetLayoutConfig,
        autoScrollSpeedText,
        updateAutoScrollSpeed
    }
}

export function useTipChord() {
    const tipChord = reactive({
        enable: true,
        show: false,
        chord: Chord.createFromString("C")
    })

    function tryFindFretChord(chord: Chord): FretChord | Chord {
        if (!chord) return undefined;
        let fretChord = FretChordManager.getFretChord(chord)
        if (fretChord) return fretChord;
        return chord;
    }

    return {
        tipChord,
        tryFindFretChord
    }
}

export function useSheet() {
    const loadState = ref(ELoadState.Loading)
    const sheet = reactive(new SheetViewContext())

    function shiftKey(offset: number) {
        let curKey = sheet.meta.sheetKey;
        let newKey = curKey.shift(offset)
        sheet.meta.sheetKey = newKey
        NodeUtils.traverseDFS(sheet.root, (node) => {
            if (node.type == ENodeType.Chord || node.type == ENodeType.ChordPure) {
                node.chord = node.chord.shiftKey(offset)
            } else if (node.type == ENodeType.Plugin && node.pluginType == EPluginType.Tab) {
                node.valid = Key.isEqual(sheet.originalSheetKey, sheet.meta.sheetKey);
            }
        })
    }

    return {
        loadState,
        sheet,
        shiftKey
    }
}