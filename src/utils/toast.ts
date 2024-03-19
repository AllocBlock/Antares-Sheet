import Toast from "@/components/toast.vue"
import { createApp } from "vue"

export default function addToast(text, duration = 1.0) {
    let root = null
    let toast = null
    toast = createApp(Toast, { text, duration, callbackDestroy: () => {
      toast.unmount()
      root.remove()
    }})
  
    root = document.createElement('div');
    document.querySelector('body')?.appendChild(root);
    toast.mount(root);
}