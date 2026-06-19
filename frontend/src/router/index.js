import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import JobsView from '../views/JobsView.vue';
import ApplicationsView from '../views/ApplicationsView.vue';
import GeneratorView from '../views/GeneratorView.vue';
import AgentView from '../views/AgentView.vue';
import AnalyticsView from '../views/AnalyticsView.vue';
import UsersView from '../views/UsersView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginView, meta: { guest: true } },
    { path: '/', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/jobs', component: JobsView, meta: { requiresAuth: true } },
    { path: '/applications', component: ApplicationsView, meta: { requiresAuth: true } },
    { path: '/generator', component: GeneratorView, meta: { requiresAuth: true } },
    { path: '/agent', component: AgentView, meta: { requiresAuth: true } },
    { path: '/analytics', component: AnalyticsView, meta: { requiresAuth: true } },
    { path: '/users', component: UsersView, meta: { requiresAuth: true, adminOnly: true } },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.accessToken) return '/login';
  if (to.meta.guest && auth.accessToken) return '/';
  if (to.meta.adminOnly && auth.user?.role !== 'admin') return '/';
});

export default router;
