import { reactive } from 'vue';

const state = reactive({ toasts: [] });
let nextId = 0;

export function useToast() {
  const show = ({ message, type = 'info', duration = 4000 }) => {
    const id = nextId++;
    state.toasts.push({ id, message, type });
    setTimeout(() => dismiss(id), duration);
  };

  const dismiss = (id) => {
    const index = state.toasts.findIndex((t) => t.id === id);
    if (index !== -1) state.toasts.splice(index, 1);
  };

  return { toasts: state.toasts, show, dismiss };
}
