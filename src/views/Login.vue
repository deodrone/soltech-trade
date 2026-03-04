<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>{{ isRegister ? 'Create Account' : 'Sign In' }}</h2>

      <form @submit.prevent="handleSubmit">
        <div v-if="error" class="error-msg">{{ error }}</div>

        <label>Email</label>
        <input v-model="email" type="email" placeholder="you@example.com" required />

        <label>Password</label>
        <input v-model="password" type="password" placeholder="••••••••" required />

        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Please wait...' : (isRegister ? 'Register' : 'Sign In') }}
        </button>
      </form>

      <div class="divider">or</div>

      <button @click="handleGoogle" :disabled="loading" class="btn-google">
        Continue with Google
      </button>

      <p class="toggle">
        {{ isRegister ? 'Already have an account?' : "Don't have an account?" }}
        <span @click="isRegister = !isRegister">
          {{ isRegister ? 'Sign In' : 'Register' }}
        </span>
      </p>
    </div>
  </div>
</template>

<script>
import { useAuth } from '../composables/useAuth';
import { useToast } from '../composables/useToast';
import { useRouter, useRoute } from 'vue-router';
import { ref } from 'vue';

export default {
  name: 'LoginView',
  setup() {
    const { login, register, loginWithGoogle } = useAuth();
    const { show } = useToast();
    const router = useRouter();
    const route = useRoute();

    const email = ref('');
    const password = ref('');
    const isRegister = ref(false);
    const loading = ref(false);
    const error = ref('');

    const redirect = () => router.push(route.query.redirect || '/dashboard');

    const handleSubmit = async () => {
      error.value = '';
      loading.value = true;
      try {
        if (isRegister.value) {
          await register(email.value, password.value);
          show({ message: 'Account created! Welcome to Soltech-Trade.', type: 'success' });
        } else {
          await login(email.value, password.value);
          show({ message: 'Welcome back!', type: 'success' });
        }
        redirect();
      } catch (e) {
        const message = e.message.replace('Firebase: ', '');
        error.value = message;
        show({ message, type: 'error' });
      } finally {
        loading.value = false;
      }
    };

    const handleGoogle = async () => {
      error.value = '';
      loading.value = true;
      try {
        await loginWithGoogle();
        show({ message: 'Welcome back!', type: 'success' });
        redirect();
      } catch (e) {
        const message = e.message.replace('Firebase: ', '');
        error.value = message;
        show({ message, type: 'error' });
      } finally {
        loading.value = false;
      }
    };

    return { email, password, isRegister, loading, error, handleSubmit, handleGoogle };
  }
};
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 60px);
}
.auth-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 10px;
  padding: 36px;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
h2 { color: #58a6ff; text-align: center; }
form { display: flex; flex-direction: column; gap: 10px; }
label { font-size: 0.85rem; color: #8b949e; }
input {
  padding: 10px 12px;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  color: #e6edf3;
  font-size: 0.95rem;
}
input:focus { outline: none; border-color: #58a6ff; }
.btn-primary {
  margin-top: 6px;
  padding: 10px;
  background: #238636;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
}
.btn-primary:hover:not(:disabled) { background: #2ea043; }
.btn-google {
  padding: 10px;
  background: #21262d;
  color: #e6edf3;
  border: 1px solid #30363d;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
}
.btn-google:hover:not(:disabled) { background: #30363d; }
button:disabled { opacity: 0.6; cursor: not-allowed; }
.divider { text-align: center; color: #8b949e; font-size: 0.85rem; }
.error-msg {
  background: rgba(248, 81, 73, 0.1);
  border: 1px solid #f85149;
  color: #f85149;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
}
.toggle { text-align: center; color: #8b949e; font-size: 0.85rem; }
.toggle span { color: #58a6ff; cursor: pointer; }
.toggle span:hover { text-decoration: underline; }
</style>
