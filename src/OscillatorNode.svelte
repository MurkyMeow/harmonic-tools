<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  export let freq: number;
  export let amplitude: number;
  export let audioCtx: AudioContext;
  export let audioParent: AudioNode;

  const oscillator = audioCtx.createOscillator();
  $: oscillator.frequency.value = freq;

  const gainNode = audioCtx.createGain();
  $: gainNode.gain.value = amplitude;

  onMount(() => {
    oscillator.connect(gainNode);
    gainNode.connect(audioParent);
    oscillator.start();
  })

  onDestroy(() => {
    gainNode.disconnect();
  });
</script>
