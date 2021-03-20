<script lang="ts">
  import type { IFilter } from "./types";

  export let filters: IFilter[];
  export let minFreq: number;
  export let maxFreq: number;
  export let onMove: (filterIdx: number, dFreq: number, dGain: number) => void;

  let canvas: HTMLCanvasElement

  const onPointerDown = (filterIdx: number) => () => {
    const { width } = canvas;

    const onPointerMove = (e: MouseEvent) => {
      onMove(filterIdx, (maxFreq - minFreq) / width * e.movementX, 0 && e.movementY);
    };

    document.addEventListener('pointermove', onPointerMove);

    document.addEventListener('pointerup', () => {
      document.removeEventListener('pointermove', onPointerMove);
    }, { once: true });
  };

  const RESOLUTION = 4;
  const LINE_WIDTH = 3;

  $: ctx = canvas && canvas.getContext('2d');

  $: if (ctx) {
    ctx.lineWidth = LINE_WIDTH;
  }

  $: if (ctx) {
    const { width, height } = canvas;

    const size = Math.floor(width / RESOLUTION);
    const output = Array(size);
    const freqScaling = (maxFreq - minFreq) / size;

    for (let i = 0; i < size; i += 1) {
      const freq = i * freqScaling  + minFreq;

      output[i] = 0;

      for (const filter of filters) {
        output[i] += filter.gain * 5 * Math.exp(-Math.pow(freq - filter.centerFreq, 2) / Math.pow(filter.bandwidth / 2, 2))
      }
    }

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath()
    ctx.moveTo(0, height);

    for (let i = 0; i < size; i += 1) {
      ctx.lineTo(i * RESOLUTION, height - output[i] - LINE_WIDTH);
    }

    ctx.stroke();
    ctx.closePath();
  }
</script>

<div class="wrap">
  {#each filters as { centerFreq, gain }, i}
    <div class="handle" style="left: {(centerFreq - minFreq) / (maxFreq - minFreq) * 100}%; bottom: {gain}px" on:pointerdown={onPointerDown(i)} />
  {/each}
  <canvas bind:this={canvas} width="800" height="200" />
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
