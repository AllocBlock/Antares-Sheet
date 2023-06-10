import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/views/index.vue'
import Test from '@/views/test.vue'
import SheetViewer from '@/views/viewer/index.vue'
import SheetEditor from '@/views/editor/index.vue'
import UserProject from '@/views/user/project.vue'
import UserSpace from '@/views/user/space.vue'

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
    path: "/:catchAll(.*)w",
    name: 'Redirect',
    component: Index
  },
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

export default router
