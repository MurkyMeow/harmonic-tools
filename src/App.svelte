<script lang="ts">
  // ===================
  // THIS IS SUCH A MESS
  // ===================

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

  const H = 200;

  let gcanvas: HTMLCanvasElement | undefined

  function drawFilters(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return;

    gcanvas = canvas;

    const RESOLUTION = 4;
    const LINE_WIDTH = 3;
    const { width, height } = canvas;

    const size = Math.floor(width / RESOLUTION)
    const input = Array.from({ length: size }, (_, i) => i / size * (maxFreq - minFreq) + minFreq);
    const output = Array(size).fill(0);

    for (const filter of filters) {
      for (let i = 0; i < size; i += 1) {
        output[i] += filter.gain * 5 * Math.exp(-Math.pow(input[i] - filter.centerFreq, 2) / Math.pow(filter.bandwidth / 2, 2))
      }
    }

    ctx.lineWidth = LINE_WIDTH;

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath()
    ctx.moveTo(0, H);

    for (let i = 0; i < size; i += 1) {
      ctx.lineTo(i * RESOLUTION, H - output[i] - LINE_WIDTH);
    }

    ctx.stroke();
    ctx.closePath()
  }

  const onPointerDown = (filterIdx: number) => () => {
    const onPointerMove = (e: MouseEvent) => {
      if (!gcanvas) return;

      const { width } = gcanvas;

      // filters[filterIdx].gain -= e.movementY;
      filters[filterIdx].centerFreq += (maxFreq - minFreq) / width * e.movementX;

      drawFilters(gcanvas);
    }

    document.addEventListener('pointermove', onPointerMove)

    document.addEventListener('pointerup', () => {
      document.removeEventListener('pointermove', onPointerMove)
    }, { once: true })
  };

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

  $: {
    if (gcanvas && fundamental) drawFilters(gcanvas);
  }
</script>

<main>
  <div>
      <div class="filter-board">
        {#each filters as { centerFreq, gain }, i}
          <div class="filter-handle" style="left: {(centerFreq - minFreq) / (maxFreq - minFreq) * 100}%; bottom: {gain}px" on:pointerdown={onPointerDown(i)} />
        {/each}
        <canvas use:drawFilters width="800" height="200" />
      </div>

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

  .filter-board {
    position: relative;
    height: 200px;
  }

  .filter-handle {
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
