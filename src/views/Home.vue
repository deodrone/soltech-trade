<template>
  <div class="home">
    <h1>Welcome to Soltech-Trade</h1>
    <p>A next-generation blockchain trading platform.</p>
    <router-link to="/trading" class="cta-btn">Start Trading</router-link>
  </div>
</template>

<script>
export default { name: 'HomeView' };
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 60px);
  gap: 20px;
  text-align: center;
}
h1 { font-size: 2.5rem; color: #58a6ff; }
p { color: #8b949e; font-size: 1.1rem; }
.cta-btn {
  padding: 12px 28px;
  background: #238636;
  color: #fff;
  border-radius: 6px;
  text-decoration: none;
  font-weight: bold;
}
.cta-btn:hover { background: #2ea043; }
</style>
