import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from "path"

const customTags = [
  "tab-box",
  "bar",
  "bar-number",
  "bar-split",
  "notes",
  "clef",
  "note",
  "note-element",
  "note-fret-stem",
  "note-fret-empty",
  "note-fret",
  "note-stem",
  "note-flag",
  "note-flag-connect",
  "repeat",
  "row",
  "bg-lines",
  "bg-line",
  "row-split",
  "note-stum",
  "time-signature",
  "chord",
  "chord-pure",
  "chord-body",
  "chord-ruby",
  "chord-name",
  "chord-key",
  "chord-suffix",
  "info",
  "underline",
  "underline-pure",
  "text",
  "newline"
]

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true
  },
  plugins: [vue({
    template: {
      compilerOptions: {
        isCustomElement: (tag) => customTags.includes(tag)
      }
    }
  })],
  base: '',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  }
})