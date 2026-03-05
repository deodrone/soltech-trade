import { ref, onUnmounted } from 'vue';

const WS_URL = process.env.VUE_APP_WS_URL || 'ws://localhost:3000';

let sharedWs = null;
let listeners = {};
let reconnectTimer = null;
let pingInterval = null;

export function useWebSocket() {
  const connected = ref(false);

  function connect(token) {
    if (sharedWs && sharedWs.readyState === WebSocket.OPEN) {
      connected.value = true;
      return;
    }
    const url = token ? `${WS_URL}?token=${token}` : WS_URL;
    sharedWs = new WebSocket(url);

    sharedWs.onopen = () => {
      connected.value = true;
      clearTimeout(reconnectTimer);
      pingInterval = setInterval(() => {
        if (sharedWs.readyState === WebSocket.OPEN) sharedWs.send(JSON.stringify({ type: 'ping' }));
      }, 30000);
    };

    sharedWs.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (!msg.type) return;
        (listeners[msg.type] || []).forEach(cb => cb(msg));
        (listeners['*'] || []).forEach(cb => cb(msg));
      } catch {}
    };

    sharedWs.onclose = () => {
      connected.value = false;
      clearInterval(pingInterval);
      reconnectTimer = setTimeout(() => connect(token), 3000);
    };

    sharedWs.onerror = () => sharedWs.close();
  }

  function on(type, cb) {
    if (!listeners[type]) listeners[type] = [];
    listeners[type].push(cb);
  }

  function off(type, cb) {
    if (!listeners[type]) return;
    listeners[type] = listeners[type].filter(fn => fn !== cb);
  }

  function send(data) {
    if (sharedWs && sharedWs.readyState === WebSocket.OPEN) {
      sharedWs.send(JSON.stringify(data));
    }
  }

  function disconnect() {
    clearTimeout(reconnectTimer);
    clearInterval(pingInterval);
    listeners = {};
    if (sharedWs) { sharedWs.close(); sharedWs = null; }
    connected.value = false;
  }

  onUnmounted(() => {
    // Don't destroy shared WS on unmount, just clean up local listeners
  });

  return { connected, connect, on, off, send, disconnect };
}
