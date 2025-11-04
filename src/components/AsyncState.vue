<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    isLoading: boolean;
    error?: string | null;
    loadingMessage?: string;
    errorPrefix?: string;
  }>(),
  {
    error: null,
    loadingMessage: 'Loading…',
    errorPrefix: '',
  }
);

const errorText = computed(() => {
  if (!props.error) {
    return '';
  }
  const prefix = props.errorPrefix?.trim();
  if (prefix) {
    return `${prefix} ${props.error}`.trim();
  }
  return props.error;
});
</script>

<template>
  <div v-if="isLoading" class="async-state async-state--loading">
    <slot name="loading">
      {{ loadingMessage }}
    </slot>
  </div>
  <div v-else-if="error" class="async-state async-state--error">
    <slot name="error" :error="error">
      {{ errorText }}
    </slot>
  </div>
  <slot v-else />
</template>

<style scoped lang="scss">
.async-state {
  margin: 0;
  padding: 2rem;
  text-align: center;
  background: var(--surface-color);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.78);
}

.async-state--error {
  border-color: rgba(255, 95, 109, 0.45);
  color: #ff9aa2;
}

.async-state--loading {
  color: rgba(255, 255, 255, 0.7);
}
</style>
