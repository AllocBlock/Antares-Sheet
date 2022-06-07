import { createApp } from 'vue'
import App from './App.vue'
import SheetNodeUnderline from '@/components/antaresSheet/underline.vue'
import SheetNodeGeneral from '@/components/antaresSheet/general.vue'
import Toast from '@/components/toast.vue'
import router from './router'

const app = createApp(App).use(router)
app.use(router)
app.component("SheetNodeGeneral", SheetNodeGeneral)
app.component("SheetNodeUnderline", SheetNodeUnderline)
// 注册全局Toast
app.config.globalProperties.$toast = function(text, duration = 1.0) {
  let root = null
  let toast = null
  toast = createApp(Toast, { text, duration, callbackDestroy: () => {
    console.log("toast destroyed")
    toast.unmount()
    root.remove()
  }})

  root = document.createElement('div');
  document.querySelector('body')?.appendChild(root);
  toast.mount(root);
}
app.mount('#app')
