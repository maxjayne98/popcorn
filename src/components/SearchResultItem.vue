<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import ShareIcon from '@/components/icons/Share.vue';
import StarIcon from '@/components/icons/Star.vue';
import TwitterIcon from '@/components/icons/Twitter.vue';
import ImdbIcon from '@/components/icons/ImdbIcon.vue';
import MediaActionButton from '@/components/MediaActionButton.vue';
import { formatYear } from '@/utils/formatDate';
import type { TVMazeShow } from '@/types/tvmaze';
import { useWatchlistStore } from '@/stores/watchlist';

const props = defineProps<{
  show: TVMazeShow;
}>();

const posterSrc = computed(() => props.show.image?.medium ?? props.show.image?.original ?? '');
const averageRating = computed(() => props.show.rating?.average ?? null);
const premiereYear = computed(() => formatYear(props.show.premiered ?? null));
const summary = computed(() => {
  if (!props.show.summary) return '';
  const clean = props.show.summary.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length > 220) {
    return `${clean.slice(0, 217).trim()}…`;
  }
  return clean;
});

const networkLabel = computed(() => props.show.network?.name ?? props.show.language ?? 'Uncategorized');
const visibleGenres = computed(() => props.show.genres.slice(0, 4));

const watchlist = useWatchlistStore();
const isPinned = computed(() => watchlist.isPinned(props.show.id));

const shareFeedback = ref('');
let feedbackTimer: ReturnType<typeof setTimeout> | null = null;

function resetFeedbackSoon(message: string) {
  shareFeedback.value = message;
  if (feedbackTimer) {
    clearTimeout(feedbackTimer);
  }
  feedbackTimer = setTimeout(() => {
    shareFeedback.value = '';
    feedbackTimer = null;
  }, 2000);
}

function toggleWatchlist(event: MouseEvent) {
  event.preventDefault();
  watchlist.toggle(props.show.id);
}

async function shareShow(event: MouseEvent) {
  event.preventDefault();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const url = origin ? `${origin}/shows/${props.show.id}` : `/shows/${props.show.id}`;

  try {
    if (navigator?.share) {
      await navigator.share({ title: props.show.name, url });
      resetFeedbackSoon('Shared!');
      return;
    }
  } catch (error) {
    console.warn('Share failed, falling back to copy', error);
  }

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      resetFeedbackSoon('Link copied!');
      return;
    }
  } catch (error) {
    console.warn('Clipboard copy failed', error);
  }

  resetFeedbackSoon('Share not supported');
}

function tweetShow(event: MouseEvent) {
  event.preventDefault();
  if (typeof window === 'undefined') {
    return;
  }
  const origin = window.location.origin;
  const url = encodeURIComponent(`${origin}/shows/${props.show.id}`);
  const text = encodeURIComponent(`Watching ${props.show.name}`);
  const tweetUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  window.open(tweetUrl, '_blank', 'noopener');
}
</script>

<template>
  <RouterLink
    :to="{ name: 'show-details', params: { id: show.id } }"
    class="result-item"
    :aria-label="`View details for ${show.name}`"
  >
    <div class="result-item__poster">
      <img v-if="posterSrc" :src="posterSrc" :alt="`${show.name} poster`" loading="lazy" />
      <div v-else class="result-item__poster-placeholder">{{ show.name.charAt(0).toUpperCase() }}</div>
      <span v-if="averageRating" class="result-item__badge">
        <ImdbIcon aria-hidden="true" class="result-item__imdb" />
        {{ averageRating.toFixed(1) }}
      </span>
    </div>
    <div class="result-item__body">
      <header class="result-item__header">
        <div>
          <h3 class="result-item__title">{{ show.name }}</h3>
          <p class="result-item__meta">
            <span>{{ networkLabel }}</span>
            <span v-if="premiereYear">• {{ premiereYear }}</span>
            <span v-if="show.runtime">• {{ show.runtime }} min</span>
          </p>
        </div>
        <div class="result-item__actions">
          <MediaActionButton
            class="result-item__action"
            :icon="TwitterIcon"
            :ariaLabel="`Tweet about ${show.name}`"
            @click.stop="tweetShow"
          />
          <MediaActionButton
            class="result-item__action"
            :icon="ShareIcon"
            :ariaLabel="`Share ${show.name}`"
            @click.stop="shareShow"
          />
          <MediaActionButton
            class="result-item__action result-item__action--pin"
            :icon="StarIcon"
            variant="pin"
            :pressed="isPinned"
            :ariaLabel="isPinned ? `Remove ${show.name} from watchlist` : `Add ${show.name} to watchlist`"
            @click.stop="toggleWatchlist"
          />
        </div>
      </header>
      <p v-if="summary" class="result-item__summary">{{ summary }}</p>
      <ul v-if="visibleGenres.length" class="result-item__genres">
        <li v-for="genre in visibleGenres" :key="genre">{{ genre }}</li>
      </ul>
    </div>
    <div v-if="shareFeedback" class="result-item__feedback">{{ shareFeedback }}</div>
  </RouterLink>
</template>

<style scoped lang="scss">
.result-item {
  position: relative;
  display: grid;
  grid-template-columns: minmax(140px, 200px) 1fr;
  gap: clamp(1rem, 2vw, 1.5rem);
  padding: clamp(1rem, 2vw, 1.5rem);
  border-radius: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(145deg, rgba(32, 12, 26, 0.9), rgba(16, 8, 22, 0.82));
  text-decoration: none;
  color: inherit;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
}

.result-item:hover {
  transform: translateY(-2px);
  border-color: var(--accent-color);
  box-shadow: 0 18px 28px rgba(0, 0, 0, 0.35);
  
}

.result-item__poster {
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
  aspect-ratio: 2 / 3;
  background: rgba(24, 20, 30, 0.7);
}

.result-item__poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-item__poster-placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  font-size: 3rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
}

.result-item__badge {
  position: absolute;
  left: 0.75rem;
  bottom: 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.75);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  font-size: 0.85rem;
}

.result-item__imdb {
  width: 1.8rem;
  height: auto;
}

.result-item__body {
  display: grid;
  gap: 0.75rem;
}

.result-item__header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.result-item__title {
  margin: 0;
  font-size: clamp(1.2rem, 2vw, 1.6rem);
}

.result-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0.35rem 0 0;
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.9rem;
}

.result-item__summary {
  margin: 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.95rem;
  line-height: 1.5;
  max-width: 80ch;
}

.result-item__genres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
  height: 1.4rem;
}

.result-item__genres li {
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.75rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.result-item__actions {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
}

.result-item__action {
  transition: transform 150ms ease;
}

.result-item__feedback {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: rgba(18, 10, 20, 0.85);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.75rem;
  letter-spacing: 0.02em;
}

@media (max-width: 720px) {
  .result-item {
    grid-template-columns: minmax(120px, 160px) 1fr;
  }
}

@media (max-width: 560px) {
  .result-item {
    grid-template-columns: 1fr;
  }

  .result-item__poster {
    max-width: 220px;
    justify-self: center;
  }

  .result-item__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .result-item__actions {
    margin-top: 0.5rem;
  }
}
</style>
