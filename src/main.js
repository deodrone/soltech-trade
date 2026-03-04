import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { useAuth } from './composables/useAuth';

const { watchAuthState } = useAuth();
watchAuthState();

createApp(App).use(router).use(store).mount('#app');
