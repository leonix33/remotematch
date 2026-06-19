import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useProfileStore } from '../stores/profile';
import LoginView from '../views/LoginView.vue';
import OnboardingView from '../views/OnboardingView.vue';
import DashboardView from '../views/DashboardView.vue';
import JobsView from '../views/JobsView.vue';
import ApplicationsView from '../views/ApplicationsView.vue';
import GeneratorView from '../views/GeneratorView.vue';
import AgentView from '../views/AgentView.vue';
import AnalyticsView from '../views/AnalyticsView.vue';
import UsersView from '../views/UsersView.vue';
import ProfileView from '../views/ProfileView.vue';
import ApprovalsView from '../views/ApprovalsView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginView, meta: { guest: true } },
    { path: '/onboarding', component: OnboardingView, meta: { requiresAuth: true, skipOnboarding: true } },
    { path: '/', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/profile', component: ProfileView, meta: { requiresAuth: true, skipOnboarding: true } },
    { path: '/jobs', component: JobsView, meta: { requiresAuth: true } },
    { path: '/approvals', component: ApprovalsView, meta: { requiresAuth: true } },
    { path: '/applications', component: ApplicationsView, meta: { requiresAuth: true } },
    { path: '/generator', component: GeneratorView, meta: { requiresAuth: true } },
    { path: '/agent', component: AgentView, meta: { requiresAuth: true } },
    { path: '/analytics', component: AnalyticsView, meta: { requiresAuth: true } },
    { path: '/users', component: UsersView, meta: { requiresAuth: true, adminOnly: true, skipOnboarding: true } },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.accessToken) return '/login';
  if (to.meta.guest && auth.accessToken) return '/';
  if (to.meta.adminOnly && auth.user?.role !== 'admin') return '/';

  if (auth.accessToken && to.meta.requiresAuth && !to.meta.skipOnboarding) {
    const profileStore = useProfileStore();
    if (!profileStore.loaded) {
      try {
        await profileStore.fetch();
      } catch {
        return true;
      }
    }
    if (!profileStore.complete && !profileStore.profile?.mongoRequired && to.path !== '/onboarding') {
      return '/onboarding';
    }
  }
});

export default router;
