<script lang="ts">
  // ===================
  // THIS IS SUCH A MESS
  // ===================
  import FilterBoard from './FilterBoard.svelte';
  import OscillatorNode from './OscillatorNode.svelte';

  const MIN_FREQ = 100;
  const MAX_FREQ = 4000;
  const FREQ_STEP = 100;

  const PARTIAL_BOARD_H = 300;

  const MAX_AMPLITUDE = 20;

  let slope = 1;
  let fundamental = 100;

  const partialAmplitudes = Array.from({ length: Math.floor((MAX_FREQ - MIN_FREQ) / FREQ_STEP) }, () => 0);

  const filters = [
    {
      centerFreq: 490,
      bandwidth: 300,
      gain: 20,
    },
    {
      centerFreq: 1470,
      bandwidth: 300,
      gain: 20,
    },
    {
      centerFreq: 2450,
      bandwidth: 200,
      gain: 20,
    },
    {
      centerFreq: 3430,
      bandwidth: 200,
      gain: 20,
    },
  ];

  const audioCtx = new AudioContext();

  let isPlaying = -1;

  function handlePlay() {
    isPlaying = isPlaying <= 0 ? 1 : 0;
  }

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
  };

  let draggingPartialIdx = -1;

  $: partialEvents = draggingPartialIdx > 0 && ({
    onpointermove(e: MouseEvent) {
      const current = partialAmplitudes[draggingPartialIdx];

      const delta = MAX_AMPLITUDE / PARTIAL_BOARD_H * e.movementY;

      partialAmplitudes[draggingPartialIdx] = Math.min(Math.max(current - delta, 0), MAX_AMPLITUDE);
    },
    onpointerup() {
      draggingPartialIdx = -1;
    },
  })
</script>

<main {...partialEvents}>
  <div>
      <FilterBoard minFreq={MIN_FREQ} maxFreq={MAX_FREQ} filters={filters} onMove={onFilterMove} />

      <div>
        <div>Slope</div>
        <input type="range" min="1" max="2" step="0.1" on:input={e => slope = Number(e.currentTarget.value)} value={slope}>
      </div>

      <div>
        <div>Fundamental</div>
        <input type="range" min="100" max="200" step="20" on:input={e => fundamental = Number(e.currentTarget.value)} value={fundamental}>
      </div>

      <div class="partial-board" style="height: {PARTIAL_BOARD_H}px">
        {#each partialAmplitudes as amplitude, i}
          <div class="partial" style={amplitude > 0 ? `height: ${amplitude / MAX_AMPLITUDE * 100}%` : undefined}>
            <div class="partial-handle" on:pointerdown={() => draggingPartialIdx = i}></div>
            <div class="partial-body"></div>
          </div>
          {#if isPlaying > 0 && amplitude > 0}
            <OscillatorNode audioCtx={audioCtx} audioParent={filterNodes[0]} amplitude={amplitude / MAX_AMPLITUDE} freq={MIN_FREQ + i * FREQ_STEP} />
          {/if}
        {/each}
      </div>

      <div class="freq-axis">
        <div>{MIN_FREQ}Hz</div>
        <div class="max-freq">{MAX_FREQ}Hz</div>
      </div>

      <div class="controls">
        <button on:click={handlePlay}>{isPlaying > 0 ? 'stop' : 'play'}</button>
      </div>

  </div>
</main>

<style>
  main {
    max-width: 800px;
    height: 200px;
    margin: auto;
  }

  .partial-board {
    --handle-size: 10px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .partial {
    user-select: none;
    min-height: var(--handle-size);
  }

  .partial-handle {
    cursor: pointer;
    width: var(--handle-size);
    height: var(--handle-size);
    border-radius: 50%;
    background: blue;
  }

  .partial-body {
    width: 2px;
    height: calc(100% - var(--handle-size));
    margin: 0 auto;
    background: blue;
  }

  .freq-axis {
    display: flex;
    justify-content: space-between;
  }

  .max-freq {
    transform: translateX(100%);
  }

  .controls {
    text-align: center;
    margin-top: 50px;
  }
</style>
