<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useShowCatalog } from '@/composables/useShowCatalog';
import { useRecentlyViewedStore } from '@/stores/recentlyViewed';
import AsyncState from '@/components/AsyncState.vue';
import ShowDetailHero from '@/components/ShowDetailHero.vue';
import ShowCastRail from '@/components/ShowCastRail.vue';
import { formatYear } from '@/utils/formatDate';
import { fetchShowCast } from '@/api/tvmaze';
import type { TVMazeCastMember, TVMazeShow } from '@/types/tvmaze';

const props = defineProps<{
  id: string;
}>();

const router = useRouter();
const { ensureShow } = useShowCatalog();
const recentlyViewed = useRecentlyViewedStore();

const show = ref<TVMazeShow | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const cast = ref<TVMazeCastMember[]>([]);
const isCastLoading = ref(false);
const castError = ref<string | null>(null);

const poster = computed(() => show.value?.image?.original ?? show.value?.image?.medium ?? '');
const averageRating = computed(() => show.value?.rating?.average ?? null);
const premieredYear = computed(() => formatYear(show.value?.premiered ?? null));
const endedYear = computed(() => formatYear(show.value?.ended ?? null));

const formattedSchedule = computed(() => {
  if (!show.value) {
    return '';
  }
  const { schedule } = show.value;
  if (!schedule?.days?.length) {
    return schedule?.time ? `Daily at ${schedule.time}` : 'Schedule unavailable';
  }
  return `${schedule.days.join(', ')}${schedule.time ? ` at ${schedule.time}` : ''}`;
});

const networks = computed(() => {
  if (!show.value?.network?.name) {
    return '';
  }
  const country = show.value.network.country?.name;
  return country ? `${show.value.network.name} (${country})` : show.value.network.name;
});

let castController: AbortController | null = null;

async function loadShowCast(id: number) {
  castController?.abort();
  const controller = new AbortController();
  castController = controller;
  isCastLoading.value = true;
  castError.value = null;
  cast.value = [];

  try {
    const entries = await fetchShowCast(id, controller.signal);
    if (controller.signal.aborted) {
      return;
    }
    cast.value = entries;
  } catch (err) {
    if (controller.signal.aborted) {
      return;
    }
    castError.value = err instanceof Error ? err.message : 'Unable to load cast information.';
  } finally {
    if (!controller.signal.aborted) {
      isCastLoading.value = false;
      castController = null;
    }
  }
}

async function loadShowDetails(identifier: string) {
  const numericId = Number.parseInt(identifier, 10);
  if (Number.isNaN(numericId)) {
    error.value = 'Invalid show identifier.';
    isLoading.value = false;
    return;
  }
  castController?.abort();
  castController = null;
  cast.value = [];
  castError.value = null;
  isCastLoading.value = false;
  isLoading.value = true;
  error.value = null;
  try {
    const result = await ensureShow(numericId);
    if (!result) {
      error.value = 'Show not found. It may have been removed.';
      show.value = null;
      cast.value = [];
    } else {
      show.value = result;
      recentlyViewed.add(result);
      loadShowCast(numericId);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to load show details.';
    error.value = message;
    show.value = null;
    cast.value = [];
  } finally {
    isLoading.value = false;
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push({ name: 'home' });
  }
}

watch(
  () => props.id,
  (identifier) => {
    loadShowDetails(identifier);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  castController?.abort();
});
</script>

<template>
  <div class="page-container">
    <button class="back-button" type="button" @click="goBack">← Back</button>
    <AsyncState :is-loading="isLoading" :error="error" loading-message="Loading show details...">
      <article v-if="show" class="show-detail">
        <ShowDetailHero
          :show="show"
          :poster="poster"
          :average-rating="averageRating"
          :formatted-schedule="formattedSchedule"
          :networks="networks"
          :premiered-year="premieredYear"
          :ended-year="endedYear"
        />
        <ShowCastRail :cast="cast" :is-loading="isCastLoading" :error="castError" />
      </article>
    </AsyncState>
  </div>
</template>

<style scoped lang="scss">
.back-button {
  justify-self: start;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: border-color 150ms ease, color 150ms ease;
}

.back-button:hover {
  border-color: rgba(255, 45, 85, 0.6);
  color: rgba(255, 144, 164, 0.9);
}

.show-detail {
  display: grid;
  gap: clamp(1.75rem, 3vw, 2.5rem);
  padding: clamp(1.5rem, 2.5vw, 2.5rem);
  background: var(--surface-elevated);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

@media (max-width: 900px) {
  .show-detail {
    padding: clamp(1rem, 4vw, 2rem);
  }
}
</style>
