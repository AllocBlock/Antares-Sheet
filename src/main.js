import { createApp } from 'vue'
import App from './App.vue'
import SheetNodeUnderline from '@/components/webSheet/underline.vue'
import SheetNodeGeneral from '@/components/webSheet/general.vue'
import router from './router'

const app = createApp(App).use(router)
app.use(router)
app.component("SheetNodeGeneral", SheetNodeGeneral)
app.component("SheetNodeUnderline", SheetNodeUnderline)
app.mount('#app')
