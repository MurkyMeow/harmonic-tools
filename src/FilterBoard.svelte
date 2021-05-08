<script lang="ts">
  import { tick, onMount } from 'svelte';
  import { getFiltersGainAtFreq } from './lib/filter';

  import type { IFilter } from './types';

  export let filters: IFilter[];
  export let minFreq: number;
  export let maxFreq: number;
  export let maxGain: number;
  export let height: number;
  export let onMove: (filterIdx: number, dFreq: number, dGain: number) => void;
  export let onAdd: (frequency: number) => void;
  export let onRemove: (filterIdx: number) => void;

  const REMOVE_THRESHOLD = 1.5;

  let canvas: HTMLCanvasElement;
  let wrap: HTMLElement;

  let draggingFilterIdx = -1;

  let width = 0;

  $: isRemoving = draggingFilterIdx >= 0 && filters[draggingFilterIdx].gain < REMOVE_THRESHOLD

  $: events = draggingFilterIdx >= 0 ? ({
    onPointerMove(e: MouseEvent) {
      const dx = (maxFreq - minFreq) / width * e.movementX;
      const dy = maxGain / height * e.movementY;
      onMove(draggingFilterIdx, dx, -dy);
    },
    onPointerUp() {
      if (filters[draggingFilterIdx].gain < REMOVE_THRESHOLD) {
        onRemove(draggingFilterIdx);
      }
      draggingFilterIdx = -1;
    },
    onPointerLeave() {
      draggingFilterIdx = -1;
    },
  }) : null;

  const RESOLUTION = 4;
  const LINE_WIDTH = 3;

  $: ctx = canvas?.getContext('2d');

  $: if (width && height) { // avoid rendering when w,h are not set
    tick().then(() => {
      if (!ctx) return;

      const size = Math.floor(width / RESOLUTION);
      const freqScaling = (maxFreq - minFreq) / size;
      const gainScaling = height / maxGain;

      ctx.clearRect(0, 0, width, height);
      ctx.beginPath()
      ctx.moveTo(0, height);

      for (let i = 0; i < size; i += 2) {
        const freq = i * freqScaling + minFreq;
        const gain = gainScaling * getFiltersGainAtFreq(filters, freq);
        ctx.lineTo(i * RESOLUTION, height - gain - LINE_WIDTH);
      }

      ctx.fill();
      ctx.closePath();
    });
  }

  const onResize = () => {
    width = wrap.clientWidth;

    // these reset after resize, set them again
    tick().then(() => {
      if (ctx) {
        ctx.lineWidth = LINE_WIDTH;
        const gradient = ctx.createLinearGradient(0, -300, 0, 300);
        gradient.addColorStop(0, '#565f77');
        gradient.addColorStop(1, '#16181d');
        ctx.fillStyle = gradient;
      }
    });
  };

  onMount(() => {
    onResize();
  });
</script>

<svelte:window
  on:pointermove={events?.onPointerMove}
  on:pointerup={events?.onPointerUp}
  on:pointerleave={events?.onPointerLeave}
  on:resize={onResize}
/>

<div class="wrap" bind:this={wrap}>
  {#each filters as { centerFreq, gain }, i}
    <button class="handle" style="left: {(centerFreq - minFreq) / (maxFreq - minFreq) * 100}%; bottom: {gain / maxGain * 100}%" on:pointerdown={() => draggingFilterIdx = i} />
  {/each}
  <div class="bottom-area remove-area" style="height: {REMOVE_THRESHOLD / maxGain * 100}%; opacity: {isRemoving ? 1 : 0}">
    Remove
  </div>
  {#if draggingFilterIdx < 0}
    <button class="bottom-area add-area" style="height: {REMOVE_THRESHOLD / maxGain * 100}%;" on:pointerdown={e => onAdd(e.clientX)}>
      Add
    </button>
  {/if}
  <canvas bind:this={canvas} width={width} height={height} />
</div>

<style>
  .wrap {
    position: relative;
    background: #131417;
    border-radius: var(--board-border-radius);
  }

  .handle {
    user-select: none;
    position: absolute;
    cursor: pointer;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-orange);
    transform: translate(-50%, 0);
  }

  .bottom-area {
    font-size: 13px;
    text-align: center;
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    transition: opacity .3s linear;
  }

  .remove-area {
    background: linear-gradient(#FF3B6B, #3f0f1a);
  }

  .add-area {
    background: linear-gradient(#227200, #122f03);
  }
  .add-area:not(:hover) {
    opacity: 0;
  }
</style>
