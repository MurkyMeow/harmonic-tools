<script lang="ts">
  // ===================
  // THIS IS SUCH A MESS
  // ===================
  import FilterBoard from './FilterBoard.svelte';
  import OscillatorNode from './OscillatorNode.svelte';

  import SvgSprite from './svg/SvgSprite.svelte';
  import SvgIcon from './svg/SvgIcon.svelte';
  import { IC_PLAY, IC_PAUSE } from './svg/icons';

  import { getFiltersGainAtFreq } from './lib/filter';

  let minFreq = 100;
  let maxFreq = 4000;
  let freqStep = 100;

  const MAX_AMPLITUDE = 20;
  const MAX_GAIN = 20;

  const PARTIAL_BOARD_H = 250;
  const FILTER_BOARD_H = 200;

  let partialAmplitudes = Array.from({ length: Math.floor((maxFreq - minFreq) / freqStep) }, () => 0);

  // react on length changes
  $: partialAmplitudes.length = Math.floor((maxFreq - minFreq) / freqStep);

  let filters = [
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

  const onFilterAdd = (freq: number) => {
    filters = [...filters, { centerFreq: freq, gain: 3, bandwidth: 200 }];
  };

  const onFilterRemove = (filterIdx: number) => {
    filters = filters.filter((_, i) => i !== filterIdx);
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

<SvgSprite />

<main>
  <div class="settings">
    <div class="settings-group">Objects</div>

    <div class="settings-objects">
      <details class="object">
        <summary class="object-title">Harmonic series #0</summary>
        <div>
          Min frequency: <input type="number" min="0" bind:value={minFreq} />
        </div>
        <div>
          Max frequency: <input type="number" min="0" bind:value={maxFreq} />
        </div>
        <div>
          Frequency step: <input type="number" min="1" bind:value={freqStep} />
        </div>
      </details>

      {#each filters as { centerFreq, gain }, i}
        <details class="object">
          <summary class="object-title">
            Filter
            <button class="object-remove" on:click={() => filters = filters.filter((_, j) => i !== j)}>remove</button>
          </summary>
          <div class="field">
            <span>{`Center: ${centerFreq.toFixed(0)}Hz`}</span>
            <input type="range" min={minFreq} max={maxFreq} bind:value={centerFreq} />
          </div>
          <div class="field">
            <span>{`Gain: ${gain.toFixed(0)}dB`}</span>
            <input type="range" min={0} max={MAX_GAIN} bind:value={gain} />
          </div>
        </details>
      {/each}
    </div>
    
    <div class="controls">
      <button class="toggle-btn" on:click={() => isPlaying = !isPlaying}>
        <SvgIcon class="toggle-icon" icon={isPlaying ? IC_PAUSE : IC_PLAY} />
      </button>
    </div>
  </div>

  <div class="view">
      <FilterBoard
        minFreq={minFreq}
        maxFreq={maxFreq}
        maxGain={MAX_GAIN}
        filters={filters}
        height={FILTER_BOARD_H}
        onMove={onFilterMove}
        onAdd={onFilterAdd}
        onRemove={onFilterRemove}
      />

      <div class="partial-board" style="height: {PARTIAL_BOARD_H}px">
        {#each partialAmplitudes as amplitude, i}
          <div class="partial">
            {#if amplitude > 0}
              <div class="partial-gain" style={`height: ${(FILTER_BOARD_H / MAX_GAIN) * getFiltersGainAtFreq(filters, minFreq + i * freqStep)}px`}></div>
            {/if}
            <div class="partial-handle" on:pointerdown={() => draggingPartialIdx = i}></div>
            {#if amplitude > 0}
              <div class="partial-body" style={`height: ${amplitude / MAX_AMPLITUDE * PARTIAL_BOARD_H}px`}></div>
            {/if}
            <div class="partial-freq">{minFreq + i * freqStep}</div>
          </div>
          {#if isPlaying && amplitude > 0}
            <OscillatorNode audioCtx={audioCtx} audioParent={filterNodes[0]} amplitude={amplitude / MAX_AMPLITUDE} freq={minFreq + i * freqStep} />
          {/if}
        {/each}
      </div>

  </div>
</main>

<style>
  main {
    display: flex;
    padding: 50px 20px;
  }

  .settings {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 500px;
    padding: 10px 10px 0;
    border: 2px solid var(--color-orange);
  }

  .settings-objects {
    height: 370px;
    overflow-y: scroll;
  }

  .settings-group {
    color: var(--color-gray);
    margin-bottom: 10px;
  }

  .field {
    display: flex;
    align-items: center;
  }
  .field span {
    width: 150px;
  }

  .object[open] .object-title::before {
    content: '-';
  }
  .object-title {
    cursor: pointer;
    display: flex;
    align-items: center;
    min-height: 40px;
    border-top: 1px solid var(--color-gray);
  }
  .object-title::before {
    content: '+';
    margin-right: 5px;
  }
  .object-remove {
    font-size: 14px;
    color: #FF3B6B;
    margin-left: auto;
    border: 2px solid #FF3B6B;
    padding: 3px 8px;
  }

  .view {
    flex: 1;
    margin-left: var(--board-spacing);
  }

  .partial-board {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    background: #122005;
    border-radius: var(--board-border-radius);
    margin-top: var(--board-spacing);
  }

  .partial {
    position: relative;
    user-select: none;
    width: 10px;
  }

  .partial-gain {
    opacity: 0.25;
    width: 100%;
    background: #227200;
  }

  .partial-handle {
    cursor: pointer;
    width: 100%;
    height: 10px;
    background: linear-gradient(to bottom, #4de601, #227200);
  }

  .partial-body {
    width: 100%;
    background: linear-gradient(to bottom, #227200, #122f03);
  }

  .partial-freq {
    position: absolute;
    top: 100%;
    font-size: 12px;
    writing-mode: vertical-rl;
    height: 40px;
    transform: translateX(10px) rotate(-45deg);
  }

  .controls {
    margin-top: auto;
    padding: 15px 0;
    border-top: 2px solid var(--color-orange);
  }

  .toggle-btn {
    display: block;
    padding: 10px;
    margin: 0 auto;
    border-radius: 50%;
    border: 2px solid var(--color-orange);
  }

  .toggle-btn :global(.toggle-icon) {
    fill: #fff;
    width: 18px;
    height: 18px;
  }
</style>
