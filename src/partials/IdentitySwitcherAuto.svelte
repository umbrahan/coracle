<script lang="ts">
  import {onMount} from "svelte"
  import {isMobile} from "src/util/html"
  import IdentitySwitcher from "src/partials/IdentitySwitcher.svelte"
  import IdentitySwitcherMobile from "src/partials/IdentitySwitcherMobile.svelte"

  export let size: "sm" | "md" | "lg" = "md"
  export let showLabel = false

  let mobile = false

  onMount(() => {
    mobile = isMobile
  })
</script>

{#if mobile}
  <IdentitySwitcherMobile {size} {showLabel} on:addAccount on:settings on:switched />
{:else}
  <IdentitySwitcher {size} {showLabel} on:addAccount on:settings on:switched />
{/if}
