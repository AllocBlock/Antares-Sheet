import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/views/index.vue'
import SheetViewer from '@/views/viewer/index.vue'
import SheetEditor from '@/views/editor/index.vue'
import UserProject from '@/views/user/project.vue'
import UserSpace from '@/views/user/space.vue'
import ImgSheetList from '@/views/imgSheet/index.vue'
import ImgSheetViewer from '@/views/imgSheet/viewer.vue'

const routes = [
  {
    path: '/',
    name: 'Index',
    component: UserSpace
  },
  {
    path: '/sheet',
    name: 'SheetViewer',
    component: SheetViewer
  },
  {
    path: '/user/space',
    name: 'Space',
    component: UserSpace
  },
  {
    path: '/imgSheetList',
    name: 'ImgSheetList',
    component: ImgSheetList
  },
  {
    path: '/imgSheet',
    name: 'ImgSheet',
    component: ImgSheetViewer
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
