<script lang="ts">
  // ===================
  // THIS IS SUCH A MESS
  // ===================
  import FilterBoard from './FilterBoard.svelte';
  import OscillatorNode from './OscillatorNode.svelte';

  const MIN_FREQ = 100;
  const MAX_FREQ = 3000;
  const FREQ_STEP = 50;

  const PARTIAL_BOARD_H = 300;

  const MAX_AMPLITUDE = 20;
  const MAX_GAIN = 20;

  const partialAmplitudes = Array.from({ length: Math.floor((MAX_FREQ - MIN_FREQ) / FREQ_STEP) }, () => 0);

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
      const current = partialAmplitudes[draggingPartialIdx];

      const delta = MAX_AMPLITUDE / PARTIAL_BOARD_H * e.movementY;

      partialAmplitudes[draggingPartialIdx] = Math.min(Math.max(current - delta, 0), MAX_AMPLITUDE);
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
      <FilterBoard
        minFreq={MIN_FREQ}
        maxFreq={MAX_FREQ}
        maxGain={MAX_GAIN}
        filters={filters}
        onMove={onFilterMove}
      />

      <div class="partial-board" style="height: {PARTIAL_BOARD_H}px">
        {#each partialAmplitudes as amplitude, i}
          <div class="partial">
            <div class="partial-handle" on:pointerdown={() => draggingPartialIdx = i}></div>
            <div class="partial-body" style={amplitude > 0 ? `height: ${amplitude / MAX_AMPLITUDE * PARTIAL_BOARD_H}px` : undefined}></div>
            <div class="partial-freq">{MIN_FREQ + i * FREQ_STEP}</div>
          </div>
          {#if isPlaying && amplitude > 0}
            <OscillatorNode audioCtx={audioCtx} audioParent={filterNodes[0]} amplitude={amplitude / MAX_AMPLITUDE} freq={MIN_FREQ + i * FREQ_STEP} />
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
