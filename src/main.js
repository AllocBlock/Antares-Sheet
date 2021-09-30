import { createApp } from 'vue'
import App from './App.vue'
import SheetNodeUnderline from '@/components/sheet/underline'
import SheetNodeGeneral from '@/components/sheet/general'

const app = createApp(App)
app.component("SheetNodeGeneral", SheetNodeGeneral)
app.component("SheetNodeUnderline", SheetNodeUnderline)
app.mount('#app')
