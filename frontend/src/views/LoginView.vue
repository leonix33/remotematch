<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter, useRoute, RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useProfileStore } from '../stores/profile';
import http from '../api/http';
import AppLogo from '../components/AppLogo.vue';
import { brand } from '../brand';
import {
  biometricLabel,
  loginWithPasskey,
  rememberLoginEmail,
  recalledLoginEmail,
  supportsBiometricLogin,
} from '../composables/usePasskey';

const email = ref('');
const password = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const error = ref('');
const info = ref('');
const loading = ref(false);
const bioLoading = ref(false);
const mode = ref('login');
const resetToken = ref('');
const showBiometric = ref(false);
const bioLabel = computed(() => biometricLabel());

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const profileStore = useProfileStore();

async function afterAuth() {
  if (!profileStore.profile?.onboardingComplete) {
    await router.push('/onboarding');
  } else {
    await router.push('/');
  }
}

onMounted(async () => {
  const token = typeof route.query.reset === 'string' ? route.query.reset : '';
  if (token) {
    resetToken.value = token;
    mode.value = 'reset';
    info.value = 'Choose a new password for your account.';
  }
  email.value = recalledLoginEmail();
  showBiometric.value = await supportsBiometricLogin();
});

async function submitLogin() {
  error.value = '';
  info.value = '';
  loading.value = true;
  try {
    await auth.login(email.value.trim(), password.value);
    rememberLoginEmail(email.value);
    await afterAuth();
  } catch (e) {
    const status = e.response?.status;
    const msg = e.response?.data?.message || e.message || 'Login failed';
    if (status === 404) {
      error.value = 'API not reachable. Wait for deploy to finish, then hard-refresh.';
    } else {
      error.value = msg;
    }
  } finally {
    loading.value = false;
  }
}

async function submitBiometric() {
  error.value = '';
  info.value = '';
  if (!email.value.trim()) {
    error.value = 'Enter your email above, then use Face ID.';
    return;
  }
  bioLoading.value = true;
  try {
    const data = await loginWithPasskey(email.value);
    await auth.loginWithPasskey(data);
    await afterAuth();
  } catch (e) {
    if (e.name === 'NotAllowedError') {
      error.value = `${bioLabel.value} was cancelled. Try again or use your password.`;
    } else {
      error.value = e.response?.data?.message || e.message || `${bioLabel.value} sign-in failed`;
    }
  } finally {
    bioLoading.value = false;
  }
}

async function submitForgot() {
  error.value = '';
  info.value = '';
  loading.value = true;
  try {
    const { data } = await http.post('/auth/forgot-password', { email: email.value.trim() });
    info.value = data.message;
    if (data.emailSent === false) {
      error.value = data.message;
      info.value = '';
    }
    mode.value = 'login';
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not send reset email';
  } finally {
    loading.value = false;
  }
}

async function submitReset() {
  error.value = '';
  info.value = '';
  if (newPassword.value.trim() !== confirmPassword.value.trim()) {
    error.value = 'Passwords do not match';
    return;
  }
  loading.value = true;
  try {
    const { data } = await http.post('/auth/reset-password', {
      token: resetToken.value,
      newPassword: newPassword.value.trim(),
    });
    info.value = data.message;
    mode.value = 'login';
    resetToken.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    router.replace({ path: '/login', query: {} });
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not reset password';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen min-h-dvh items-center justify-center safe-top safe-bottom safe-x p-4">
    <div class="card w-full max-w-md p-6 sm:p-8">
      <AppLogo size="lg" />
      <p class="mt-4 text-sm text-slate-400">{{ brand.tagline }}</p>

      <!-- Login -->
      <form v-if="mode === 'login'" class="mt-8 space-y-4" @submit.prevent="submitLogin">
        <div>
          <label class="mb-1 block text-sm text-slate-400">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="input"
            placeholder="you@example.com"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
          />
        </div>
        <div>
          <div class="mb-1 flex items-center justify-between">
            <label class="text-sm text-slate-400">Password</label>
            <button type="button" class="text-xs text-teal-400 hover:underline" @click="mode = 'forgot'; error = ''; info = ''">
              Forgot password?
            </button>
          </div>
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="input"
            placeholder="8+ characters"
            autocomplete="current-password"
          />
        </div>
        <p v-if="error" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{{ error }}</p>
        <p v-if="info" class="rounded-lg bg-teal-500/10 px-3 py-2 text-sm text-teal-200">{{ info }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="loading || bioLoading">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
        <button
          v-if="showBiometric"
          type="button"
          class="btn-secondary w-full flex items-center justify-center gap-2"
          :disabled="loading || bioLoading"
          @click="submitBiometric"
        >
          <span aria-hidden="true">{{ bioLabel === 'Face ID' ? '🔐' : '👆' }}</span>
          {{ bioLoading ? `Checking ${bioLabel}…` : `Sign in with ${bioLabel}` }}
        </button>
        <p v-if="showBiometric" class="text-center text-xs text-slate-500">
          Set up {{ bioLabel }} in Profile after your first password sign-in.
        </p>
      </form>

      <!-- Forgot password -->
      <form v-else-if="mode === 'forgot'" class="mt-8 space-y-4" @submit.prevent="submitForgot">
        <h2 class="text-lg font-semibold text-slate-100">Reset your password</h2>
        <p class="text-sm text-slate-500">
          We'll email you a link to choose a new password. Check <strong class="text-slate-300">Spam</strong> and
          <strong class="text-slate-300">Promotions</strong> if it does not arrive within a couple of minutes.
        </p>
        <div>
          <label class="mb-1 block text-sm text-slate-400">Email</label>
          <input v-model="email" type="email" required class="input" placeholder="you@example.com" autocomplete="username" />
        </div>
        <p v-if="error" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Sending…' : 'Email reset link' }}
        </button>
        <button type="button" class="btn-secondary w-full" @click="mode = 'login'; error = ''">Back to sign in</button>
      </form>

      <!-- New password from email link -->
      <form v-else class="mt-8 space-y-4" @submit.prevent="submitReset">
        <h2 class="text-lg font-semibold text-slate-100">Choose a new password</h2>
        <p v-if="info" class="text-sm text-slate-500">{{ info }}</p>
        <input v-model="newPassword" type="password" required minlength="8" class="input" placeholder="New password (8+ chars)" autocomplete="new-password" />
        <input v-model="confirmPassword" type="password" required minlength="8" class="input" placeholder="Confirm new password" autocomplete="new-password" />
        <p v-if="error" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{{ error }}</p>
        <p v-if="info && !error" class="rounded-lg bg-teal-500/10 px-3 py-2 text-sm text-teal-200">{{ info }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Saving…' : 'Save new password' }}
        </button>
        <button type="button" class="btn-secondary w-full" @click="mode = 'login'; error = ''; info = ''">Back to sign in</button>
      </form>

      <p class="mt-6 text-center text-xs text-slate-500">Invite-only access · Admin creates accounts</p>
      <p class="mt-3 text-center text-xs text-slate-600">
        Tap <strong class="text-teal-400">Install · Share URL</strong> on the right to add remotelymatch or copy the link.
      </p>
      <p class="mt-3 text-center text-xs text-slate-600">
        <RouterLink to="/privacy" class="text-teal-500 hover:underline">Privacy</RouterLink>
        ·
        <RouterLink to="/terms" class="text-teal-500 hover:underline">Terms</RouterLink>
      </p>
      <p class="mt-3 text-center text-sm">
        <RouterLink to="/welcome" class="text-teal-400 hover:underline">← Back to home</RouterLink>
      </p>
    </div>
  </div>
</template>
