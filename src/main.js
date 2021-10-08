import { createApp } from 'vue'
import App from './App.vue'
import SheetNodeUnderline from '@/components/webSheet/underline'
import SheetNodeGeneral from '@/components/webSheet/general'
import router from './router'

const app = createApp(App).use(router)
app.use(router)
app.component("SheetNodeGeneral", SheetNodeGeneral)
app.component("SheetNodeUnderline", SheetNodeUnderline)
app.mount('#app')
