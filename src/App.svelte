<script lang="ts">
  // ===================
  // THIS IS SUCH A MESS
  // ===================
  import FilterBoard from './FilterBoard.svelte';
  import OscillatorNode from './OscillatorNode.svelte';

  let minFreq = 100;
  let maxFreq = 3000;
  let freqStep = 50;

  const MAX_AMPLITUDE = 20;
  const MAX_GAIN = 20;

  const PARTIAL_BOARD_H = 300;

  let partialAmplitudes = Array.from({ length: Math.floor((maxFreq - minFreq) / freqStep) }, () => 0);

  // react on length changes
  $: partialAmplitudes.length = Math.floor((maxFreq - minFreq) / freqStep);

  const filters = [
    {
      centerFreq: 490,
      bandwidth: 300,
      gain: 10,
    },
    {
      centerFreq: 1470,
      bandwidth: 300,
      gain: 10,
    },
    {
      centerFreq: 2450,
      bandwidth: 200,
      gain: 10,
    },
    {
      centerFreq: 3430,
      bandwidth: 200,
      gain: 10,
    },
  ];

  const audioCtx = new AudioContext();

  let isPlaying = true;

  const filterNodes = filters.map(filter => {
    const filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'peaking';
    return filterNode;
  });

  $: {
    for (let i = 0; i < filters.length; i += 1) {
      const filter = filters[i];
      const filterNode = filterNodes[i];
      filterNode.Q.value = filter.centerFreq / filter.bandwidth;
      filterNode.gain.value = filter.gain;
      filterNode.frequency.value = filter.centerFreq;
    }
  }

  [...filterNodes, audioCtx.destination].reduce((prevNode, node) => {
    prevNode.connect(node)
    return node
  });

  const onFilterMove = (filterIdx: number, dFreq: number, dGain: number) => {
    filters[filterIdx].centerFreq += dFreq;
    filters[filterIdx].gain += dGain;

    if (filters[filterIdx].gain < 0) filters[filterIdx].gain = 0;
  };

  let draggingPartialIdx = -1;

  $: partialEvents = draggingPartialIdx > 0 ? ({
    onPointerMove(e: MouseEvent) {
      const current = partialAmplitudes[draggingPartialIdx] || 0;

      const next = current - MAX_AMPLITUDE / PARTIAL_BOARD_H * e.movementY;

      partialAmplitudes[draggingPartialIdx] = Math.min(Math.max(next, 0), MAX_AMPLITUDE);
    },
    onPointerUp() {
      draggingPartialIdx = -1;
    },
    onPointerLeave() {
      draggingPartialIdx = -1;
    },
  }) : null;
</script>

<svelte:window
  on:pointermove={partialEvents?.onPointerMove}
  on:pointerup={partialEvents?.onPointerUp}
  on:pointerleave={partialEvents?.onPointerLeave}
/>

<main>
  <div>
      <div class="options">
        <div>
          Min frequency: <input type="number" min="0" bind:value={minFreq} />
        </div>
        <div>
          Max frequency: <input type="number" min="0" bind:value={maxFreq} />
        </div>
        <div>
          Frequency step: <input type="number" min="1" bind:value={freqStep} />
        </div>
      </div>

      <FilterBoard
        minFreq={minFreq}
        maxFreq={maxFreq}
        maxGain={MAX_GAIN}
        filters={filters}
        onMove={onFilterMove}
      />

      <div class="partial-board" style="height: {PARTIAL_BOARD_H}px">
        {#each partialAmplitudes as amplitude, i}
          <div class="partial">
            <div class="partial-handle" on:pointerdown={() => draggingPartialIdx = i}></div>
            <div class="partial-body" style={amplitude > 0 ? `height: ${amplitude / MAX_AMPLITUDE * PARTIAL_BOARD_H}px` : undefined}></div>
            <div class="partial-freq">{minFreq + i * freqStep}</div>
          </div>
          {#if isPlaying && amplitude > 0}
            <OscillatorNode audioCtx={audioCtx} audioParent={filterNodes[0]} amplitude={amplitude / MAX_AMPLITUDE} freq={minFreq + i * freqStep} />
          {/if}
        {/each}
      </div>

      <div class="controls">
        <button on:click={() => isPlaying = !isPlaying}>{isPlaying ? 'stop' : 'play'}</button>
      </div>

  </div>
</main>

<style>
  main {
    max-width: 1200px;
    padding: 0 20px;
    margin: auto;
  }

  .options {
    text-align: center;
    margin-bottom: 20px;
  }

  .partial-board {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .partial {
    user-select: none;
  }

  .partial-handle {
    cursor: pointer;
    width: 10px;
    height: 10px;
    margin: 0 auto;
    border-radius: 50%;
    background: blue;
  }

  .partial-body {
    width: 2px;
    margin: 0 auto;
    background: blue;
  }

  .partial-freq {
    font-size: 10px;
    writing-mode: vertical-rl;
    height: 40px;
    transform: translateX(10px) rotate(-45deg);
  }

  .controls {
    text-align: center;
    margin-top: 50px;
  }
</style>
