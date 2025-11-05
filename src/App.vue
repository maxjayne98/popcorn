<script setup lang="ts">
import { ref, watch } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';

const route = useRoute();
const router = useRouter();

const searchQuery = ref((route.query.q as string) ?? '');

watch(
  () => route.query.q,
  (query) => {
    const normalized = (Array.isArray(query) ? query[0] : query) ?? '';
    if (normalized !== searchQuery.value) {
      searchQuery.value = normalized;
    }
  }
);

async function handleSearch() {
  const query = searchQuery.value.trim();
  try {
    if (!query) {
      await router.push({ name: 'home' });
      return;
    }
    await router.push({
      name: 'search-results',
      query: { q: query },
    });
  } catch (error) {
    // Ignore redundant navigation attempts
  }
}
</script>

<template>
  <div class="app-shell">
    <AppHeader v-model="searchQuery" @submit="handleSearch" />
    <main>
      <RouterView v-slot="{ Component, route }">
        <Transition name="route-fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
}
</style>
