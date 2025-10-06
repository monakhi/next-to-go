import { createRouter, createWebHistory } from 'vue-router'
import NextToGoPage from '@/views/NextToGoPage.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{ path: '/', name: 'home', component: NextToGoPage }],
})
