import { createApp } from 'vue'
import App from './App.vue'
import SheetNodeUnderline from '@/components/antaresSheet/underline.vue'
import SheetNodeGeneral from '@/components/antaresSheet/general.vue'
import router from './router'

const app = createApp(App).use(router)
app.use(router)
app.component("SheetNodeGeneral", SheetNodeGeneral)
app.component("SheetNodeUnderline", SheetNodeUnderline)
app.mount('#app')
