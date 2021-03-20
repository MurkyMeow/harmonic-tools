<script lang="ts">
  import { tick, onMount } from 'svelte';

  import type { IFilter } from './types';

  export let filters: IFilter[];
  export let minFreq: number;
  export let maxFreq: number;
  export let maxGain: number;
  export let onMove: (filterIdx: number, dFreq: number, dGain: number) => void;

  let canvas: HTMLCanvasElement;
  let wrap: HTMLElement;

  let draggingFilterIdx = -1;

  let width = 0;
  let height = 0;

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

      for (let i = 0; i < size; i += 1) {
        const freq = i * freqScaling + minFreq;

        let output = 0;

        for (const filter of filters) {
          output += filter.gain * gainScaling * Math.exp(-Math.pow(freq - filter.centerFreq, 2) / Math.pow(filter.bandwidth / 2, 2))
        }

        ctx.lineTo(i * RESOLUTION, height - output - LINE_WIDTH);
      }

      ctx.stroke();
      ctx.closePath();
    });
  }

  const onResize = () => {
    width = wrap.clientWidth;
    height = wrap.clientHeight;

    tick().then(() => {
      if (ctx) ctx.lineWidth = LINE_WIDTH;
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
    <div class="handle" style="left: {(centerFreq - minFreq) / (maxFreq - minFreq) * 100}%; bottom: {gain / maxGain * 100}%" on:pointerdown={() => draggingFilterIdx = i} />
  {/each}
  <canvas bind:this={canvas} width={width} height={height} />
</div>

<style>
  .wrap {
    position: relative;
    height: 200px;
  }

  .handle {
    user-select: none;
    position: absolute;
    cursor: pointer;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: orange;
    border: 1px solid #000;
    transform: translate(-50%, 0);
  }
</style>
