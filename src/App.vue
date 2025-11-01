<script setup lang="ts">
import { provide, ref, watch } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import { searchLoadingKey } from '@/composables/useSearchLoading';

const route = useRoute();
const router = useRouter();

const searchQuery = ref((route.query.q as string) ?? '');
const isSearching = ref(false);

provide(searchLoadingKey, {
  setSearching(value: boolean) {
    isSearching.value = value;
  },
});

watch(
  () => route.query.q,
  (query) => {
    const normalized = (Array.isArray(query) ? query[0] : query) ?? '';
    if (normalized !== searchQuery.value) {
      searchQuery.value = normalized;
    }
  }
);

function updateQuery(value: string) {
  if (value !== searchQuery.value) {
    searchQuery.value = value;
  }
}

async function handleSearch() {
  const query = searchQuery.value.trim();
  try {
    await router.push({
      name: 'home',
      query: query ? { q: query } : undefined,
    });
  } catch (error) {
    // Ignore redundant navigation attempts
  }
}
</script>

<template>
  <div class="app-shell">
    <AppHeader v-model="searchQuery" :is-searching="isSearching" @submit="handleSearch" />
    <main>
      <RouterView v-slot="{ Component, route }">
        <component
          :is="Component"
          v-bind="route.name === 'home' ? { searchQuery } : {}"
          v-on="route.name === 'home' ? { 'update-search': updateQuery } : {}"
        />
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
