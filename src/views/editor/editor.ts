

import SheetMeta from "@/utils/sheetMeta";
import { NodeUtils, SheetNode } from "@/utils/sheetNode";
import SheetEditorCore from "./editorCore";
import { parseSheet } from "@/utils/sheetParser";
import { Chord, Key } from "@/utils/chord";
import { generateSheetText } from "@/utils/sheetWriter";

export class SheetEditor {
  core : SheetEditorCore
  root : SheetNode
  meta : SheetMeta

  constructor(meta : SheetMeta, root : SheetNode) {
    this.core = new SheetEditorCore(meta, root)
    this.meta = meta
    this.root = root
  }
  
  clearSheet() {
    this.meta.reset()
  
    this.core.pauseHistory()
    this.core.clearSheet()
  
    // 初始文本
    NodeUtils.append(this.root, NodeUtils.createTextNodes("歌词"))
    NodeUtils.append(this.root, NodeUtils.createNewLineNode())
    this.core.resumeHistory(true)
  }
  
  loadSheet(sheetText) {
    let [meta, root] = parseSheet(sheetText)
    this.meta.assign(meta)
    this.root.children = root.children // FIXME: reactive or not?
    NodeUtils.validateSheetTree(root)
    NodeUtils.toEditingSheetTree(root);
    if (!root) {
      throw "曲谱解析失败！";
    }
    this.meta.assign(meta)
    this.core.replaceSheet(root, true)
  
    
    console.log("已加载曲谱：", meta, root);
  }

    
  getSheetString(attachedChords : Chord[]) {
    return generateSheetText(this.root, this.meta, attachedChords)
  }
    
  saveSheetToFile(attachedChords : Chord[]) {
    // TODO: remove un used chord?
    let fileData = this.getSheetString(attachedChords)
    let time = new Date().toLocaleDateString().replace(/\//g, "_")

    let blob = new Blob([fileData], { type: 'text/plain' })
    let download = document.createElement("a");
    download.href = window.URL.createObjectURL(blob)
    download.setAttribute('download', `${this.meta.title}-${this.meta.singer}-${time}.atrs`)
    download.click()
    download.remove()
  }

  
  loadSheetFromFile() {
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = ".atrs"
    input.onchange = e => {
      let file = (e.target as HTMLInputElement).files[0];
      let fileReader = new FileReader()
      fileReader.onload = () => this.loadSheet(fileReader.result)
      fileReader.readAsText(file)
    }
    input.click();
    input.remove()
  }
  
  editContent(node : SheetNode) {
    if (!node) throw "节点为空"
  
    let newContent = prompt("编辑内容", node.content);
    if (!newContent) return;
    this.core.updateContent(node, newContent)
    NodeUtils.validateSheetTree(this.root)
  }
  remove(node : SheetNode) {
    this.core.remove(node);
  }
  removeUnderline(node : SheetNode) {
    this.core.removeUnderlineOnChord(node);
    NodeUtils.validateSheetTree(this.root)
  }
  recoverChord(node : SheetNode) {
    this.core.convertChordToText(node);
  }
  toggleChordType(node : SheetNode) {
    this.core.toggleChordType(node)
  }
  addUnderline(node : SheetNode) {
    this.core.addUnderlineForChord(node);
  }
  
  insert(node : SheetNode, type : string, insertBefore) { // TODO: type to enum
    this.core.insert(node, type, insertBefore)
  }

  // undo, redo
  canUndo() { return this.core.canUndo() }
  canRedo() { return this.core.canRedo() }
  undo() { return this.core.undo() }
  redo() { return this.core.redo() }

  // other
  setKey(newKey : Key, shiftChord : boolean) { return this.core.setKey(newKey, shiftChord) }
  setSheet(meta : SheetMeta, root : SheetNode) {
    this.core.setMeta(meta)
    this.core.replaceSheet(root) 
  }
}