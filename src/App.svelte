<script lang="ts">
  // ===================
  // THIS IS SUCH A MESS
  // ===================
  import FilterBoard from "./FilterBoard.svelte";

  let slope = 1;
  let fundamental = 100;

  const partials = Array.from({ length: 40 }, (_, i) => ({
    freq: fundamental * (i + 1),
    amplitude: 0,
  }));

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

  $: freqs = partials.map(p => p.freq);
  $: minFreq = freqs.reduce((acc, freq) => freq < acc ? freq : acc);
  $: maxFreq = freqs.reduce((acc, freq) => freq > acc ? freq : acc);
  $: maxAmplitude = partials.reduce((acc, { amplitude }) => amplitude > acc ? amplitude : acc, 0);

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

  const nodes = partials.map(partial => {
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = partial.amplitude;

    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = partial.freq;

    oscillator.connect(gainNode);
    gainNode.connect(filterNodes[0]);

    return { oscillator, gainNode };
  })

  $: {
    for (let i = 0; i < partials.length; i += 1) {
      const freq = fundamental * (i + 1);
      const amp = 1 / (i**slope + 2);
      const {gainNode, oscillator} = nodes[i];
      partials[i].amplitude = amp;
      partials[i].freq = freq;
      gainNode.gain.value = amp;
      oscillator.frequency.value = freq;
    }
  }

  $: if (isPlaying === 1) {
    nodes.forEach(({ oscillator }) => oscillator.start());
  } else if (isPlaying === 0) {
    nodes.forEach(({ oscillator }) => oscillator.stop());
  }

  const onFilterMove = (filterIdx: number, dFreq: number, dGain: number) => {
    filters[filterIdx].centerFreq += dFreq;
    filters[filterIdx].gain += dGain;
  };
</script>

<main>
  <div>
      <FilterBoard minFreq={minFreq} maxFreq={maxFreq} filters={filters} onMove={onFilterMove} />

      <div>
        <div>Slope</div>
        <input type="range" min="1" max="2" step="0.1" on:input={e => slope = Number(e.currentTarget.value)} value={slope}>
      </div>

      <div>
        <div>Fundamental</div>
        <input type="range" min="100" max="200" step="20" on:input={e => fundamental = Number(e.currentTarget.value)} value={fundamental}>
      </div>

      <div class="partial-board">
        {#each partials as { freq, amplitude }}
          <div class="partial" style="left: {(freq - minFreq) / (maxFreq - minFreq) * 100}%; height: {amplitude / maxAmplitude * 100}%" />
        {/each}
      </div>

      <div class="freq-axis">
        <div>{minFreq}Hz</div>
        <div class="max-freq">{maxFreq}Hz</div>
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
    position: relative;
    height: 300px;
  }

  .partial {
    position: absolute;
    bottom: 0;
    width: 2px;
    background: slateblue;
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
