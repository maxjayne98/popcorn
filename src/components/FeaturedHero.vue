<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useParallaxBackground } from '@/composables/useParallaxBackground';
import type { TVMazeShow } from '@/types/tvmaze';
import ImdbIcon from '@/components/icons/Imdb.vue';

const props = defineProps<{
  show: TVMazeShow;
  subtitle: string;
  genreChips: string[];
}>();

const emit = defineEmits<{
  focusByGenre: [genre: string];
}>();

const router = useRouter();

const {
  parallaxStyle: heroParallaxStyle,
  onMouseEnter: handleHeroMouseEnter,
  onMouseLeave: handleHeroMouseLeave,
  onMouseMove: handleHeroMouseMove,
} = useParallaxBackground({ range: 32 });

const featuredBackdropStyle = computed(() => {
  const baseStyle = { ...heroParallaxStyle.value };
  const image = props.show.image?.original ?? props.show.image?.medium;
  if (image) {
    baseStyle.backgroundImage = `linear-gradient(135deg, rgba(8, 9, 15, 0.9) 10%, rgba(8, 9, 15, 0.15) 70%), url('${image}')`;
  }
  return baseStyle;
});

const featuredSummary = computed(() => {
  if (!props.show.summary) {
    return '';
  }
  return props.show.summary.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
});

const visibleGenreChips = computed(() => props.genreChips.slice(0, 3));

function handleHeroPlay() {
  const destination = props.show.officialSite ?? props.show.url;
  if (destination && typeof window !== 'undefined') {
    window.open(destination, '_blank', 'noopener');
  } else {
    router.push({ name: 'show-details', params: { id: props.show.id } });
  }
}

function handleHeroMoreInfo() {
  router.push({ name: 'show-details', params: { id: props.show.id } });
}

function handleGenreClick(genre: string) {
  emit('focusByGenre', genre);
}
</script>

<template>
  <section class="hero" :style="featuredBackdropStyle">
    <div
      class="hero__overlay"
      @mousemove="handleHeroMouseMove"
      @mouseleave="handleHeroMouseLeave"
      @mouseenter="handleHeroMouseEnter"
    >
      <div class="hero__content">
        <p class="hero__eyebrow">Featured Spotlight</p>
        <h1>{{ show.name }}</h1>
        <p v-if="featuredSummary" class="hero__summary">{{ featuredSummary }}</p>
        <ul class="hero__meta">
          <li v-if="show.genres.length">{{ show.genres.join(' • ') }}</li>
          <li v-if="show.rating?.average" class="hero__rating">
            <ImdbIcon aria-hidden="true" class="hero__rating-icon" />
            {{ show.rating.average.toFixed(1) }}
          </li>
          <li v-if="show.runtime">{{ show.runtime }} min</li>
        </ul>
        <div class="hero__actions">
          <button type="button" class="hero__button hero__button--primary" @click="handleHeroPlay">
            ▶ Play
          </button>
          <button type="button" class="hero__button" @click="handleHeroMoreInfo">
             More Info
          </button>
        </div>
        <p class="hero__subtitle">{{ subtitle }}</p>
        <div v-if="visibleGenreChips.length" class="hero__chips">
          <button
            v-for="chip in visibleGenreChips"
            :key="chip"
            type="button"
            class="hero__chip"
            @click="handleGenreClick(chip)"
          >
            {{ chip }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.hero {
  position: relative;
  min-height: clamp(320px, 55vh, 520px);
  border-radius: 1.5rem;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(26, 4, 8, 0.88), rgba(8, 1, 3, 0.4));
  background-size: cover, cover;
  background-position:
    calc(50% + var(--parallax-shift-x, 0px)) calc(50% + var(--parallax-shift-y, 0px)),
    calc(50% + var(--parallax-shift-x, 0px)) calc(50% + var(--parallax-shift-y, 0px));
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
  transition: background-position 180ms ease;
}

.hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(30, 4, 8, 0.9) 15%, rgba(20, 3, 6, 0.55) 50%, rgba(0, 0, 0, 0));
  display: flex;
  align-items: flex-end;
  padding: clamp(1.5rem, 4vw, 3rem);
}

.hero__content {
  max-width: min(640px, 90%);
  display: grid;
  gap: 1rem;
  color: white;
}

.hero__eyebrow {
  margin: 0;
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.hero__content h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.1;
}

.hero__summary {
  margin: 0;
  font-size: clamp(1rem, 1.8vw, 1.15rem);
  color: rgba(255, 255, 255, 0.82);
  text-wrap: balance;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
  color: rgba(255, 190, 203, 0.78);
}

.hero__rating {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.hero__rating-icon {
  width: 1.4rem;
  height: auto;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.hero__button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.6rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(26, 4, 8, 0.75);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 150ms ease, box-shadow 150ms ease, background 150ms ease;
}

.hero__button:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
}

.hero__button--primary {
  background: white;
  color: var(--dark-900);
  border-color: white;
}

.hero__button--primary:hover {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
}

.hero__subtitle {
  margin: 0;
  color: rgba(255, 190, 203, 0.72);
  font-size: 0.95rem;
}

.hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.75rem;
}

.hero__chip {
  padding: 0.3rem 0.85rem;
  height: 1.75rem;
  line-height: 1.15rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(18, 8, 26, 0.65);
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 150ms ease, border-color 150ms ease, background 150ms ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.hero__chip:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(32, 18, 46, 0.75);
}
</style>
