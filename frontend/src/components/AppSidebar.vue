<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import AppLogo from './AppLogo.vue';
import { isProduction, canonicalDomain } from '../config';
import { simpleNav, moreNavSections } from '../utils/navigation';

defineProps({
  onLogout: { type: Function, required: true },
});

const route = useRoute();
const auth = useAuthStore();

const showMore = ref(false);

const moreSections = computed(() => moreNavSections(auth.isAdmin));

const moreItems = computed(() => moreSections.value.flatMap((section) => section.items));

function isActive(item) {
  if (item.exact) return route.path === item.to;
  return route.path === item.to || route.path.startsWith(`${item.to}/`);
}

watch(
  () => route.path,
  () => {
    if (moreItems.value.some((item) => isActive(item))) {
      showMore.value = true;
    }
  },
  { immediate: true }
);
</script>

<template>
  <aside class="sidebar-shell">
    <div class="sidebar-brand">
      <AppLogo size="md" variant="sidebar" />
      <p v-if="isProduction" class="mt-3 truncate text-[10px] tracking-wide text-slate-500">
        {{ canonicalDomain }}
      </p>
    </div>

    <nav class="sidebar-nav custom-scrollbar flex-1 space-y-5 overflow-y-auto pr-1">
      <section class="sidebar-section">
        <p class="sidebar-section-label px-3">Your workflow</p>
        <div class="mt-1 space-y-0.5">
          <RouterLink
            v-for="item in simpleNav"
            :key="item.to"
            :to="item.to"
            class="sidebar-link"
            :class="isActive(item) ? 'sidebar-link-active' : ''"
          >
            <span class="sidebar-link-icon">{{ item.icon }}</span>
            <span class="truncate">{{ item.label }}</span>
          </RouterLink>
        </div>
      </section>

      <section class="sidebar-section">
        <button type="button" class="sidebar-section-header w-full" @click="showMore = !showMore">
          <span class="sidebar-section-label">More</span>
          <span class="sidebar-chevron" :class="showMore ? 'rotate-180' : ''">▾</span>
        </button>
        <div v-show="showMore" class="mt-1 space-y-3">
          <div v-for="section in moreSections" :key="section.title">
            <p
              v-if="moreSections.length > 1"
              class="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600"
            >
              {{ section.title }}
            </p>
            <div class="space-y-0.5">
              <RouterLink
                v-for="item in section.items"
                :key="item.to"
                :to="item.to"
                class="sidebar-link text-sm"
                :class="isActive(item) ? 'sidebar-link-active' : ''"
              >
                <span class="sidebar-link-icon">{{ item.icon }}</span>
                <span class="truncate">{{ item.label }}</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </section>
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-user-card">
        <p class="text-sm font-semibold text-slate-100">{{ auth.user?.name }}</p>
        <p class="mt-0.5 text-xs capitalize text-slate-500">{{ auth.user?.role }}</p>
      </div>
      <div class="flex gap-3 text-[11px] text-slate-600">
        <RouterLink to="/privacy" class="hover:text-teal-400 transition">Privacy</RouterLink>
        <RouterLink to="/terms" class="hover:text-teal-400 transition">Terms</RouterLink>
      </div>
      <button type="button" class="btn-secondary w-full text-sm" @click="onLogout">Logout</button>
    </div>
  </aside>
</template>
