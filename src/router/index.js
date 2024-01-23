import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/views/index.vue'
import SheetViewer from '@/views/viewer/index.vue'
import SheetEditor from '@/views/editor/index.vue'
import UserProject from '@/views/user/project.vue'
import UserSpace from '@/views/user/space.vue'
import NotFound from '@/views/404.vue'

const routes = [
  {
    path: '/',
    name: 'Index',
    component: Index
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
    path: '/user/project',
    name: 'Project',
    component: UserProject
  },
  {
    path: '/user/space',
    name: 'Space',
    component: UserSpace
  },
  {
    path: "/:catchAll(.*)",
    name: 'NotFound',
    component: NotFound
  },
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

export default router
