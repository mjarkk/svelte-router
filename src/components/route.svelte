<script>
  export let currentRoute = {}
</script>

{#if currentRoute.layout}
  <svelte:component this={currentRoute.layout} currentRoute={{ ...currentRoute, layout: '' }} />
{:else if currentRoute.component}
  <svelte:component this={currentRoute.component} currentRoute={{ ...currentRoute, component: '' }} />
{:else if currentRoute.childRoute}
  <svelte:self currentRoute={currentRoute.childRoute} />
{/if}
