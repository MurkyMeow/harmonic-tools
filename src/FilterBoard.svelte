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

  let canvas: HTMLCanvasElement;
  let wrap: HTMLElement;

  let draggingFilterIdx = -1;

  let width = 0;

  $: events = draggingFilterIdx >= 0 ? ({
    onPointerMove(e: MouseEvent) {
      const dx = (maxFreq - minFreq) / width * e.movementX;
      const dy = maxGain / height * e.movementY;
      onMove(draggingFilterIdx, dx, -dy);
    },
    onPointerUp() {
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
</style>
