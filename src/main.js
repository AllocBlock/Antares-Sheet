import { createApp } from 'vue'
import App from './App.vue'
import SheetNodeUnderline from '@/components/antaresSheet/underline.vue'
import SheetNodeGeneral from '@/components/antaresSheet/general.vue'
import router from './router'
import { createPinia } from 'pinia'

const app = createApp(App).use(router)
const pinia = createPinia()
app.use(router)
app.use(pinia)
app.component("SheetNodeGeneral", SheetNodeGeneral)
app.component("SheetNodeUnderline", SheetNodeUnderline)
app.mount('#app')
