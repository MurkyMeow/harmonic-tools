<script lang="ts">
  export let icon: string;
</script>

<svg class={$$props.class}>
  <use xlink:href={`#${icon}`} />
</svg>

<style>
  svg {
    display: block;
  }
</style>
