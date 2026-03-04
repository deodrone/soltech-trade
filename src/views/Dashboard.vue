<template>
  <div class="dashboard">
    <h2>User Dashboard</h2>
    <UserProfile />
  </div>
</template>

<script>
import UserProfile from '../components/UserProfile.vue';

export default {
  name: 'DashboardView',
  components: { UserProfile }
};
</script>

<style scoped>
.dashboard { padding: 24px; }
h2 { color: #58a6ff; margin-bottom: 20px; }
</style>
