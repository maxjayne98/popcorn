<script setup lang="ts">
import { computed } from 'vue';
import CustomSelect from '@/components/CustomSelect.vue';
import type { TVMazeShow } from '@/types/tvmaze';

type RuntimeFilter = 'all' | 'short' | 'medium' | 'long';
type SelectOption = {
  value: string;
  label: string;
};

const props = defineProps<{
  allShows: readonly TVMazeShow[];
  runtimeFilter: RuntimeFilter;
  languageFilter: string;
  networkFilter: string;
}>();

const emit = defineEmits<{
  'update:runtimeFilter': [value: RuntimeFilter];
  'update:languageFilter': [value: string];
  'update:networkFilter': [value: string];
}>();

const runtimeOptions: SelectOption[] = [
  { value: 'all', label: 'Any runtime' },
  { value: 'short', label: '< 30 min' },
  { value: 'medium', label: '30-60 min' },
  { value: 'long', label: '> 60 min' },
];

const languageOptions = computed<SelectOption[]>(() => {
  const set = new Set<string>();
  for (const show of props.allShows) {
    if (show.language) {
      set.add(show.language);
    }
  }
  const languages = Array.from(set).sort((a, b) => a.localeCompare(b));
  return [
    { value: 'all', label: 'Any language' },
    ...languages.map((language) => ({ value: language, label: language })),
  ];
});

const networkOptions = computed<SelectOption[]>(() => {
  const set = new Set<string>();
  for (const show of props.allShows) {
    if (show.network?.name) {
      set.add(show.network.name);
    }
  }
  const networks = Array.from(set).sort((a, b) => a.localeCompare(b));
  return [
    { value: 'all', label: 'Any network' },
    ...networks.map((network) => ({ value: network, label: network })),
  ];
});
</script>

<template>
  <div class="show-filters">
    <label>
      <span>Runtime</span>
      <CustomSelect
        :model-value="runtimeFilter"
        :options="runtimeOptions"
        @update:model-value="emit('update:runtimeFilter', $event as RuntimeFilter)"
      />
    </label>
    <label>
      <span>Language</span>
      <CustomSelect
        :model-value="languageFilter"
        :options="languageOptions"
        @update:model-value="emit('update:languageFilter', $event)"
      />
    </label>
    <label>
      <span>Network</span>
      <CustomSelect
        :model-value="networkFilter"
        :options="networkOptions"
        @update:model-value="emit('update:networkFilter', $event)"
      />
    </label>
  </div>
</template>

<style scoped lang="scss">
.show-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.show-filters label {
  display: grid;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.65);
}
</style>

