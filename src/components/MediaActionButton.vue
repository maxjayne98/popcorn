<script setup lang="ts">
import { computed } from 'vue';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    icon: any;
    ariaLabel: string;
    pressed?: boolean;
    variant?: 'default' | 'pin';
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
  }>(),
  {
    variant: 'default',
    pressed: false,
    disabled: false,
    type: 'button',
  }
);

const classes = computed(() => [
  'media-action-button',
  `media-action-button--${props.variant}`,
  { 'media-action-button--pressed': props.pressed },
]);
</script>

<template>
  <button
    v-bind="$attrs"
    :type="type"
    :class="classes"
    :aria-label="ariaLabel"
    :aria-pressed="variant === 'pin' ? (pressed ? 'true' : 'false') : undefined"
    :disabled="disabled"
  >
    <component :is="icon" aria-hidden="true" class="media-action-button__icon" />
  </button>
</template>

<style scoped lang="scss">
.media-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(18, 8, 26, 0.72);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: transform 150ms ease, border-color 150ms ease, background 150ms ease, color 150ms ease;
}

.media-action-button:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.45);
  background: rgba(30, 18, 38, 0.85);
}

.media-action-button__icon {
  width: 1rem;
  height: 1rem;
}

.media-action-button--pin.media-action-button--pressed {
  border-color: rgba(255, 215, 0, 0.65);
  color: rgba(255, 215, 0, 0.95);
  background: rgba(48, 28, 18, 0.85);
}

.media-action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
