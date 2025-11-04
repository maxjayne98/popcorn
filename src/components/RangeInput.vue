<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  valuePrefix?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const min = computed(() => props.min ?? 0);
const max = computed(() => props.max ?? 10);
const step = computed(() => props.step ?? 1);
const showValue = computed(() => props.showValue ?? true);

const progressPercent = computed(() => {
  const range = max.value - min.value;
  if (range <= 0) {
    return 0;
  }
  const clamped = Math.min(Math.max(props.modelValue, min.value), max.value);
  return ((clamped - min.value) / range) * 100;
});

const sliderStyle = computed(() => {
  const progress = progressPercent.value;
  const accent = 'var(--accent-color, #ff2d55)';
  const track = 'rgba(255, 255, 255, 0.14)';
  return {
    background: `linear-gradient(to right, ${accent} 0%, ${accent} ${progress}%, ${track} ${progress}%, ${track} 100%)`,
  };
});

function handleInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  emit('update:modelValue', value);
}

const displayValue = computed(() => {
  const decimals = step.value < 1 ? 1 : 0;
  return props.modelValue.toFixed(decimals);
});
</script>

<template>
  <label class="range-input">
    <span v-if="label" class="range-input__label">{{ label }}</span>
    <div class="range-input__wrapper">
      <input
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        class="range-input__slider"
        :style="sliderStyle"
        @input="handleInput"
      />
      <span v-if="showValue" class="range-input__value">
        <span v-if="valuePrefix">{{ valuePrefix }}</span>{{ displayValue }}
      </span>
    </div>
  </label>
</template>

<style scoped lang="scss">
.range-input {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.75);
}

.range-input__label {
  font-size: 0.9rem;
}

.range-input__wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.range-input__slider {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.range-input__slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-color, #ff2d55);
  cursor: pointer;
  border: 3px solid rgba(255, 255, 255, 0.65);
  box-shadow: none;
  transition: transform 150ms ease;
  position: relative;
  top: -6px
}

.range-input__slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.range-input__slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-color, #ff2d55);
  cursor: pointer;
  border: 3px solid rgba(255, 255, 255, 0.65);
  box-shadow: none;
  transition: transform 150ms ease;
}

.range-input__slider::-moz-range-thumb:hover {
  transform: scale(1.15);
}

.range-input__slider::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 999px;
  background: transparent;
}

.range-input__slider::-moz-range-track {
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}

.range-input__slider::-moz-range-progress {
  height: 6px;
  border-radius: 999px;
  background: var(--accent-color, #ff2d55);
}

.range-input__value {
  font-weight: 600;
  color: rgba(255, 215, 0, 0.9);
  min-width: 3rem;
  text-align: right;
}
</style>
