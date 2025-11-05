import { computed, onBeforeUnmount, ref } from 'vue';

export interface ParallaxOptions {
  range?: number;
}

export function useParallaxBackground(options: ParallaxOptions = {}) {
  const range = options.range ?? 32;
  const shiftX = ref(0);
  const shiftY = ref(0);
  const pointer = { x: 0, y: 0 };
  let animationFrameId: number | null = null;
  let lastTarget: HTMLElement | null = null;
  // Coalesce pointer updates so Safari only recalculates once per frame.
  const requestFrame =
    typeof window !== 'undefined' ? window.requestAnimationFrame.bind(window) : null;
  const cancelFrame =
    typeof window !== 'undefined' ? window.cancelAnimationFrame.bind(window) : null;

  const parallaxStyle = computed(() => ({
    '--parallax-shift-x': `${shiftX.value.toFixed(2)}px`,
    '--parallax-shift-y': `${shiftY.value.toFixed(2)}px`,
  }));

  function roundToTwo(value: number) {
    return Math.round(value * 100) / 100;
  }

  function clearAnimationFrame() {
    if (animationFrameId !== null && cancelFrame) {
      cancelFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function applyParallax(target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const relativeX = (pointer.x - rect.left) / rect.width;
    const relativeY = (pointer.y - rect.top) / rect.height;
    const nextShiftX = roundToTwo((relativeX - 0.5) * range);
    const nextShiftY = roundToTwo((relativeY - 0.5) * range);

    if (nextShiftX !== shiftX.value) {
      shiftX.value = nextShiftX;
    }
    if (nextShiftY !== shiftY.value) {
      shiftY.value = nextShiftY;
    }
  }

  function scheduleUpdate(target: HTMLElement) {
    lastTarget = target;

    if (!requestFrame) {
      applyParallax(target);
      return;
    }

    if (animationFrameId !== null) {
      return;
    }

    animationFrameId = requestFrame(() => {
      animationFrameId = null;
      if (!lastTarget) {
        return;
      }
      applyParallax(lastTarget);
    });
  }

  function updatePointer(event: MouseEvent) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  }

  function handlePointerEnter(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      return;
    }
    updatePointer(event);
    scheduleUpdate(target);
  }

  function handlePointerMove(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      return;
    }
    updatePointer(event);
    scheduleUpdate(target);
  }

  function reset() {
    clearAnimationFrame();
    lastTarget = null;
    pointer.x = 0;
    pointer.y = 0;
    shiftX.value = 0;
    shiftY.value = 0;
  }

  function handlePointerLeave() {
    reset();
  }

  onBeforeUnmount(reset);

  return {
    parallaxStyle,
    onMouseMove: handlePointerMove,
    onMouseEnter: handlePointerEnter,
    onMouseLeave: handlePointerLeave,
    reset,
    shiftX,
    shiftY,
  };
}

export type UseParallaxBackgroundReturn = ReturnType<typeof useParallaxBackground>;
