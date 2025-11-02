import { computed, ref } from 'vue';

export interface ParallaxOptions {
  range?: number;
}

export function useParallaxBackground(options: ParallaxOptions = {}) {
  const range = options.range ?? 32;
  const shiftX = ref(0);
  const shiftY = ref(0);

  const parallaxStyle = computed(() => ({
    '--parallax-shift-x': `${shiftX.value.toFixed(2)}px`,
    '--parallax-shift-y': `${shiftY.value.toFixed(2)}px`,
  }));

  function updateFromEvent(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      return;
    }
    const rect = target.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;
    shiftX.value = (relativeX - 0.5) * range;
    shiftY.value = (relativeY - 0.5) * range;
  }

  function reset() {
    shiftX.value = 0;
    shiftY.value = 0;
  }

  return {
    parallaxStyle,
    onMouseMove: updateFromEvent,
    onMouseEnter: updateFromEvent,
    onMouseLeave: reset,
    reset,
    shiftX,
    shiftY,
  };
}

export type UseParallaxBackgroundReturn = ReturnType<typeof useParallaxBackground>;
