import { createApp } from 'vue'
import App from './App.vue'
import SheetViewer from './views/sheetViewer'
import SheetNodeUnderline from '@/components/webSheet/underline'
import SheetNodeGeneral from '@/components/webSheet/general'

const app = createApp(SheetViewer)
app.component("SheetNodeGeneral", SheetNodeGeneral)
app.component("SheetNodeUnderline", SheetNodeUnderline)
app.mount('#app')
