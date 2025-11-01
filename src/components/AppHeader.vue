<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

const props = defineProps<{
  modelValue: string;
  isSearching?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'submit'): void;
}>();

const localQuery = ref(props.modelValue);

watch(
  () => props.modelValue,
  (value) => {
    if (value !== localQuery.value) {
      localQuery.value = value;
    }
  }
);

const isSubmitDisabled = computed(() => !localQuery.value.trim());

function handleInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  localQuery.value = value;
  emit('update:modelValue', value);
}

function handleSubmit() {
  emit('update:modelValue', localQuery.value);
  emit('submit');
}
</script>

<template>
  <header class="app-header">
    <RouterLink class="app-header__brand" to="/">Popcorn</RouterLink>
    <form class="app-header__search" role="search" @submit.prevent="handleSubmit">
      <div class="app-header__search-input">
        <input
          :value="localQuery"
          aria-label="Search for TV shows"
          autocomplete="off"
          name="search"
          placeholder="Search shows..."
          type="search"
          @input="handleInput"
        />
        <span v-if="props.isSearching" aria-hidden="true" class="app-header__search-spinner" />
      </div>
      <button class="app-header__search-button" type="submit" :disabled="isSubmitDisabled">
        Search
      </button>
    </form>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem clamp(1rem, 2vw, 2.5rem);
  background: linear-gradient(135deg, rgba(40, 6, 12, 0.95), rgba(18, 2, 6, 0.78));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.app-header__brand {
  font-size: clamp(1.25rem, 2vw, 1.75rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: white;
  text-decoration: none;
}

.app-header__brand:hover {
  color: var(--accent-color);
}

.app-header__search {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1 1 320px;
  max-width: min(560px, 100vw - 3rem);
}

.app-header__search-input {
  position: relative;
  flex: 1;
  display: flex;
}

.app-header__search-input input {
  flex: 1;
  padding: 0.65rem 1rem;
  padding-right: 2.5rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(20, 20, 34, 0.85);
  color: white;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.app-header__search-input input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(255, 45, 85, 0.25);
}

.app-header__search-button {
  padding: 0.6rem 1.4rem;
  border-radius: 999px;
  border: none;
  font-weight: 600;
  background: var(--accent-color);
  color: var(--dark-900);
  cursor: pointer;
  transition: transform 150ms ease, box-shadow 150ms ease;
}

.app-header__search-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.app-header__search-button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(255, 45, 85, 0.25);
}

.app-header__search-button:focus-visible {
  outline: 3px solid rgba(255, 45, 85, 0.35);
  outline-offset: 2px;
}

.app-header__search-spinner {
  position: absolute;
  right: 0.9rem;
  top: 50%;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: rgba(255, 255, 255, 0.7);
  transform: translateY(-50%);
  animation: spin 650ms linear infinite;
}

@keyframes spin {
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}

@media (max-width: 640px) {
  .app-header {
    padding-block: 0.75rem;
  }

  .app-header__search {
    flex-basis: 100%;
  }

  .app-header__search-button {
    padding-inline: 1rem;
  }
}
</style>
