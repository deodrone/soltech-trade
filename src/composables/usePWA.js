import { ref, onMounted, onUnmounted } from 'vue';

const deferredPrompt = ref(null);
const canInstall = ref(false);

// Capture install prompt globally (singleton)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt.value = e;
    canInstall.value = true;
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt.value = null;
    canInstall.value = false;
    localStorage.setItem('pwa_installed', '1');
  });
}

export function usePWA() {
  async function promptInstall() {
    if (!deferredPrompt.value) return false;
    deferredPrompt.value.prompt();
    const { outcome } = await deferredPrompt.value.userChoice;
    deferredPrompt.value = null;
    canInstall.value = false;
    return outcome === 'accepted';
  }

  const isStandalone = typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone);

  return { canInstall, isStandalone, promptInstall };
}
