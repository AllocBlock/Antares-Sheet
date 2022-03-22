import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/views/index.vue'
import Test from '@/views/test.vue'
import SheetViewer from '@/views/viewer'
import SheetEditor from '@/views/editor'

const routes = [
  {
    path: '/',
    name: 'Index',
    component: Index
  },
  {
    path: '/test',
    name: 'Test',
    component: Test
  },
  {
    path: '/sheet',
    name: 'SheetViewer',
    component: SheetViewer
  },
  {
    path: '/editor',
    name: 'SheetEditor',
    component: SheetEditor
  },
  {
    path: "/:catchAll(.*)w",
    name: 'Redirect',
    component: Index
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
