<script setup>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { mobileMoreSections } from '../utils/navigation';

defineProps({
  open: { type: Boolean, default: false },
});

const emit = defineEmits(['close']);

const route = useRoute();
const auth = useAuthStore();

const sections = computed(() =>
  mobileMoreSections.filter((section) => !section.adminOnly || auth.isAdmin)
);

function isActive(item) {
  if (item.exact) return route.path === item.to;
  return route.path === item.to || route.path.startsWith(`${item.to}/`);
}

function pick() {
  emit('close');
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="mobile-more-overlay lg:hidden" @click.self="emit('close')">
      <div class="mobile-more-sheet safe-bottom" role="dialog" aria-label="More navigation">
        <div class="mobile-more-handle" aria-hidden="true" />
        <div class="flex items-center justify-between gap-3 px-4 pb-3 pt-2">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-200">All features</p>
            <p class="truncate text-xs text-slate-500">{{ auth.user?.name }} · {{ auth.user?.role }}</p>
          </div>
          <button type="button" class="btn-secondary min-h-[44px] shrink-0 px-4 text-sm" @click="emit('close')">
            Done
          </button>
        </div>
        <nav class="custom-scrollbar max-h-[min(72dvh,34rem)] overflow-y-auto px-3 pb-4">
          <section v-for="section in sections" :key="section.title" class="mb-4">
            <p class="mobile-more-section-label">{{ section.title }}</p>
            <div class="mobile-more-nav">
              <RouterLink
                v-for="item in section.items"
                :key="item.to"
                :to="item.to"
                class="mobile-more-link"
                :class="isActive(item) ? 'mobile-more-link-active' : ''"
                @click="pick"
              >
                <span class="mobile-more-link-icon">{{ item.icon }}</span>
                <span class="truncate">{{ item.label }}</span>
              </RouterLink>
            </div>
          </section>
          <div class="mt-2 flex flex-wrap gap-3 border-t border-slate-800/80 px-1 pt-3 text-[11px] text-slate-600">
            <RouterLink to="/privacy" class="hover:text-teal-400" @click="pick">Privacy</RouterLink>
            <RouterLink to="/terms" class="hover:text-teal-400" @click="pick">Terms</RouterLink>
          </div>
        </nav>
      </div>
    </div>
  </Teleport>
</template>
