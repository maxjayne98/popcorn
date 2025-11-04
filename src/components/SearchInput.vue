<script setup lang="ts">
import { computed, ref, useAttrs, watchEffect } from 'vue';

defineOptions({
  inheritAttrs: false,
});

const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    ariaLabel?: string;
    type?: string;
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    placeholder: 'Search…',
    ariaLabel: 'Search',
    type: 'search',
    loading: false,
    disabled: false,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'focus'): void;
  (e: 'blur'): void;
  (e: 'enter'): void;
}>();

const internalValue = ref(props.modelValue);

watchEffect(() => {
  if (props.modelValue !== internalValue.value) {
    internalValue.value = props.modelValue;
  }
});

const inputType = computed(() => props.type ?? 'search');

const wrapperClasses = computed(() => ['search-input', attrs.class]);
const wrapperStyle = computed(() => attrs.style);

const inputAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs;
  return rest;
});

function handleInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  internalValue.value = value;
  emit('update:modelValue', value);
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    emit('enter');
  }
}
</script>

<template>
  <div :class="[wrapperClasses, { 'search-input--loading': loading, 'search-input--disabled': disabled }]" :style="wrapperStyle as any">
    <slot name="leading" />
    <input
      v-bind="inputAttrs"
      :value="internalValue"
      :type="inputType"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      :disabled="disabled"
      @input="handleInput"
      @focus="$emit('focus')"
      @blur="$emit('blur')"
      @keydown="handleKeydown($event)"
    />
    <span v-if="loading" class="search-input__spinner" aria-hidden="true" />
    <slot name="trailing" />
  </div>
</template>

<style scoped lang="scss">
.search-input {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-inline: 1rem;
  border-radius: 999px;
  background: rgba(20, 20, 34, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.search-input:hover {
  border-color: rgba(255, 255, 255, 0.18);
}

.search-input:focus-within {
  border-color: var(--accent-color, #ff2d55);
  box-shadow: 0 0 0 3px rgba(255, 45, 85, 0.25);
}

.search-input input {
  flex: 1;
  width: 100%;
  padding: 0.65rem 0;
  border: none;
  background: transparent;
  color: white;
  font: inherit;
}

.search-input input::placeholder {
  color: rgba(255, 255, 255, 0.55);
}

.search-input input:focus {
  outline: none;
}

.search-input__spinner {
  position: absolute;
  right: 1rem;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: rgba(255, 255, 255, 0.7);
  animation: spin 650ms linear infinite;
}

.search-input--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
