import { createRouter, createWebHashHistory } from 'vue-router'
import LandingPage from '@/ui/pages/LandingPage.vue'
import NotFoundPage from '@/ui/pages/NotFoundPage.vue'

const routes = [
  { path: '/', name: 'landing', component: LandingPage },
  { path: '/quiz/:quizId', name: 'quiz', component: () => import('@/ui/pages/QuizPage.vue') },
  { path: '/:pathMatch(.*)*', name: 'notFound', component: NotFoundPage },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
