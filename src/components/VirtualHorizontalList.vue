<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  items: unknown[];
  itemWidth: number;
  itemGap?: number;
  itemHeight?: number;
  buffer?: number;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const viewportWidth = ref(0);
const scrollLeft = ref(0);

const gap = computed(() => props.itemGap ?? 16);
const buffer = computed(() => Math.max(0, props.buffer ?? 3));
const itemWidth = computed(() => props.itemWidth);
const itemSize = computed(() => itemWidth.value + gap.value);

const totalWidth = computed(() => {
  const count = props.items.length;
  if (!count) return 0;
  const itemsWidth = count * itemWidth.value;
  const gapsWidth = Math.max(0, count - 1) * gap.value;
  return itemsWidth + gapsWidth;
});

const startIndex = computed(() => Math.max(0, Math.floor(scrollLeft.value / itemSize.value) - buffer.value));
const visibleCount = computed(() => {
  if (!itemSize.value) {
    return props.items.length;
  }
  const base = Math.ceil(viewportWidth.value / itemSize.value);
  return Math.min(props.items.length, base + buffer.value * 2);
});

const endIndex = computed(() => Math.min(props.items.length, startIndex.value + visibleCount.value));

const visibleEntries = computed(() => {
  const entries = [];
  for (let i = startIndex.value; i < endIndex.value; i += 1) {
    entries.push({ item: props.items[i], index: i });
  }
  return entries;
});

const startOffset = computed(() => startIndex.value * itemSize.value);

const itemsStyle = computed(() => {
  const style: Record<string, string> = {
    transform: `translateX(${startOffset.value}px)`,
    gap: `${gap.value}px`,
  };
  if (props.itemHeight) {
    style.height = `${props.itemHeight}px`;
  }
  return style;
});

const spacerStyle = computed(() => {
  const style: Record<string, string> = {
    width: `${totalWidth.value}px`,
  };
  if (props.itemHeight) {
    style.height = `${props.itemHeight}px`;
  }
  return style;
});

const cellStyle = computed(() => {
  const style: Record<string, string> = {
    width: `${itemWidth.value}px`,
    minWidth: `${itemWidth.value}px`,
  };
  if (props.itemHeight) {
    style.height = `${props.itemHeight}px`;
  }
  return style;
});

let resizeObserver: ResizeObserver | null = null;

function updateViewportWidth() {
  const el = containerRef.value;
  viewportWidth.value = el ? el.clientWidth : 0;
}

function handleScroll() {
  const el = containerRef.value;
  scrollLeft.value = el ? el.scrollLeft : 0;
}

onMounted(() => {
  const el = containerRef.value;
  if (!el) {
    return;
  }
  updateViewportWidth();
  handleScroll();
  el.addEventListener('scroll', handleScroll, { passive: true });
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      updateViewportWidth();
    });
    resizeObserver.observe(el);
  } else {
    window.addEventListener('resize', updateViewportWidth);
  }
});

onBeforeUnmount(() => {
  const el = containerRef.value;
  if (el) {
    el.removeEventListener('scroll', handleScroll);
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  } else {
    window.removeEventListener('resize', updateViewportWidth);
  }
});

watch(
  () => props.items.length,
  () => {
    const el = containerRef.value;
    if (!el) return;
    const maxScroll = Math.max(0, totalWidth.value - viewportWidth.value);
    if (el.scrollLeft > maxScroll) {
      el.scrollLeft = maxScroll;
      scrollLeft.value = maxScroll;
    }
  }
);
</script>

<template>
  <div class="virtual-rail" ref="containerRef">
    <div class="virtual-rail__spacer" :style="spacerStyle">
      <div class="virtual-rail__items" :style="itemsStyle">
        <div
          v-for="entry in visibleEntries"
          :key="entry.index"
          class="virtual-rail__cell"
          :style="cellStyle"
        >
          <slot :item="entry.item" :index="entry.index" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.virtual-rail {
  overflow-x: auto;
  position: relative;
}

.virtual-rail__spacer {
  position: relative;
  height: 100%;
  min-height: 1px;
}

.virtual-rail__items {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: stretch;
}

.virtual-rail__cell {
  display: flex;
  align-items: stretch;
}

.virtual-rail__cell :deep(*) {
  flex: 1 1 auto;
}

.virtual-rail::-webkit-scrollbar {
  height: 6px;
}
</style>
