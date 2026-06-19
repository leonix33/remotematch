<script setup>
import { onMounted, ref } from 'vue';
import http from '../api/http';

const users = ref([]);
const loading = ref(true);
const error = ref('');
const form = ref({ name: '', email: '', password: '', role: 'user' });

async function load() {
  loading.value = true;
  try {
    const { data } = await http.get('/users');
    users.value = data;
  } finally {
    loading.value = false;
  }
}

async function createUser() {
  error.value = '';
  try {
    await http.post('/users', form.value);
    form.value = { name: '', email: '', password: '', role: 'user' };
    await load();
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not create user';
  }
}

onMounted(load);
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold">Users</h2>
    <p class="mt-1 text-slate-400">Admin-only user management</p>

    <form class="card mt-8 grid gap-4 p-6 sm:grid-cols-2" @submit.prevent="createUser">
      <input v-model="form.name" required class="input" placeholder="Full name" />
      <input v-model="form.email" type="email" required class="input" placeholder="Email" />
      <input v-model="form.password" type="password" required minlength="8" class="input" placeholder="Password (8+ chars)" />
      <select v-model="form.role" class="input">
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
      <p v-if="error" class="sm:col-span-2 text-sm text-red-300">{{ error }}</p>
      <button type="submit" class="btn-primary sm:col-span-2 sm:w-auto">Create user</button>
    </form>

    <div v-if="loading" class="mt-8 text-slate-400">Loading…</div>
    <div v-else class="mt-8 overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-slate-700 text-slate-400">
            <th class="py-3">Name</th>
            <th class="py-3">Email</th>
            <th class="py-3">Role</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u._id || u.id" class="border-b border-slate-800">
            <td class="py-3 text-slate-200">{{ u.name }}</td>
            <td class="py-3 text-slate-400">{{ u.email }}</td>
            <td class="py-3"><span class="badge badge-teal">{{ u.role }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
