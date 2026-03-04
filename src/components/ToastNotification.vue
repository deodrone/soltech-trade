<template>
  <teleport to="body">
    <div class="toast-container">
      <transition-group name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', `toast--${toast.type}`]"
        >
          <span class="toast-icon">{{ icons[toast.type] }}</span>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" @click="dismiss(toast.id)">✕</button>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script>
import { useToast } from '../composables/useToast';

export default {
  name: 'ToastNotification',
  setup() {
    const { toasts, dismiss } = useToast();
    const icons = { info: 'ℹ', success: '✓', warning: '⚠', error: '✕' };
    return { toasts, dismiss, icons };
  }
};
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 9999;
}
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  min-width: 280px;
  max-width: 400px;
  font-size: 0.9rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  border: 1px solid transparent;
}
.toast--info    { background: #1c2b3a; border-color: #58a6ff; color: #58a6ff; }
.toast--success { background: #1a2e1a; border-color: #3fb950; color: #3fb950; }
.toast--warning { background: #2e2416; border-color: #d29922; color: #d29922; }
.toast--error   { background: #2e1a1a; border-color: #f85149; color: #f85149; }
.toast-icon { font-size: 1rem; flex-shrink: 0; }
.toast-message { flex: 1; color: #e6edf3; }
.toast-close {
  background: none;
  border: none;
  color: #8b949e;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0;
  line-height: 1;
}
.toast-close:hover { color: #e6edf3; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from { opacity: 0; transform: translateX(40px); }
.toast-leave-to   { opacity: 0; transform: translateX(40px); }
</style>
