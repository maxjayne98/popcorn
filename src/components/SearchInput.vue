<script setup lang="ts">
import { computed, nextTick, ref, useAttrs, watchEffect } from 'vue';
import CrossIcon from '@/components/icons/Cross.vue';

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
    clearable?: boolean;
  }>(),
  {
    placeholder: 'Search…',
    ariaLabel: 'Search',
    type: 'search',
    loading: false,
    disabled: false,
    clearable: false,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'focus'): void;
  (e: 'blur'): void;
  (e: 'enter'): void;
  (e: 'clear'): void;
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

const inputRef = ref<HTMLInputElement | null>(null);

function handleClear() {
  internalValue.value = '';
  emit('update:modelValue', '');
  emit('clear');
  nextTick(() => {
    inputRef.value?.focus();
  });
}

const showClear = computed(() => props.clearable && !!internalValue.value && !props.disabled && !props.loading);
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
      ref="inputRef"
      @input="handleInput"
      @focus="$emit('focus')"
      @blur="$emit('blur')"
      @keydown="handleKeydown($event)"
    />
    <button
      v-if="showClear"
      type="button"
      class="search-input__clear"
      @click="handleClear"
      aria-label="Clear search"
    >
      <CrossIcon aria-hidden="true" />
    </button>
    <span v-else-if="loading" class="search-input__spinner" aria-hidden="true" />
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

.search-input input::-webkit-search-cancel-button {
  display: none;
}

.search-input input:focus {
  outline: none;
}

.search-input__spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: rgba(255, 255, 255, 0.7);
  animation: spin 650ms linear infinite;
  margin-left: 0.2rem;
}

.search-input--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.search-input__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  transition: background 150ms ease, transform 150ms ease;
}

.search-input__clear:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-1px);
}

.search-input__clear svg {
  width: 0.75rem;
  height: 0.75rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
