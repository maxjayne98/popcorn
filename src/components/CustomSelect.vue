<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

type SelectValue = string | number;
type SelectOption = {
  value: SelectValue;
  label: string;
};

const props = defineProps<{
  modelValue: SelectValue;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: SelectValue): void;
  (e: 'change', value: SelectValue): void;
}>();

const instanceId = `custom-select-${Math.random().toString(36).slice(2, 9)}`;
const listboxId = `${instanceId}-listbox`;

const rootRef = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLButtonElement | null>(null);
const listRef = ref<HTMLUListElement | null>(null);

const isOpen = ref(false);
const activeIndex = ref(-1);

const normalizedOptions = computed(() => props.options.slice());

const selectedOption = computed(() =>
  normalizedOptions.value.find((option) => option.value === props.modelValue) ?? null
);

const activeOptionId = computed(() => {
  if (!isOpen.value || activeIndex.value < 0) {
    return undefined;
  }
  return `${instanceId}-option-${activeIndex.value}`;
});

const displayLabel = computed(() => {
  if (selectedOption.value) {
    return selectedOption.value.label;
  }
  return props.placeholder ?? 'Select an option';
});

const selectedIndex = computed(() =>
  normalizedOptions.value.findIndex((option) => option.value === props.modelValue)
);

watch(
  () => props.modelValue,
  () => {
    if (!isOpen.value) {
      activeIndex.value = -1;
    }
  }
);

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) {
      closeDropdown();
    }
  }
);

function openDropdown() {
  if (props.disabled || !normalizedOptions.value.length) {
    return;
  }
  isOpen.value = true;
  nextTick(() => {
    const index = selectedIndex.value >= 0 ? selectedIndex.value : 0;
    setActiveIndex(index);
    focusActiveOption();
  });
}

function closeDropdown() {
  isOpen.value = false;
  activeIndex.value = -1;
}

function toggleDropdown() {
  if (isOpen.value) {
    closeDropdown();
  } else {
    openDropdown();
  }
}

function setActiveIndex(index: number) {
  const clamped = Math.max(Math.min(index, normalizedOptions.value.length - 1), -1);
  activeIndex.value = clamped;
  if (clamped >= 0) {
    nextTick(() => {
      focusActiveOption();
    });
  }
}

function moveActive(delta: number) {
  if (!normalizedOptions.value.length) {
    return;
  }
  let next = activeIndex.value;
  if (next < 0) {
    next = delta > 0 ? 0 : normalizedOptions.value.length - 1;
  } else {
    next = (next + delta + normalizedOptions.value.length) % normalizedOptions.value.length;
  }
  setActiveIndex(next);
}

function focusActiveOption() {
  const list = listRef.value;
  if (!list || activeIndex.value < 0) {
    return;
  }
  const optionEl = list.children[activeIndex.value] as HTMLElement | undefined;
  optionEl?.focus({ preventScroll: true });
  optionEl?.scrollIntoView({ block: 'nearest' });
}

function selectOption(option: SelectOption) {
  emit('update:modelValue', option.value);
  emit('change', option.value);
  closeDropdown();
  nextTick(() => {
    buttonRef.value?.focus();
  });
}

function handleOptionMouseEnter(index: number) {
  if (index !== activeIndex.value) {
    setActiveIndex(index);
  }
}

function handleButtonKeydown(event: KeyboardEvent) {
  if (props.disabled) {
    return;
  }
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (!isOpen.value) {
        openDropdown();
      } else {
        moveActive(1);
      }
      break;
    case 'ArrowUp':
      event.preventDefault();
      if (!isOpen.value) {
        openDropdown();
        nextTick(() => {
          moveActive(-1);
        });
      } else {
        moveActive(-1);
      }
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      if (isOpen.value && activeIndex.value >= 0) {
        const option = normalizedOptions.value[activeIndex.value];
        if (option) {
          selectOption(option);
        }
      } else {
        openDropdown();
      }
      break;
    case 'Escape':
      if (isOpen.value) {
        event.preventDefault();
        closeDropdown();
      }
      break;
    default:
      break;
  }
}

function handleListKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      moveActive(1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      moveActive(-1);
      break;
    case 'Home':
      event.preventDefault();
      setActiveIndex(0);
      break;
    case 'End':
      event.preventDefault();
      setActiveIndex(normalizedOptions.value.length - 1);
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      if (activeIndex.value >= 0) {
        const option = normalizedOptions.value[activeIndex.value];
        if (option) {
          selectOption(option);
        }
      }
      break;
    case 'Escape':
      event.preventDefault();
      closeDropdown();
      nextTick(() => {
        buttonRef.value?.focus();
      });
      break;
    case 'Tab':
      closeDropdown();
      break;
    default:
      break;
  }
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target as Node | null;
  if (!rootRef.value || !target) {
    return;
  }
  if (!rootRef.value.contains(target)) {
    closeDropdown();
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentClick);
});
</script>

<template>
  <div
    ref="rootRef"
    class="custom-select"
    :class="{
      'custom-select--open': isOpen,
      'custom-select--disabled': disabled,
    }"
  >
    <button
      ref="buttonRef"
      type="button"
      class="custom-select__button"
      :class="{ 'custom-select__button--placeholder': !selectedOption }"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      :aria-controls="listboxId"
      :disabled="disabled || !normalizedOptions.length"
      @click="toggleDropdown"
      @keydown="handleButtonKeydown"
    >
      <span class="custom-select__label">{{ displayLabel }}</span>
      <span aria-hidden="true" class="custom-select__icon">
        <svg viewBox="0 0 16 16" focusable="false">
          <path
            d="M4.47 6.47a.75.75 0 0 1 1.06 0L8 8.94l2.47-2.47a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 0 1 0-1.06Z"
          />
        </svg>
      </span>
    </button>
    <transition name="custom-select__transition">
      <ul
        v-if="isOpen"
        ref="listRef"
        :id="listboxId"
        class="custom-select__list"
        role="listbox"
        :aria-activedescendant="activeOptionId"
        @keydown="handleListKeydown"
      >
        <li
          v-for="(option, index) in normalizedOptions"
          :id="`${instanceId}-option-${index}`"
          :key="option.value"
          class="custom-select__option"
          :class="{
            'custom-select__option--selected': option.value === modelValue,
            'custom-select__option--active': index === activeIndex,
          }"
          role="option"
          :aria-selected="option.value === modelValue"
          tabindex="-1"
          @click="selectOption(option)"
          @mousedown.prevent
          @mouseenter="handleOptionMouseEnter(index)"
        >
          {{ option.label }}
        </li>
      </ul>
    </transition>
  </div>
</template>

<style scoped lang="scss">
.custom-select {
  position: relative;
  width: 100%;
  min-width: 140px;
}

.custom-select__button {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(20, 12, 28, 0.92);
  color: rgba(255, 255, 255, 0.88);
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease, color 150ms ease, transform 150ms ease;
}

.custom-select__button:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.35);
  background: rgba(28, 16, 38, 0.95);
}

.custom-select__button:focus-visible {
  outline: 2px solid rgba(255, 82, 122, 0.7);
  outline-offset: 2px;
}

.custom-select__button--placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.custom-select__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
}

.custom-select__icon svg {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

.custom-select__transition-enter-active,
.custom-select__transition-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}

.custom-select__transition-enter-from,
.custom-select__transition-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.custom-select__list {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  right: 0;
  z-index: 12;
  display: grid;
  gap: 0.1rem;
  max-height: 240px;
  margin: 0;
  padding: 0.4rem;
  list-style: none;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(22, 12, 32, 0.98);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35);
  overflow-y: auto;
}

.custom-select__option {
  display: block;
  padding: 0.45rem 0.6rem;
  border-radius: 0.55rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}

.custom-select__option--active {
  background: rgba(255, 45, 85, 0.2);
  color: rgba(255, 255, 255, 0.92);
}

.custom-select__option--selected {
  background: rgba(255, 45, 85, 0.35);
  color: rgba(255, 255, 255, 0.96);
}

.custom-select--disabled .custom-select__button {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
