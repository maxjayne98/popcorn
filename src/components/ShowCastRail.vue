<script setup lang="ts">
import AsyncState from '@/components/AsyncState.vue';
import VirtualHorizontalList from '@/components/VirtualHorizontalList.vue';
import type { TVMazeCastMember } from '@/types/tvmaze';

defineProps<{
  cast: TVMazeCastMember[];
  isLoading: boolean;
  error: string | null;
}>();
</script>

<template>
  <section class="show-detail__cast">
    <h2>Cast</h2>
    <AsyncState :is-loading="isLoading" :error="error" loading-message="Loading cast…">
      <template #error="{ error: castMessage }">
        <p class="show-detail__cast-state">{{ castMessage }}</p>
      </template>
      <p v-if="!cast.length" class="show-detail__cast-state">No cast information available.</p>
      <VirtualHorizontalList
        v-else
        :items="cast"
        :item-width="180"
        :item-gap="16"
        :item-height="240"
        class="show-detail__cast-list"
        role="list"
      >
        <template #default="{ item }">
          <article class="show-detail__cast-card" role="listitem">
            <div class="show-detail__cast-avatar">
              <img
                v-if="item.person.image?.medium || item.person.image?.original"
                :src="item.person.image?.medium ?? item.person.image?.original"
                :alt="`${item.person.name} portrait`"
                loading="lazy"
              />
              <span v-else>{{ item.person.name.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="show-detail__cast-info">
              <p class="show-detail__cast-name">{{ item.person.name }}</p>
              <p v-if="item.character?.name" class="show-detail__cast-role">
                as {{ item.character.name }}
                <span v-if="item.voice"> (voice)</span>
                <span v-else-if="item.self"> (self)</span>
              </p>
            </div>
          </article>
        </template>
      </VirtualHorizontalList>
    </AsyncState>
  </section>
</template>

<style scoped lang="scss">
.show-detail__cast {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.show-detail__cast h2 {
  margin: 0;
}

.show-detail__cast-list {
  padding-bottom: 0.5rem;
}

.show-detail__cast-list ::v-deep(.virtual-rail__items) {
  gap: 16px;
}

.show-detail__cast-list ::v-deep(.virtual-rail__cell) {
  margin-right: 0;
}

.show-detail__cast-card {
  display: grid;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: rgba(25, 18, 36, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.show-detail__cast-avatar {
  width: 80%;
  aspect-ratio: 1;
  border-radius: 1rem;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.12);
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 700;
  margin: auto;
}

.show-detail__cast-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.show-detail__cast-info {
  display: grid;
  gap: 0.1rem;
}

.show-detail__cast-name {
  margin: 0;
  font-weight: 600;
}

.show-detail__cast-role {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.show-detail__cast-state {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
}
</style>
